import type { IArrayForBuffers } from "geometry/GeomTypes"

// Круглый зал: пол, потолок и стена по ободу радиуса r, с разрывами стены под проёмы.
// Проём задаётся парой углов — правым и левым краем сектора; в нём стены нет, а пол
// и потолок обрываются по хорде между краями, потому что к этой хорде пристыковывается
// коридор (tunnel01), и дуга обода выпирала бы в него язычком.
// Угол отсчитывается по соглашению _M.angleFromCoords2, то есть atan2(-z, x).

type A3 = number[]

export type T_Portal = {
    angleRight: number,
    angleLeft: number,
}

type T = {
    pos?: A3,
    r?: number,
    h?: number,
    // проёмы, отсортированные по возрастанию центрального угла; пустой список даёт
    // сплошное кольцо стены
    portals?: T_Portal[],
    // шаг разбиения дуги: чем меньше, тем глаже обод
    arcStep?: number,
    colFloor?: A3, colWall?: A3, colCeil?: A3,
}

const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    r: 4,
    h: 3.5,
    portals: [],
    arcStep: .5,
    colFloor: [.50, .46, .42],
    colWall: [.72, .69, .63],
    colCeil: [.16, .15, .14],
}

const TAU = Math.PI * 2
const norm = (a: number) => ((a % TAU) + TAU) % TAU

export const room00 = (opts: T = {}): IArrayForBuffers => {
    const {
        pos, r, h, portals, arcStep,
        colFloor, colWall, colCeil,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const v: number[] = []
    const c: number[] = []
    const index: number[] = []
    // прокси для физики: та же форма, но развёрнутая в triangle soup, потому что
    // createTrimesh читает только position и не смотрит на index. Пока повторяет v
    // один в один; когда v обрастёт деталями, vCollide останется грубым залом.
    const vCollide: number[] = []

    let ind = 0

    const pushTri = (a: A3, b: A3, d: A3, col: A3) => {
        v.push(...a, ...b, ...d)
        c.push(...col, ...col, ...col)
        index.push(ind, ind + 1, ind + 2)
        ind += 3
        vCollide.push(...a, ...b, ...d)
    }

    // квад — 4 вершины и 6 индексов; вершины не переиспользуются между гранями,
    // иначе computeVertexNormals сгладит стык стены с полом
    const pushQuad = (a: A3, b: A3, d: A3, e: A3, col: A3) => {
        v.push(...a, ...b, ...d, ...e)
        c.push(...col, ...col, ...col, ...col)
        index.push(ind, ind + 1, ind + 2, ind, ind + 2, ind + 3)
        ind += 4
        vCollide.push(...a, ...b, ...d, ...a, ...d, ...e)
    }

    const center: A3 = [pos[0], pos[1], pos[2]]
    const centerTop: A3 = [pos[0], pos[1] + h, pos[2]]

    // точка на ободе под углом a
    const P = (a: number): A3 => [pos[0] + Math.cos(a) * r, pos[1], pos[2] - Math.sin(a) * r]
    const PT = (a: number): A3 => [pos[0] + Math.cos(a) * r, pos[1] + h, pos[2] - Math.sin(a) * r]

    const walk = (from: number, sweep: number, cb: (t0: number, t1: number) => void) => {
        if (sweep <= 1e-6) return
        const steps = Math.max(1, Math.ceil(sweep / arcStep))
        const d = sweep / steps
        for (let s = 0; s < steps; ++s) cb(from + s * d, from + (s + 1) * d)
    }

    // пол и потолок сплошные, в том числе под проёмами
    const floorAndCeil = (from: number, sweep: number) => walk(from, sweep, (t0, t1) => {
        pushTri(center, P(t0), P(t1), colFloor)
        pushTri(centerTop, PT(t1), PT(t0), colCeil)
    })

    const portalFloorAndCeil = (p: T_Portal) => {
        pushTri(center, P(p.angleRight), P(p.angleLeft), colFloor)
        pushTri(centerTop, PT(p.angleLeft), PT(p.angleRight), colCeil)
    }

    const wall = (from: number, sweep: number) => walk(from, sweep, (t0, t1) => {
        pushQuad(P(t1), P(t0), PT(t0), PT(t1), colWall)
    })

    if (portals.length === 0) {
        floorAndCeil(0, TAU)
        wall(0, TAU)
        return { index, v, c, vCollide }
    }

    for (let i = 0; i < portals.length; ++i) {
        const curr = portals[i]
        const next = portals[(i + 1) % portals.length]

        // проём: пол и потолок есть, стены нет — сюда пристыковывается коридор
        portalFloorAndCeil(curr)

        // глухой участок от левого края текущего проёма до правого края следующего;
        // при одном проёме формула сама даёт кольцо с единственным разрывом
        const sweep = norm(next.angleRight - curr.angleLeft)
        floorAndCeil(curr.angleLeft, sweep)
        wall(curr.angleLeft, sweep)
    }

    return { index, v, c, vCollide }
}
