// Потолок коридора: доски вдоль хода и поперечные балки.
//
// Ориентация задана тем, как tunnel01 кладёт uv на потолочный квад секции:
// u идёт поперёк коридора (от левого борта к правому), v — вдоль, от дальнего конца
// секции к ближнему. Значит поперечная балка — это горизонтальная полоса на картинке
// во всю ширину, а доска вдоль хода — вертикальная.
//
// Тайл повторяется на каждой секции коридора, поэтому стыковаться текстура обязана
// в первую очередь по вертикали: низ одной копии встречается с верхом следующей.
// Заворачивается то окно тайла, которое семплится (TILE_PAD_FRACTION), а не весь canvas.
// Серый = высота, остальная механика — в maps/texUtils.

import {
    type P, type T_Rnd, clamp255, grain, gray, grayA, seamless, shard, trace,
} from '../texUtils'

const S = 512
const SEED = 20260828

// балок на тайл: при секции коридора в SEG_LEN единиц это шаг балок SEG_LEN / BEAMS
const BEAMS = 2
// толщина балки в долях её полосы и число досок поперёк
const BEAM_H = .34
const BOARDS = 6

// яркости: шов между досками — дно, гребень балки — верх
const GR_BOARD = 132
const GR_BOARD_SPREAD = 14
const GR_SEAM = 80
const GR_BEAM = 180
const GR_BEAM_EDGE = 92
const GR_BEAM_CROWN = 204
const GR_BOLT = 68
const GR_GRAIN = 18

const SEAM_W = .012
const JOINTS = 7
const GRAIN_PER_BOARD = 90
const BEAM_GRAIN = 120
const BOLTS_PER_BEAM = 4

export const createMap05 = (size: number = S, padFrac: number = 0): HTMLCanvasElement =>
    seamless(
        size, SEED, GR_BOARD,
        (ctx, s, rnd) => drawPass(ctx, s, rnd, padFrac),
        { periodX: size * (1 - 2 * padFrac), periodY: size * (1 - 2 * padFrac) },
    )

const drawPass = (ctx: CanvasRenderingContext2D, size: number, rnd: T_Rnd, padFrac: number) => {
    const inset = padFrac * size
    const W = size - 2 * inset
    const H = W

    // доски вдоль коридора: вертикальные полосы со швом по левому краю
    const boardW = W / BOARDS
    for (let k = 0; k < BOARDS; ++k) {
        const x0 = inset + k * boardW
        const tone = clamp255(GR_BOARD + (rnd() - .5) * 2 * GR_BOARD_SPREAD)

        ctx.fillStyle = gray(tone)
        ctx.fillRect(x0, inset, boardW, H)

        ctx.fillStyle = gray(GR_SEAM)
        ctx.fillRect(x0, inset, SEAM_W * W, H)

        // стыки досок по длине: короткие поперечные швы в случайных местах
        const joints = 1 + ((rnd() * 2) | 0)
        for (let j = 0; j < joints; ++j) {
            ctx.fillStyle = grayA(GR_SEAM, .85)
            ctx.fillRect(x0, inset + rnd() * H, boardW, SEAM_W * W * .8)
        }

        const inBoard = (): P => [x0 + rnd() * boardW, inset + rnd() * H]
        grain(ctx, rnd, GRAIN_PER_BOARD, inBoard, tone, GR_GRAIN, .004 * W)
    }

    // продольные риски по всей доске: волокно
    for (let i = 0; i < JOINTS * BOARDS; ++i) {
        const x = inset + rnd() * W
        const y0 = inset + rnd() * H
        const len = (.15 + rnd() * .5) * H
        trace(ctx, [[x, y0], [x + (rnd() - .5) * .01 * W, y0 + len]], false)
        ctx.lineWidth = .003 * W
        ctx.strokeStyle = grayA(GR_SEAM, .4)
        ctx.stroke()
    }

    // поперечные балки: горизонтальная полоса во всю ширину
    const band = H / BEAMS
    for (let b = 0; b < BEAMS; ++b) {
        const yc = inset + (b + .5) * band
        const half = BEAM_H * band * .5

        ctx.fillStyle = gray(GR_BEAM)
        ctx.fillRect(inset, yc - half, W, half * 2)

        // фаски сверху и снизу: высота спадает от гребня балки к доскам
        const edge = half * .28
        ctx.fillStyle = gray(GR_BEAM_EDGE)
        ctx.fillRect(inset, yc - half, W, edge)
        ctx.fillRect(inset, yc + half - edge, W, edge)

        ctx.fillStyle = gray(GR_BEAM_CROWN)
        ctx.fillRect(inset, yc - half * .2, W, half * .4)

        // костыли: тёмные выбоины ближе к бортам, где балка ложится на стену
        for (let k = 0; k < BOLTS_PER_BEAM; ++k) {
            const x = inset + (k < BOLTS_PER_BEAM / 2 ? .04 + rnd() * .12 : .84 + rnd() * .12) * W
            trace(ctx, shard([x, yc + (rnd() - .5) * half], half * (.22 + rnd() * .2), 6, rnd), true)
            ctx.fillStyle = grayA(GR_BOLT, .8)
            ctx.fill()
        }

        const inBeam = (): P => [inset + rnd() * W, yc - half + rnd() * half * 2]
        grain(ctx, rnd, BEAM_GRAIN, inBeam, GR_BEAM, GR_GRAIN, .004 * W)
    }
}

// Canvas создаётся при первом обращении, а не при импорте модуля:
// document на момент импорта может быть недоступен.
let cached: HTMLCanvasElement | null = null

export const map05 = (): HTMLCanvasElement => cached || (cached = createMap05())

// отладочный показ поверх сцены — как show() в TexturesCanvas
export const showMap05 = (canvas: HTMLCanvasElement = map05()) => {
    document.body.appendChild(canvas)
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.zIndex = '100'
    canvas.style.border = '1px solid red'
}
