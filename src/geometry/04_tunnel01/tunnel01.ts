import type { IArrayForBuffers } from "geometry/GeomTypes"
import { uvQuad, TILE_FLOOR, TILE_WALL, TILE_CEIL_BEAMS } from "geometry/atlasUv"

// Короб коридора, натянутый на две пары точек: p0/p1 — края проёма на одном конце,
// p3/p2 — на другом. p0 и p3 лежат с одной стороны коридора, p1 и p2 — с другой,
// то есть p0 -> p1 -> p2 -> p3 обходит контур пола по кругу.
// Точки задают только низ; верх получается подъёмом на h, а если задан h1 — развёрткой
// от h на ближнем конце к h1 на дальнем. Поэтому концы коридора могут быть разной ширины,
// на разной высоте и разного роста, но всегда вертикальны.
// Торцы не строятся: предполагается, что к ним пристыкованы узлы.
//
// По длине короб режется на секции. Геометрически это ничего не меняет — секции
// получаются линейной интерполяцией тех же четырёх точек, — но каждой секции достаётся
// свой экземпляр тайла атласа, иначе кладка растянулась бы на весь коридор: тайл внутри
// атласа повторить через wrapS нельзя, uv за его границей залезет в соседний тайл.
// Режется только v: нарезка нужна текстуре, а физике — нет, и vCollide остаётся
// цельным коробом из четырёх граней на всю длину.

type A3 = number[]

type T = {
    p0?: A3, p1?: A3, p2?: A3, p3?: A3,
    h?: number,
    // высота дальнего конца (у пары p3/p2); 0 — держать h по всей длине
    h1?: number,
    colFloor?: A3, colWall?: A3, colCeil?: A3,
    // тайлы атласа (geometry/atlasUv): по одному экземпляру тайла на секцию грани
    tileFloor?: number, tileWall?: number, tileCeil?: number,
    // секций по длине; 0 — посчитать из длины коридора по SEG_LEN
    segments?: number,
}

const DEFAULT_OPTS: Required<T> = {
    p0: [-1.3, 0, 0], p1: [1.3, 0, 0],
    p2: [1.3, 0, -10], p3: [-1.3, 0, -10],
    h: 3.5,
    h1: 0,
    colFloor: [.46, .42, .38],
    colWall: [.66, .63, .58],
    //colCeil: [.14, .13, .12],
    colCeil: [.75, .73, .72],
    tileFloor: TILE_FLOOR,
    tileWall: TILE_WALL,
    tileCeil: TILE_CEIL_BEAMS,
    segments: 0,
}

// длина секции в мировых единицах и потолок на их число, чтобы длинный коридор
// не разнёс геометрию
const SEG_LEN = 3
const SEG_MAX = 16

export const tunnel01 = (opts: T = {}): IArrayForBuffers => {
    const {
        p0, p1, p2, p3,
        h, h1,
        colFloor, colWall, colCeil,
        tileFloor, tileWall, tileCeil,
        segments,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const index: number[] = []
    // прокси для физики: тот же короб, но развёрнутый в triangle soup, потому что
    // createTrimesh читает только position и не смотрит на index. Секций не знает —
    // собирается ниже по исходным p0..p3 одной гранью на сторону.
    const vCollide: number[] = []

    let ind = 0

    // квад — 4 вершины и 6 индексов; вершины не переиспользуются между гранями,
    // иначе computeVertexNormals сгладит стык пола со стеной
    const quad = (a: A3, b: A3, d: A3, e: A3, col: A3, tile: number) => {
        v.push(...a, ...b, ...d, ...e)
        c.push(...col, ...col, ...col, ...col)
        uv.push(...uvQuad(tile))
        index.push(ind, ind + 1, ind + 2, ind, ind + 2, ind + 3)
        ind += 4
    }

    const collideQuad = (a: A3, b: A3, d: A3, e: A3) => {
        vCollide.push(...a, ...b, ...d, ...a, ...d, ...e)
    }

    const hFar = h1 > 0 ? h1 : h
    // t — доля длины от ближнего конца; потолок разворачивается линейно от h к hFar
    const up = (p: A3, t: number): A3 => [p[0], p[1] + h + (hFar - h) * t, p[2]]
    const lerp = (a: A3, b: A3, t: number): A3 =>
        [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

    const dist = (a: A3, b: A3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])

    // длина берётся средней по двум бортам: концы коридора бывают разной ширины
    const len = (dist(p0, p3) + dist(p1, p2)) * .5
    const n = segments > 0
        ? Math.max(1, Math.round(segments))
        : Math.min(SEG_MAX, Math.max(1, Math.round(len / SEG_LEN)))

    for (let s = 0; s < n; ++s) {
        const t0 = s / n
        const t1 = (s + 1) / n

        // левый и правый борт секции: ближний край на t0, дальний на t1
        const aL = lerp(p0, p3, t0)
        const aR = lerp(p1, p2, t0)
        const bL = lerp(p0, p3, t1)
        const bR = lerp(p1, p2, t1)

        const aLH = up(aL, t0)
        const aRH = up(aR, t0)
        const bLH = up(bL, t1)
        const bRH = up(bR, t1)

        quad(aL, aR, bR, bL, colFloor, tileFloor)
        quad(bLH, bRH, aRH, aLH, colCeil, tileCeil)
        quad(aL, bL, bLH, aLH, colWall, tileWall)
        quad(bR, aR, aRH, bRH, colWall, tileWall)
    }

    // прокси собирается по несечёному коробу: те же четыре грани, что были до нарезки
    const p0H = up(p0, 0)
    const p1H = up(p1, 0)
    const p2H = up(p2, 1)
    const p3H = up(p3, 1)

    collideQuad(p0, p1, p2, p3)
    collideQuad(p3H, p2H, p1H, p0H)
    collideQuad(p0, p3, p3H, p0H)
    collideQuad(p2, p1, p1H, p2H)

    return { index, v, uv, c, vCollide }
}
