import { tileRect, rectUv, rectUvQ, type T_TileRect } from "atlases/atlasTools"

// Атлас цвета: src/atlases/atlas00/512.jpg, 512×512, сетка 64 px.
// Тайл нейтральный, оттенок даёт цвет вершин — он умножается на текстуру.
// Для каждого тайла: RECT_* (регион, для развёрток внутри тайла), UV_* (12 чисел)
// и UV_*_Q (8 чисел, индексированный квад).

const SIZE = 512

export const RECT_WHITE: T_TileRect = tileRect(SIZE, 0, 0, 64, 64)
// мох с камнями
export const RECT_MOSS: T_TileRect = tileRect(SIZE, 64, 0, 64, 64)
// 2:1
export const RECT_RED: T_TileRect = tileRect(SIZE, 0, 64, 128, 64)
export const RECT_GRAY: T_TileRect = tileRect(SIZE, 0, 128, 128, 128)
// 2:1, та же заливка, что у RECT_GRAY
export const RECT_GRAY_WIDE: T_TileRect = tileRect(SIZE, 0, 128, 256, 128)

export const UV_WHITE: number[] = rectUv(RECT_WHITE)
export const UV_MOSS: number[] = rectUv(RECT_MOSS)
export const UV_RED: number[] = rectUv(RECT_RED)
export const UV_GRAY: number[] = rectUv(RECT_GRAY)
export const UV_GRAY_WIDE: number[] = rectUv(RECT_GRAY_WIDE)

export const UV_WHITE_Q: number[] = rectUvQ(RECT_WHITE)
export const UV_MOSS_Q: number[] = rectUvQ(RECT_MOSS)
export const UV_RED_Q: number[] = rectUvQ(RECT_RED)
export const UV_GRAY_Q: number[] = rectUvQ(RECT_GRAY)
export const UV_GRAY_WIDE_Q: number[] = rectUvQ(RECT_GRAY_WIDE)
