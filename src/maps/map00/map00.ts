// Пол: плиты, разрезанные ломаными прямыми швами, внутри плит — пятна крошева.
// Сетка плит общая на всю текстуру, соседние плиты делят один и тот же шов.
// Серый = высота, механика бесшовности и требования к draw — в maps/texUtils.

import {
    type P, type T_Rnd, broken, clamp255, grain, gray, grayA, mod, seamless, shard, trace,
} from '../texUtils'

const S = 512
const SEED = 20260911

// плит по стороне; 4 при 256 px дают плиту ~64 px
const CELLS = 4
// звеньев в ломаной одного шва
const EDGE_SEGMENTS = 4
// смещение узла сетки и изломов шва, в долях шага сетки
const NODE_JITTER = .16
const EDGE_JITTER = .07

// яркости: 0 — дно шва, 255 — верх плиты
const GR_BASE = 150
const GR_CELL_SPREAD = 22
const GR_SEAM = 30
const GR_CHAMFER = [64, 96, 124]
const GR_CRACK = 78
const GR_SPOT = 30
const GR_GRAIN = 26

const SEAM_W = .022
const CHAMFER_W = [.075, .055, .035]
const CRACK_W = .012

const SPOTS_PER_CELL = 5
const GRAIN_PER_CELL = 70
const CRACKS_PER_CELL = 3

export const createMap00 = (size: number = S): HTMLCanvasElement =>
    seamless(size, SEED, GR_BASE, drawPass)

const drawPass = (ctx: CanvasRenderingContext2D, size: number, rnd: T_Rnd) => {
    const step = size / CELLS

    // джиттер узлов: индекс берётся по modulo, поэтому узел (CELLS, j) — это узел (0, j),
    // сдвинутый ровно на size, и сетка стыкуется сама с собой
    const jx: number[][] = []
    const jy: number[][] = []
    for (let i = 0; i < CELLS; ++i) {
        jx[i] = []
        jy[i] = []
        for (let j = 0; j < CELLS; ++j) {
            jx[i][j] = (rnd() - .5) * 2 * NODE_JITTER * step
            jy[i][j] = (rnd() - .5) * 2 * NODE_JITTER * step
        }
    }

    // изломы швов: по одному набору на ребро, тоже с modulo-индексом
    const hOff: number[][][] = []
    const vOff: number[][][] = []
    for (let i = 0; i < CELLS; ++i) {
        hOff[i] = []
        vOff[i] = []
        for (let j = 0; j < CELLS; ++j) {
            hOff[i][j] = []
            vOff[i][j] = []
            for (let k = 1; k < EDGE_SEGMENTS; ++k) {
                hOff[i][j].push((rnd() - .5) * 2 * EDGE_JITTER * step)
                vOff[i][j].push((rnd() - .5) * 2 * EDGE_JITTER * step)
            }
        }
    }

    const node = (i: number, j: number): P => [
        i * step + jx[mod(i, CELLS)][mod(j, CELLS)],
        j * step + jy[mod(i, CELLS)][mod(j, CELLS)],
    ]

    const hEdge = (i: number, j: number): P[] =>
        broken(node(i, j), node(i + 1, j), hOff[mod(i, CELLS)][mod(j, CELLS)])

    const vEdge = (i: number, j: number): P[] =>
        broken(node(i, j), node(i, j + 1), vOff[mod(i, CELLS)][mod(j, CELLS)])

    // контур плиты: те же самые ломаные, что у соседей, поэтому щелей между плитами нет
    const cellPath = (i: number, j: number): P[] => [
        ...hEdge(i, j),
        ...vEdge(i + 1, j).slice(1),
        ...hEdge(i, j + 1).reverse().slice(1),
        ...vEdge(i, j).reverse().slice(1, -1),
    ]

    for (let j = 0; j < CELLS; ++j) {
        for (let i = 0; i < CELLS; ++i) {
            const path = cellPath(i, j)
            const base = clamp255(GR_BASE + (rnd() - .5) * 2 * GR_CELL_SPREAD)

            trace(ctx, path, true)
            ctx.fillStyle = gray(base)
            ctx.fill()

            ctx.save()
            ctx.clip()

            // фаска: обводка изнутри, от тёмного у шва к цвету плиты — спад высоты к стыку
            for (let k = 0; k < CHAMFER_W.length; ++k) {
                trace(ctx, path, true)
                ctx.lineWidth = CHAMFER_W[k] * step
                ctx.strokeStyle = gray(Math.min(base, GR_CHAMFER[k]))
                ctx.stroke()
            }

            const n0 = node(i, j)
            const inCell = (): P => [n0[0] + rnd() * step, n0[1] + rnd() * step]

            // пятна крошева: рваные многоугольники чуть темнее или светлее плиты
            for (let s = 0; s < SPOTS_PER_CELL; ++s) {
                const r = (.08 + rnd() * .22) * step
                trace(ctx, shard(inCell(), r, 5 + ((rnd() * 4) | 0), rnd), true)
                const dark = rnd() < .65
                ctx.fillStyle = grayA(dark ? base - GR_SPOT : base + GR_SPOT, .5 + rnd() * .3)
                ctx.fill()
            }

            // трещины внутри плиты: такие же ломаные, но короткие и не доходящие до шва
            for (let k = 0; k < CRACKS_PER_CELL; ++k) {
                const a = inCell()
                const ang = rnd() * Math.PI * 2
                const len = (.25 + rnd() * .45) * step
                const b: P = [a[0] + Math.cos(ang) * len, a[1] + Math.sin(ang) * len]
                const offs: number[] = []
                for (let m = 1; m < EDGE_SEGMENTS; ++m) offs.push((rnd() - .5) * 2 * EDGE_JITTER * step)

                trace(ctx, broken(a, b, offs), false)
                ctx.lineWidth = CRACK_W * step
                ctx.strokeStyle = grayA(GR_CRACK, .75)
                ctx.stroke()
            }

            grain(ctx, rnd, GRAIN_PER_CELL, inCell, base, GR_GRAIN, .018 * step)

            ctx.restore()
        }
    }

    // швы рисуются последними и поверх фасок — это дно рельефа
    ctx.lineWidth = SEAM_W * step
    ctx.strokeStyle = gray(GR_SEAM)
    for (let j = 0; j < CELLS; ++j) {
        for (let i = 0; i < CELLS; ++i) {
            trace(ctx, hEdge(i, j), false)
            ctx.stroke()
            trace(ctx, vEdge(i, j), false)
            ctx.stroke()
        }
    }
}

// Canvas создаётся при первом обращении, а не при импорте модуля:
// document на момент импорта может быть недоступен.
let cached: HTMLCanvasElement | null = null

export const map00 = (): HTMLCanvasElement => cached || (cached = createMap00())

// отладочный показ поверх сцены — как show() в TexturesCanvas
export const showMap00 = (canvas: HTMLCanvasElement = map00()) => {
    document.body.appendChild(canvas)
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.zIndex = '100'
    canvas.style.border = '1px solid red'
}
