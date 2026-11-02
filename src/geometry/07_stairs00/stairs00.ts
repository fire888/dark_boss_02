import { _GM, type IBuffersGeom, type A2, type A3, type F_Nrm } from "_CORE/_M/_gm"
import {
    RECT_EARTH, RECT_ORNAMENT,
    UV_WHITE_Q, UV_MOSS_Q, UV_SLAB_Q,
} from "atlases/atlas00/atlas00"
import {
    RECT_AO_NONE, RECT_AO_TOP,
    UV_AO_NONE_Q, UV_AO_TOP_Q,
} from "atlases/atlasAo00/atlasAo00"

// Полукруглое крыльцо: площадка-сектор у стены здания, по дуге — подпорная
// стенка, поднятая над площадкой парапетом. В разрывах дуги — лестницы, врезанные
// в площадку: ступени — кольцевые секторы, поднимаются от внешнего радиуса к центру.
// По краю площадки — полоса плитки вдоль парапета, щёк лестниц и верхних ступеней.
// Здание — по линии z = pos[2], дуга выпирает в +z.
// Угол a: точка = pos + [cos(a) * rad, y, sin(a) * rad]; 0 — справа (+x), PI — слева.
//
// uv — атлас цвета atlas00, uv2 — атлас затенения atlasAo00 (aoMap, channel = 2).
// aoMap затеняет внутренние углы (низ внутренней стенки и подступенков над проступью,
// проступь у следующего подступенка, площадка у парапета) и низ геометрии, который будет
// примыкать к земле (низ наружной стенки, торцов, нижнего подступенка);
// цвет вершин несёт только направленный свет.

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
    wTile?: number, // ширина полосы плитки по краю площадки, она же сторона плитки
    arcStep?: number, // шаг разбиения дуги видимой геометрии
    arcStepCollide?: number, // то же для прокси, грубее
    colWall?: A3,   // базовые цвета до запечённого освещения; умножаются на тайл атласа
    colStep?: A3,
    colTop?: A3,
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    r: 6,
    t: .4,
    hP: 1.2,
    hW: 1,
    stepH: .2,
    stepD: .35,
    stairs: [
        { angle: Math.PI * .25, w: 3 },
        { angle: Math.PI * .75, w: 3 },
    ],
    wTile: .5,
    arcStep: .5,
    arcStepCollide: 2,
    colWall: [.64, .67, .7],
    colStep: [1, 1, 1],
    colTop: [1, 1, 1],
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    const r = rand(3, 8)
    const stairs: T_Stair[] = []
    // разворот от «на зрителя» (+z) — не больше 0.35 рад и с запасом стенки 0.5 у здания
    const turn = (room: number) => rand(-1, 1) * Math.min(.35, Math.max(0, room))
    if (r < 5 || Math.random() < .5) {
        // малое крыльцо — одна широкая лестница, примерно на зрителя
        const w = r * rand(.9, 1.2)
        stairs.push({ angle: Math.PI / 2 + turn(Math.PI / 2 - w / r / 2 - .5 / r), w })
    } else {
        // большое — две широкие справа и слева, пара развёрнута целиком; ширина — с запасом стенки
        // между пролётами и у здания
        const off = Math.PI * rand(.2, .3)
        const wMax = Math.min(2 * off * r - 1, 2 * ((Math.PI / 2 - off) * r - .5))
        const w = wMax * rand(.7, .9)
        const a = Math.PI / 2 + turn(Math.PI / 2 - off - w / r / 2 - .5 / r)
        stairs.push({ angle: a - off, w }, { angle: a + off, w })
    }
    // бетон бортиков: серый с лёгким оттенком, чаще холодным; ступени и площадка — множитель тайла около 1
    const g = rand(.55, .75)
    const cool = rand(-.03, .05)
    const tone = (): A3 => {
        const v = rand(.85, 1)
        return [v, v, v * rand(.95, 1)]
    }
    return {
        r,
        t: rand(.3, .6),
        hP: rand(.6, 2),
        hW: rand(.5, 1.4),
        stepH: rand(.15, .25),
        stepD: rand(.28, .45),
        stairs,
        wTile: rand(.35, .7),
        arcStep: rand(.3, 1),
        colWall: [g - cool, g, g + cool],
        colStep: tone(),
        colTop: tone(),
    }
}

