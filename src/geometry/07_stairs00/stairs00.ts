import { _M, type IArraysGeom, type A3 } from "_CORE/_M/_m"
import { rectPoint, flipUvQ } from "atlases/atlasTools"
import {
    RECT_GRAY, RECT_MOSS,
    UV_WHITE_Q, UV_GRAY_Q, UV_MOSS_Q,
} from "atlases/atlas00/atlas00"
import {
    RECT_AO_NONE, RECT_AO_TOP,
    UV_AO_NONE_Q, UV_AO_TOP_Q,
} from "atlases/atlasAo00/atlasAo00"

// Полукруглое крыльцо (ref.jpg): площадка-сектор у стены здания, по дуге — подпорная
// стенка, поднятая над площадкой парапетом. В разрывах дуги — лестницы, врезанные
// в площадку: ступени — кольцевые секторы, поднимаются от внешнего радиуса к центру.
// Здание — по линии z = pos[2], дуга выпирает в +z.
// Угол a: точка = pos + [cos(a) * rad, y, sin(a) * rad]; 0 — справа (+x), PI — слева.
//
// uv — атлас цвета atlas00, uv2 — атлас затенения atlasAo00 (aoMap, channel = 2).
// Внутренние углы (низ стенок, низ подступенка, проступь у следующего подступенка,
// площадка у парапета) затеняет aoMap; цвет вершин несёт только направленный свет.

type T_Stair = {
    // центр пролёта
    angle: number,
    // ширина пролёта по внешнему радиусу
    w: number,
}

type T = {
    pos?: A3,
    r?: number,     // внешний радиус стенки
    t?: number,     // толщина стенки
    hP?: number,    // высота площадки
    hW?: number,    // высота парапета над площадкой
    stepH?: number, // целевая высота и глубина ступени; высота подгоняется, чтобы целое число ступеней дало hP
    stepD?: number,
    stairs?: T_Stair[],
    arcStep?: number, // шаг разбиения дуги видимой геометрии и прокси
    arcStepCollide?: number,
    colWall?: A3,   // базовые цвета до запечённого освещения; умножаются на тайл атласа
    colStep?: A3,
    colTop?: A3,
}

// Освещение запекается в цвет вершин, чтобы форма читалась и на MeshBasicMaterial:
// ламберт от одного направленного «солнца» плюс заполняющий свет
const LIGHT: A3 = (() => {
    const l: A3 = [.6, .7, .45]
    const len = Math.hypot(...l)
    return [l[0] / len, l[1] / len, l[2] / len]
})()
const AMBIENT = .4
const DIFFUSE = .6

const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    r: 6,
    t: .4,
    hP: 1.2,
    hW: 1,
    stepH: .2,
    stepD: .35,
    stairs: [
        { angle: Math.PI * .3, w: 1.6 },
        { angle: Math.PI * .72, w: 1.6 },
    ],
    arcStep: .5,
    arcStepCollide: 2,
    colWall: [.95, .8, .58],
    colStep: [1, 1, 1],
    colTop: [1, 1, 1],
}

