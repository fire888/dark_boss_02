import { _M } from "_CORE/_M/_m"

// Регион тайла в uv: [u0, v0, u1, v1], v0 — низ. Текстура грузится с flipY,
// поэтому верх картинки — v = 1.
export type T_TileRect = [number, number, number, number]

// отступ внутрь региона в пикселях: мипмапы и фильтрация не подтягивают соседний тайл
const INSET = 2

// регион в пикселях картинки (x вправо, y вниз от левого верхнего угла)
export const tileRect = (size: number, x: number, y: number, w: number, h: number): T_TileRect => [
    (x + INSET) / size,
    1 - (y + h - INSET) / size,
    (x + w - INSET) / size,
    1 - (y + INSET) / size,
]

// 12 чисел — квад из 6 вершин (chapter10)
export const rectUv = (r: T_TileRect): number[] =>
    _M.createUv([r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]])

// 8 чисел — индексированный квад a, b, c, d: a, b — низ тайла, c, d — верх
export const rectUvQ = (r: T_TileRect): number[] =>
    [r[0], r[1], r[2], r[1], r[2], r[3], r[0], r[3]]

// квад с тайлом, перевёрнутым по вертикали: верх картинки ложится на ребро a, b
export const flipUvQ = (uvQ: number[]): number[] =>
    [uvQ[6], uvQ[7], uvQ[4], uvQ[5], uvQ[2], uvQ[3], uvQ[0], uvQ[1]]

// точка внутри региона: s — доля слева направо, q — снизу вверх
export const rectPoint = (r: T_TileRect, s: number, q: number): [number, number] =>
    [r[0] + (r[2] - r[0]) * s, r[1] + (r[3] - r[1]) * q]