export const stairs00 = (opts: T = {}): IBuffersGeom => {
    const {
        pos, r, t, hP, hW, stepH, stepD, stairs, wTile, arcStep, arcStepCollide,
        colWall, colStep, colTop,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const B = _GM.createGeomBuilder()
    const { quad, tri, collideQuad, collideTri } = B

    const H = hP + hW
    const n = Math.max(1, Math.round(hP / stepH))
    const sh = hP / n
    // последняя ступень — сама площадка, поэтому проступей n - 1; пролёт обязан пробить стенку
    // и уместиться в радиус — иначе нижние проступи проходят через центр и выворачиваются
    const sd = Math.max(Math.min(stepD, (r - .1) / Math.max(1, n - 1)), (t + .01) / Math.max(1, n - 1))
    const rIn = r - (n - 1) * sd

    // площадка — земля, подступенки — мох, проступи — плита
    const rectTop = RECT_EARTH

    // затенение: верх тайла AO_TOP — тень. Прямо — тень на ребре c, d квада, перевёрнуто — на a, b
    const AO_CD = UV_AO_TOP_Q
    const AO_AB = _GM.flipUvQ(UV_AO_TOP_Q)
    const UV_SLAB_TREAD = _GM.flipUvQ(UV_SLAB_Q)

    const P = (a: number, rad: number, y: number): A3 =>
        [pos[0] + Math.cos(a) * rad, pos[1] + y, pos[2] + Math.sin(a) * rad]
    // касательная по росту угла и радиальная нормаль
    const T_ = (a: number): A3 => [-Math.sin(a), 0, Math.cos(a)]
    const R_ = (a: number): A3 => [Math.cos(a), 0, Math.sin(a)]
    const neg = (p: A3): A3 => [-p[0], -p[1], -p[2]]
    const UP: A3 = [0, 1, 0]

    // нормаль цилиндрической грани берётся в самой вершине, а не в середине сегмента:
    // так цвет меняется вдоль дуги плавно, и изгиб виден без источника света
    const radOut: F_Nrm = p => {
        const dx = p[0] - pos[0]
        const dz = p[2] - pos[2]
        const len = Math.hypot(dx, dz) || 1
        return [dx / len, 0, dz / len]
    }
    const radIn: F_Nrm = p => neg(radOut(p))

    const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
    // площадка — плоская проекция сектора в один тайл
    const topAt = (a: number, rad: number): A2 => {
        const p = P(a, rad, hP)
        return _GM.rectPoint(rectTop, clamp01((p[0] - pos[0] + r) / (2 * r)), clamp01((p[2] - pos[2]) / r))
    }
    const AO_FREE = _GM.rectPoint(RECT_AO_NONE, .5, .5)

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

    // ---- площадка: веер из центра, по краю — полоса плитки шириной wT. Полоса идёт вдоль парапета,
    // у пролёта поворачивает вдоль щеки лестницы (полоса-«щека» — сектор шириной wT по среднему
    // радиусу) и идёт вдоль верхней ступени.
    // У парапета на площадку ложится тень шириной hW: тайл AO ложится на hW, как на внутренней
    // стенке над площадкой, поэтому полосы тени по обе стороны угла одной ширины

    const rWall = r - t
    const wT = Math.min(wTile, rIn / 2)
    const rBand0 = rIn - wT
    // доля тени на радиусе rad
    const aoQ = (rad: number) => Math.max(0, 1 - (rWall - rad) / hW)

    // ячейка площадки — сектор [s0, s1] × [ra, rb], при ra = 0 — треугольник веера.
    // Граница тени rWall - hW всегда среди границ ячеек, поэтому тень внутри ячейки линейна
    const cell = (s0: number, s1: number, ra: number, rb: number, isShaded: boolean, uvAt: (a: number, rad: number) => A2) => {
        const shaded = isShaded && aoQ(rb) > 0
        const ao = (rad: number) => shaded ? _GM.rectPoint(RECT_AO_TOP, .5, aoQ(rad)) : AO_FREE
        if (ra <= 0) {
            tri(
                center, P(s0, rb, hP), P(s1, rb, hP), UP,
                [...uvAt(s0, 0), ...uvAt(s0, rb), ...uvAt(s1, rb)], [...ao(0), ...ao(rb), ...ao(rb)], colTop,
            )
            return
        }
        quad(
            P(s0, ra, hP), P(s1, ra, hP), P(s1, rb, hP), P(s0, rb, hP), UP,
            [...uvAt(s0, ra), ...uvAt(s1, ra), ...uvAt(s1, rb), ...uvAt(s0, rb)],
            [...ao(ra), ...ao(ra), ...ao(rb), ...ao(rb)], colTop,
        )
    }
    // границы колец от центра до rEnd
    const radii = (rEnd: number, cuts: number[]): number[] => {
        const arr = [0, ...cuts.filter(c => c > 1e-4 && c < rEnd - 1e-4), rEnd].sort((a, b) => a - b)
        return arr.filter((c, i) => i === 0 || c - arr[i - 1] > 1e-4)
    }

    // кусок дуги [p0, p1] до радиуса rEnd: у края — полоса плиток вдоль дуги
    const arcPiece = (p0: number, p1: number, rEnd: number, isShaded: boolean) => {
        const rS = rEnd - wT
        const count = Math.max(1, Math.round((p1 - p0) * (rEnd - wT / 2) / wT))
        const tileA = (p1 - p0) / count
        const sub = Math.max(1, Math.ceil(tileA * rEnd / arcStep))
        const rr = radii(rEnd, isShaded ? [rS, rWall - hW] : [rS])
        for (let j = 0; j < count; ++j) {
            const t0 = p0 + j * tileA
            const tileUv = (a: number, rad: number) =>
                _GM.rectPoint(RECT_ORNAMENT, clamp01((a - t0) / tileA), clamp01((rad - rS) / wT))
            for (let k = 0; k < sub; ++k) {
                const s0 = t0 + tileA * k / sub
                const s1 = t0 + tileA * (k + 1) / sub
                for (let i = 0; i < rr.length - 1; ++i) {
                    cell(s0, s1, rr[i], rr[i + 1], isShaded, rr[i] >= rS - 1e-4 ? tileUv : topAt)
                }
            }
        }
    }

    // полоса-«щека» у пролёта: сектор [b0, b1], плитки по радиусу от rBand0 до парапета
    const bandPiece = (b0: number, b1: number) => {
        const count = Math.max(1, Math.round((rWall - rBand0) / wT))
        const tileR = (rWall - rBand0) / count
        const cuts = [rBand0, rIn, rWall - hW]
        for (let j = 1; j < count; ++j) cuts.push(rBand0 + j * tileR)
        const rr = radii(rWall, cuts)
        for (let i = 0; i < rr.length - 1; ++i) {
            const ra = rr[i]
            const rb = rr[i + 1]
            if (ra < rBand0 - 1e-4) {
                cell(b0, b1, ra, rb, true, topAt)
                continue
            }
            const tR0 = rBand0 + Math.min(count - 1, Math.floor(((ra + rb) / 2 - rBand0) / tileR)) * tileR
            cell(b0, b1, ra, rb, true, (a, rad) =>
                _GM.rectPoint(RECT_ORNAMENT, clamp01((rad - tR0) / tileR), clamp01((a - b0) / (b1 - b0))))
        }
    }

    for (let si = 0; si < spans.length; ++si) {
        const { a0, a1, isStair } = spans[si]
        if (isStair) {
            arcPiece(a0, a1, rIn, false)
            continue
        }
        // у пролётов — щёки, между ними — дуга вдоль парапета; у здания щеки нет
        const d = wT / ((rBand0 + rWall) / 2)
        let c0 = si > 0 ? a0 + d : a0
        let c1 = si < spans.length - 1 ? a1 - d : a1
        if (c0 > c1) c0 = c1 = Math.min(a1, Math.max(a0, (c0 + c1) / 2))
        if (c0 > a0) bandPiece(a0, c0)
        if (c1 > c0) arcPiece(c0, c1, rWall, true)
        if (a1 > c1) bandPiece(c1, a1)
    }

    for (let si = 0; si < spans.length; ++si) {
        const { a0, a1, isStair } = spans[si]
        const segs = split(a0, a1, arcStep)

        if (isStair) {
            for (let k = 0; k < segs.length - 1; ++k) {
                const s0 = segs[k]
                const s1 = segs[k + 1]
                const m = (s0 + s1) / 2
                for (let i = 0; i < n; ++i) {
                    const rad = r - i * sd
                    // подступенок: тень внизу — в углу с проступью ниже, у нижнего — у земли
                    const y0 = i * sh
                    quad(
                        P(s0, rad, y0), P(s1, rad, y0), P(s1, rad, y0 + sh), P(s0, rad, y0 + sh),
                        R_(m), UV_MOSS_Q, AO_AB, colStep, radOut,
                    )
                    // проступь; у последней ступени её роль играет площадка.
                    // a, b — внешний край, cc, dd — внутренний, у следующего подступенка, там тень.
                    // Плита перевёрнута: светлая фаска — на внешнем крае
                    if (i < n - 1) {
                        const y = (i + 1) * sh
                        quad(
                            P(s0, rad, y), P(s1, rad, y), P(s1, rad - sd, y), P(s0, rad - sd, y),
                            UP, UV_SLAB_TREAD, AO_CD, colStep,
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
            // тень внизу: снаружи — низ у земли, изнутри — угол с площадкой
            quad(P(s0, r, 0), P(s1, r, 0), P(s1, r, H), P(s0, r, H), R_(m), UV_WHITE_Q, AO_AB, colWall, radOut)
            quad(
                P(s0, r - t, hP), P(s1, r - t, hP), P(s1, r - t, H), P(s0, r - t, H), neg(R_(m)),
                UV_WHITE_Q, AO_AB, colWall, radIn,
            )
            quad(P(s0, r - t, H), P(s1, r - t, H), P(s1, r, H), P(s0, r, H), UP, UV_WHITE_Q, UV_AO_NONE_Q, colWall)
        }

        // торцы: у здания — во всю глубину площадки, у пролёта — щека лестницы от верхней ступени;
        // тень внизу — низ у земли
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
            collideTri(center, P(s0, rTop, hP), P(s1, rTop, hP))
            if (isStair) {
                collideQuad(P(s0, r, 0), P(s1, r, 0), P(s1, rIn, hP), P(s0, rIn, hP))
            } else {
                collideQuad(P(s0, r, 0), P(s1, r, 0), P(s1, r, H), P(s0, r, H))
                collideQuad(P(s0, r - t, hP), P(s1, r - t, hP), P(s1, r - t, H), P(s0, r - t, H))
            }
        }
    }

    return B.g
}