export const stairs00 = (opts: T = {}): IArraysGeom => {
    const {
        pos, r, t, hP, hW, stepH, stepD, stairs, arcStep, arcStepCollide,
        colWall, colStep, colTop,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const index: number[] = []
    const v: number[] = []
    const uv: number[] = []
    const uv2: number[] = []
    const c: number[] = []
    const vCollide: number[] = []

    const H = hP + hW
    const n = Math.max(1, Math.round(hP / stepH))
    const sh = hP / n
    // последняя ступень — сама площадка, поэтому проступей n - 1; пролёт обязан пробить стенку
    const sd = Math.max(stepD, (t + .01) / Math.max(1, n - 1))
    const rIn = Math.max(.1, r - (n - 1) * sd)

    // площадка целиком серая или заросшая; на ступенях мох — редкими пятнами
    const TYPE = Math.random() < .5 ? 'STONE' : 'MOSS'
    const rectTop = TYPE === 'STONE' ? RECT_GRAY : RECT_MOSS
    const uvStep = () => Math.random() < (TYPE === 'MOSS' ? .25 : .05) ? UV_MOSS_Q : UV_GRAY_Q

    // затенение: верх тайла AO_TOP — тень. Прямо — тень на ребре c, d квада, перевёрнуто — на a, b
    const AO_CD = UV_AO_TOP_Q
    const AO_AB = flipUvQ(UV_AO_TOP_Q)

    const P = (a: number, rad: number, y: number): A3 =>
        [pos[0] + Math.cos(a) * rad, pos[1] + y, pos[2] + Math.sin(a) * rad]
    // касательная по росту угла и радиальная нормаль
    const T_ = (a: number): A3 => [-Math.sin(a), 0, Math.cos(a)]
    const R_ = (a: number): A3 => [Math.cos(a), 0, Math.sin(a)]
    const neg = (p: A3): A3 => [-p[0], -p[1], -p[2]]
    const UP: A3 = [0, 1, 0]

    // обход выбирается по нормали-подсказке, чтобы не выписывать его для каждой грани руками
    const facesTo = (a: A3, b: A3, d: A3, nHint: A3) => {
        const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
        const e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]]
        const nx = e1[1] * e2[2] - e1[2] * e2[1]
        const ny = e1[2] * e2[0] - e1[0] * e2[2]
        const nz = e1[0] * e2[1] - e1[1] * e2[0]
        return nx * nHint[0] + ny * nHint[1] + nz * nHint[2] >= 0
    }

    // ---- запечённый свет

    type F_Nrm = (p: A3) => A3

    const lit = (base: A3, nrm: A3): number[] => {
        const d = Math.max(0, nrm[0] * LIGHT[0] + nrm[1] * LIGHT[1] + nrm[2] * LIGHT[2])
        const k = AMBIENT + DIFFUSE * d
        return [Math.min(1, base[0] * k), Math.min(1, base[1] * k), Math.min(1, base[2] * k)]
    }
    // нормаль цилиндрической грани берётся в самой вершине, а не в середине сегмента:
    // так цвет меняется вдоль дуги плавно, и изгиб виден без источника света
    const radOut: F_Nrm = p => {
        const dx = p[0] - pos[0]
        const dz = p[2] - pos[2]
        const len = Math.hypot(dx, dz) || 1
        return [dx / len, 0, dz / len]
    }
    const radIn: F_Nrm = p => neg(radOut(p))
    const flat = (nrm: A3): F_Nrm => () => nrm

    // квад a -> b -> cc -> dd по контуру: a, b — низ тайла, cc, dd — верх.
    // Своя четвёрка вершин на каждую грань. При смене обхода b и dd меняются местами
    // вместе со своими uv, иначе ориентированный тайл (AO) ляжет транспонированным
    const quad = (
        a: A3, b: A3, cc: A3, dd: A3, nHint: A3,
        uvQ: number[], uv2Q: number[], base: A3, nrmAt: F_Nrm = flat(nHint),
    ) => {
        let pts = [a, b, cc, dd]
        let order = [0, 1, 2, 3]
        if (!facesTo(a, b, cc, nHint)) {
            pts = [a, dd, cc, b]
            order = [0, 3, 2, 1]
        }
        const ind = v.length / 3
        for (let k = 0; k < 4; ++k) {
            const o = order[k]
            v.push(...pts[k])
            uv.push(uvQ[o * 2], uvQ[o * 2 + 1])
            uv2.push(uv2Q[o * 2], uv2Q[o * 2 + 1])
            c.push(...lit(base, nrmAt(pts[k])))
        }
        index.push(ind, ind + 1, ind + 2, ind, ind + 2, ind + 3)
    }

    // площадка — плоская проекция сектора в один тайл
    const topUv = (p: A3) => rectPoint(rectTop,
        Math.min(1, Math.max(0, (p[0] - pos[0] + r) / (2 * r))),
        Math.min(1, Math.max(0, (p[2] - pos[2]) / r)),
    )
    // треугольник веера: центр и две точки обода; isShadowRim — тень у обода (парапет)
    const fanTri = (cen: A3, x: A3, y: A3, isShadowRim: boolean) => {
        let pts = [cen, x, y]
        if (!facesTo(cen, x, y, UP)) pts = [cen, y, x]
        const ind = v.length / 3
        for (let k = 0; k < 3; ++k) {
            const p = pts[k]
            v.push(...p)
            uv.push(...topUv(p))
            // AO по радиусу: центр — низ тайла, обод — верх, где полоса тени
            const q = k === 0 ? 0 : 1
            uv2.push(...(isShadowRim ? rectPoint(RECT_AO_TOP, .5, q) : rectPoint(RECT_AO_NONE, .5, .5)))
            c.push(...lit(colTop, UP))
        }
        index.push(ind, ind + 1, ind + 2)
    }

    const collideQuad = (a: A3, b: A3, cc: A3, dd: A3) => {
        vCollide.push(..._M.createPolygon(a, b, cc, dd))
    }

    // разбиение интервала углов на сегменты по длине дуги внешнего радиуса
    const split = (a0: number, a1: number, step: number): number[] => {
        const count = Math.max(1, Math.ceil((a1 - a0) * r / step))
        const arr: number[] = []
        for (let i = 0; i <= count; ++i) arr.push(a0 + (a1 - a0) * i / count)
        return arr
    }

    // ---- интервалы дуги: стенка и пролёты лестниц

    const A_FROM = 0
    const A_TO = Math.PI

    type T_Span = { a0: number, a1: number, isStair: boolean }
    const spans: T_Span[] = []
    {
        const gaps = stairs
            .map(s => {
                const half = s.w / r / 2
                return { a0: Math.max(A_FROM + .01, s.angle - half), a1: Math.min(A_TO - .01, s.angle + half) }
            })
            .filter(g => g.a1 > g.a0)
            .sort((a, b) => a.a0 - b.a0)

        let cur = A_FROM
        for (const g of gaps) {
            // пересекающиеся пролёты сливаются в один
            const a0 = Math.max(cur, g.a0)
            if (g.a1 <= a0) continue
            if (a0 > cur) spans.push({ a0: cur, a1: a0, isStair: false })
            spans.push({ a0, a1: g.a1, isStair: true })
            cur = g.a1
        }
        if (cur < A_TO) spans.push({ a0: cur, a1: A_TO, isStair: false })
    }

    const center: A3 = P(0, 0, hP)

    for (let si = 0; si < spans.length; ++si) {
        const { a0, a1, isStair } = spans[si]
        const segs = split(a0, a1, arcStep)

        // площадка: веер из центра до внутренней грани стенки или до верхней ступени
        const rTop = isStair ? rIn : r - t
        for (let k = 0; k < segs.length - 1; ++k) {
            fanTri(center, P(segs[k], rTop, hP), P(segs[k + 1], rTop, hP), !isStair)
        }

        if (isStair) {
            for (let k = 0; k < segs.length - 1; ++k) {
                const s0 = segs[k]
                const s1 = segs[k + 1]
                const m = (s0 + s1) / 2
                const uvS = uvStep()
                for (let i = 0; i < n; ++i) {
                    const rad = r - i * sd
                    // подступенок: тень внизу, в углу с проступью ниже
                    const y0 = i * sh
                    quad(
                        P(s0, rad, y0), P(s1, rad, y0), P(s1, rad, y0 + sh), P(s0, rad, y0 + sh),
                        R_(m), uvS, i === 0 ? UV_AO_NONE_Q : AO_AB, colStep, radOut,
                    )
                    // проступь; у последней ступени её роль играет площадка.
                    // a, b — внешний край, cc, dd — внутренний, у следующего подступенка, там тень
                    if (i < n - 1) {
                        const y = (i + 1) * sh
                        quad(
                            P(s0, rad, y), P(s1, rad, y), P(s1, rad - sd, y), P(s0, rad - sd, y),
                            UP, uvS, AO_CD, colStep,
                        )
                    }
                }
            }
            continue
        }

        // стенка
        for (let k = 0; k < segs.length - 1; ++k) {
            const s0 = segs[k]
            const s1 = segs[k + 1]
            const m = (s0 + s1) / 2
            // снаружи и изнутри тень внизу: у земли и в углу с площадкой
            quad(P(s0, r, 0), P(s1, r, 0), P(s1, r, H), P(s0, r, H), R_(m), UV_WHITE_Q, AO_AB, colWall, radOut)
            quad(
                P(s0, r - t, hP), P(s1, r - t, hP), P(s1, r - t, H), P(s0, r - t, H), neg(R_(m)),
                UV_WHITE_Q, AO_AB, colWall, radIn,
            )
            quad(P(s0, r - t, H), P(s1, r - t, H), P(s1, r, H), P(s0, r, H), UP, UV_WHITE_Q, UV_AO_NONE_Q, colWall)
        }

        // торцы: у здания — во всю глубину площадки, у пролёта — щека лестницы от верхней ступени
        const caps: { a: number, nrm: A3, isOuter: boolean }[] = [
            { a: a0, nrm: neg(T_(a0)), isOuter: si === 0 },
            { a: a1, nrm: T_(a1), isOuter: si === spans.length - 1 },
        ]
        for (const { a, nrm, isOuter } of caps) {
            const rLow = isOuter ? 0 : rIn
            quad(P(a, rLow, 0), P(a, r - t, 0), P(a, r - t, hP), P(a, rLow, hP), nrm, UV_WHITE_Q, AO_AB, colWall)
            quad(P(a, r - t, 0), P(a, r, 0), P(a, r, H), P(a, r - t, H), nrm, UV_WHITE_Q, AO_AB, colWall)
        }
    }

    // ---- прокси: площадка, стенка с двух сторон, пандус на месте каждой лестницы

    for (const { a0, a1, isStair } of spans) {
        const segs = split(a0, a1, arcStepCollide)
        const rTop = isStair ? rIn : r - t
        for (let k = 0; k < segs.length - 1; ++k) {
            const s0 = segs[k]
            const s1 = segs[k + 1]
            vCollide.push(...center, ...P(s0, rTop, hP), ...P(s1, rTop, hP))
            if (isStair) {
                collideQuad(P(s0, r, 0), P(s1, r, 0), P(s1, rIn, hP), P(s0, rIn, hP))
            } else {
                collideQuad(P(s0, r, 0), P(s1, r, 0), P(s1, r, H), P(s0, r, H))
                collideQuad(P(s0, r - t, hP), P(s1, r - t, hP), P(s1, r - t, H), P(s0, r - t, H))
            }
        }
    }

    return { index, v, uv, uv2, c, vCollide }
}
