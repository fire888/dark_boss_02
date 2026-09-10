import type { IArrayForBuffers } from "geometry/GeomTypes"

// Короб коридора, натянутый на две пары точек: p0/p1 — края проёма на одном конце,
// p3/p2 — на другом. p0 и p3 лежат с одной стороны коридора, p1 и p2 — с другой,
// то есть p0 -> p1 -> p2 -> p3 обходит контур пола по кругу.
// Точки задают только низ; верх получается подъёмом на h, поэтому концы коридора
// могут быть разной ширины и на разной высоте, но всегда вертикальны.
// Торцы не строятся: предполагается, что к ним пристыкованы узлы.

type A3 = number[]

type T = {
    p0?: A3, p1?: A3, p2?: A3, p3?: A3,
    h?: number,
    colFloor?: A3, colWall?: A3, colCeil?: A3,
}

const DEFAULT_OPTS: Required<T> = {
    p0: [-1.3, 0, 0], p1: [1.3, 0, 0],
    p2: [1.3, 0, -10], p3: [-1.3, 0, -10],
    h: 3.5,
    colFloor: [.46, .42, .38],
    colWall: [.66, .63, .58],
    colCeil: [.14, .13, .12],
}

export const tunnel01 = (opts: T = {}): IArrayForBuffers => {
    const {
        p0, p1, p2, p3,
        h,
        colFloor, colWall, colCeil,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const v: number[] = []
    const c: number[] = []
    const index: number[] = []
    // прокси для физики: та же форма, но развёрнутая в triangle soup, потому что
    // createTrimesh читает только position и не смотрит на index. Пока повторяет v
    // один в один; когда v обрастёт деталями, vCollide останется грубым коробом.
    const vCollide: number[] = []

    let ind = 0

    // квад — 4 вершины и 6 индексов; вершины не переиспользуются между гранями,
    // иначе computeVertexNormals сгладит стык пола со стеной
    const quad = (a: A3, b: A3, d: A3, e: A3, col: A3) => {
        v.push(...a, ...b, ...d, ...e)
        c.push(...col, ...col, ...col, ...col)
        index.push(ind, ind + 1, ind + 2, ind, ind + 2, ind + 3)
        ind += 4
        vCollide.push(...a, ...b, ...d, ...a, ...d, ...e)
    }

    const up = (p: A3): A3 => [p[0], p[1] + h, p[2]]

    const p0H = up(p0)
    const p1H = up(p1)
    const p2H = up(p2)
    const p3H = up(p3)

    quad(p0, p1, p2, p3, colFloor)
    quad(p3H, p2H, p1H, p0H, colCeil)
    quad(p0, p3, p3H, p0H, colWall)
    quad(p2, p1, p1H, p2H, colWall)

    return { index, v, c, vCollide }
}
