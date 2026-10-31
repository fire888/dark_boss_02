// Тайлы атласа (см. createLevelAtlas):
// canvas 12 x 12, заняты первые шесть тайлов — по одному на грань из maps/map00..map05.
// Остальные пока пустые и белые, поэтому грань на пустом тайле выглядит ровно как раньше —
// только vertexColors.
//
// Нумерация тайлов идёт по canvas: слева направо, сверху вниз. Ось v в uv смотрит
// вверх, а строки canvas — вниз, поэтому строка row лежит в v [1 - (row+1)/N, 1 - row/N],
// и тайл 0 оказывается у верхней границы v, а не у нулевой.

export const ATLAS_GRID = 12

// пол коридора — крупные плиты, стены — кладка, пол зала — мелкая плитка по кругу,
// потолок зала — радиальные балки с элементом в центре, потолок коридора — поперечные балки.
// TILE_ROCK (тёсаная порода) фабрики больше не берут: она была потолком до балок
// и оставлена в атласе как запас
export const TILE_FLOOR = 0
export const TILE_WALL = 1
export const TILE_ROCK = 2
export const TILE_FLOOR_FINE = 3
export const TILE_CEIL_ROUND = 4
export const TILE_CEIL_BEAMS = 5
export const TILE_EMPTY = 6

// отступ внутрь тайла: на дальних mip-уровнях соседние тайлы смешиваются,
// и без него край текстуры выползал бы на соседнюю грань
const PAD = .002

// тот же отступ, но в долях стороны тайла: текстуре, которая должна стыковаться сама
// с собой внутри тайла, нужно заворачивать именно это окно, а не весь свой canvas
export const TILE_PAD_FRACTION = PAD * ATLAS_GRID

type T_Rect = { u0: number, u1: number, v0: number, v1: number }

const rect = (tile: number): T_Rect => {
    const s = 1 / ATLAS_GRID
    const col = tile % ATLAS_GRID
    const row = Math.floor(tile / ATLAS_GRID)

    return {
        u0: col * s + PAD,
        u1: (col + 1) * s - PAD,
        v0: 1 - (row + 1) * s + PAD,
        v1: 1 - row * s - PAD,
    }
}

// uv квада в том же порядке вершин, в каком его пушат фабрики: a, b — нижняя пара,
// d, e — верхняя, обход по контуру
export const uvQuad = (tile: number): number[] => {
    const { u0, u1, v0, v1 } = rect(tile)
    return [u0, v0, u1, v0, u1, v1, u0, v1]
}

// точка внутри тайла по долям x, y от его стороны (0,0 — левый нижний угол тайла)
export const uvPoint = (tile: number, x: number, y: number): number[] => {
    const { u0, u1, v0, v1 } = rect(tile)
    return [u0 + (u1 - u0) * x, v0 + (v1 - v0) * y]
}

// то же, но для неиндексированного квада из _M.createPolygon: 6 вершин, порядок a, b, d, a, d, e
export const uvPolygon = (tile: number): number[] => {
    const { u0, u1, v0, v1 } = rect(tile)
    return [u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1]
}
