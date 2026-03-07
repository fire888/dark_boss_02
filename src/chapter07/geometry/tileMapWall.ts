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