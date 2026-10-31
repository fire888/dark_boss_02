import { _M } from "_CORE/_M/_m"

const S = 0.25
export const UV_EMPTY: number[] = _M.createUv([0, S * 3], [S, S * 3], [S, S * 4], [0, S * 4])
export const UV_TRIANGLE: number[] = _M.createUv([S * 1, S * 3], [S * 2, S * 3], [S * 2, S * 4], [S * 1, S * 4])
export const UV_POINTS: number[] = _M.createUv([S * 2, S * 3], [S * 3, S * 3], [S * 3, S * 4], [S * 2, S * 4])
export const UV_DARK: number[] = _M.createUv([S * 3, S * 3], [S * 4, S * 3], [S * 4, S * 4], [S * 3, S * 4])
export const UV_GRID: number[] = _M.createUv([0, S * 2], [S * 1, S * 2], [S * 1, S * 3], [0, S * 3])
export const UV_GRID_CIRCLE: number[] = _M.createUv([S, S * 2], [S * 2, S * 2], [S * 2, S * 3], [S, S * 3])
export const UV_HT: number[] = _M.createUv([S * 2, S * 2], [S * 3, S * 2], [S * 3, S * 3], [S * 2, S * 3])
export const UV_POINTS_TREE: number[] = [S * 3, S * 3, S * 4, S * 3, S * 3.5, S * 2]

export const COL_WHITE: number[] = _M.fillColorFace([1, 1, 1])
export const COL_RED: number[] = _M.fillColorFace([1, 0, 0])
export const COL_BLUE_TOP: number[] = _M.fillColorFace([.7, .7, 1])
export const COL_BLUE_HIGHT: number[] = _M.fillColorFace([.7, .6, 1])
export const COL_BLUE_LIGHT = _M.fillColorFace([0.5, 0.5, 1])
export const COL_BLUE_LIGHT_3: number[] = [
    COL_BLUE_LIGHT[0], COL_BLUE_LIGHT[1], COL_BLUE_LIGHT[2],
    COL_BLUE_LIGHT[0], COL_BLUE_LIGHT[1], COL_BLUE_LIGHT[2],
    COL_BLUE_LIGHT[0], COL_BLUE_LIGHT[1], COL_BLUE_LIGHT[2],
]
export const COL_GREEN_BLUE: number[] = _M.fillColorFace([.5, .1, 1])

// Варианты для индексированного квада (src/geometry): 4 вершины a, b, c, d
// под индексы 0,1,2, 0,2,3. Выводятся из 6-вершинных выше, чтобы тайл и цвет
// у обоих режимов гарантированно совпадали.
// createUv/fillColorFace раскладывают квад как a, b, c, a, c, d — берём a, b, c и последнюю d.
const quadUv = (uv: number[]): number[] => [...uv.slice(0, 6), ...uv.slice(10, 12)]
const quadCol = (c: number[]): number[] => c.slice(0, 12)

export const UV_EMPTY_Q: number[] = quadUv(UV_EMPTY)
export const UV_TRIANGLE_Q: number[] = quadUv(UV_TRIANGLE)
export const UV_POINTS_Q: number[] = quadUv(UV_POINTS)
export const UV_DARK_Q: number[] = quadUv(UV_DARK)
export const UV_GRID_Q: number[] = quadUv(UV_GRID)
export const UV_GRID_CIRCLE_Q: number[] = quadUv(UV_GRID_CIRCLE)
export const UV_HT_Q: number[] = quadUv(UV_HT)

export const COL_WHITE_Q: number[] = quadCol(COL_WHITE)
export const COL_RED_Q: number[] = quadCol(COL_RED)
export const COL_BLUE_TOP_Q: number[] = quadCol(COL_BLUE_TOP)
export const COL_BLUE_HIGHT_Q: number[] = quadCol(COL_BLUE_HIGHT)
export const COL_BLUE_LIGHT_Q: number[] = quadCol(COL_BLUE_LIGHT)
export const COL_GREEN_BLUE_Q: number[] = quadCol(COL_GREEN_BLUE)

// Треугольная грань в обоих режимах одинакова — 3 вершины: UV_POINTS_TREE (6) и COL_BLUE_LIGHT_3 (9).
