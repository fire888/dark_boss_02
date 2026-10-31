import { tileRect, rectUv, rectUvQ, type T_TileRect } from "atlases/atlasTools"

// Атлас затенения (aoMap): src/atlases/atlasAo00/512Ao.jpg, 512×512, сетка 64 px.
// Идёт во второй набор uv (uv2) — регионы у него свои, независимые от атласа цвета.
// В three 0.173 атрибут uv2 — это канал 2: у текстуры aoMap нужно выставить channel = 2.
// «Верх» — верх картинки, в квадах rectUvQ он ложится на ребро c, d; flipUvQ — на a, b.

const SIZE = 512

// без затенения
export const RECT_AO_NONE: T_TileRect = tileRect(SIZE, 0, 0, 64, 64)
// тень узкой полосой по верхнему краю — внутренний угол с одной стороны
export const RECT_AO_TOP: T_TileRect = tileRect(SIZE, 64, 0, 64, 64)
// тень по верхнему и нижнему краю, светлая середина
export const RECT_AO_TOP_BOTTOM: T_TileRect = tileRect(SIZE, 128, 0, 64, 64)
// тень по всем краям, светлый центр
export const RECT_AO_ROUND: T_TileRect = tileRect(SIZE, 192, 0, 64, 64)

export const UV_AO_NONE: number[] = rectUv(RECT_AO_NONE)
export const UV_AO_TOP: number[] = rectUv(RECT_AO_TOP)
export const UV_AO_TOP_BOTTOM: number[] = rectUv(RECT_AO_TOP_BOTTOM)
export const UV_AO_ROUND: number[] = rectUv(RECT_AO_ROUND)

export const UV_AO_NONE_Q: number[] = rectUvQ(RECT_AO_NONE)
export const UV_AO_TOP_Q: number[] = rectUvQ(RECT_AO_TOP)
export const UV_AO_TOP_BOTTOM_Q: number[] = rectUvQ(RECT_AO_TOP_BOTTOM)
export const UV_AO_ROUND_Q: number[] = rectUvQ(RECT_AO_ROUND)
