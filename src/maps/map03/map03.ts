// Пол зала: круговая выкладка мелкой плиткой. Текстура нарисована в полярной развёртке —
// по горизонтали идёт угол, по вертикали радиус, низ картинки это центр зала, верх — обод.
// Поэтому строки на полу становятся концентрическими кольцами, а столбцы — радиальными швами.
// Плиток в кольце тем больше, чем кольцо дальше от центра (SECTORS), иначе у обода они
// растянулись бы в длинные дуги, а у центра сплющились в иголки.
//
// Развёртку делает room00 (uv пола: u — угол, v — радиус), и рисунок рассчитан на TURNS
// копий тайла на полный оборот: при другом floorTurns плитка выйдет вытянутой.
//
// Заворачивается только по горизонтали и только по тому окну, которое реально семплится:
// внутри тайла атласа от края отъедается TILE_PAD_FRACTION, и стык должен приходиться
// на границы этого окна, иначе на полу будет виден радиальный шов.
// Серый = высота, остальная механика — в maps/texUtils.

import {
    type P, type T_Rnd, broken, clamp255, grain, gray, grayA, seamless, shard, trace,
} from '../texUtils'

const S = 512
const SEED = 20260703

// на столько копий развёртка режет полный оборот — то же число, что floorTurns у room00
export const TURNS = 4

// плиток в кольце, от центра к ободу; длина массива — число колец.
// Числа подобраны так, чтобы на полу плитка выходила примерно квадратной:
// на кольцо радиуса r приходится 2*PI*r / TURNS длины и r_max / RINGS глубины
const SECTORS = [1, 2, 4, 6, 7, 9, 10]
const RINGS = SECTORS.length

// шов и разнобой плитки, в долях её размера
const JOINT = .13
const SHIFT_JITTER = .02
const CORNER_JITTER = .03

// яркости: шов — дно, плитка — верх
const GR_JOINT = 84
const GR_TILE = 178
const GR_TILE_SPREAD = 16
const GR_RING = 12
const GR_CHAMFER = [126, 156]
const GR_CRACK = 104
const GR_CHIP = 110
const GR_GRAIN = 18

const CHAMFER_W = [.16, .09]
const CRACK_W = .05

// доля битых плиток: тон ниже, поперёк трещина, с угла скол
const BROKEN_RATE = .10
const GRAIN_PER_TILE = 10

export const createMap03 = (size: number = S, padFrac: number = 0): HTMLCanvasElement =>
    seamless(
        size, SEED, GR_JOINT,
        (ctx, s, rnd) => drawPass(ctx, s, rnd, padFrac),
        { periodX: size * (1 - 2 * padFrac), periodY: 0 },
    )

const drawPass = (ctx: CanvasRenderingContext2D, size: number, rnd: T_Rnd, padFrac: number) => {
    const inset = padFrac * size
    // окно, которое семплится: по горизонтали это период развёртки, по вертикали —
    // весь радиус зала от центра (низ) до обода (верх)
    const W = size - 2 * inset
    const H = W

    const ringH = H / RINGS
    // v = 0 внизу картинки, а ось y в canvas растёт вниз, поэтому кольцо j от центра
    // лежит тем выше, чем оно дальше
    const yOf = (vv: number) => inset + H - vv * H

    for (let j = 0; j < RINGS; ++j) {
        const cols = SECTORS[j]
        const colW = W / cols
        const yOut = yOf((j + 1) / RINGS)
        const yIn = yOf(j / RINGS)
        // кольца сдвинуты через одно на полплитки: радиальные швы не встают в линию
        const shift = (j % 2) * .5 * colW
        const joint = JOINT * Math.min(colW, ringH)

        for (let k = 0; k < cols; ++k) {
            const jit = (amp: number) => (rnd() - .5) * 2 * amp

            const x0 = inset + k * colW + shift + joint * .5 + jit(SHIFT_JITTER * colW)
            const x1 = x0 + colW - joint
            const y0 = yOut + joint * .5 + jit(SHIFT_JITTER * ringH)
            const y1 = y0 + ringH - joint

            const corner = (x: number, y: number): P =>
                [x + jit(CORNER_JITTER * colW), y + jit(CORNER_JITTER * ringH)]

            const path: P[] = [corner(x0, y0), corner(x1, y0), corner(x1, y1), corner(x0, y1)]

            const broke = rnd() < BROKEN_RATE
            // кольца через одно чуть темнее: на полу это читается как чередование поясов
            const base = clamp255(
                GR_TILE - (j % 2) * GR_RING + jit(GR_TILE_SPREAD) - (broke ? 22 : 0),
            )

            trace(ctx, path, true)
            ctx.fillStyle = gray(base)
            ctx.fill()

            ctx.save()
            ctx.clip()

            // фаска внутрь: высота спадает от середины плитки к шву
            for (let m = 0; m < CHAMFER_W.length; ++m) {
                trace(ctx, path, true)
                ctx.lineWidth = CHAMFER_W[m] * Math.min(colW, ringH)
                ctx.strokeStyle = gray(Math.min(base, GR_CHAMFER[m]))
                ctx.stroke()
            }

            if (broke) {
                const side = (rnd() * 4) | 0
                trace(ctx, broken(path[side], path[(side + 2) % 4], [jit(.12 * ringH)]), false)
                ctx.lineWidth = CRACK_W * Math.min(colW, ringH)
                ctx.strokeStyle = grayA(GR_CRACK, .8)
                ctx.stroke()

                const r = (.18 + rnd() * .22) * Math.min(colW, ringH)
                trace(ctx, shard(path[(side + 1) % 4], r, 5, rnd), true)
                ctx.fillStyle = grayA(GR_CHIP, .6)
                ctx.fill()
            }

            const inTile = (): P => [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)]
            grain(ctx, rnd, GRAIN_PER_TILE, inTile, base, GR_GRAIN, .12 * ringH)

            ctx.restore()
        }

        // шов между кольцами: на полу это окружность, поэтому линия строго горизонтальная
        ctx.beginPath()
        ctx.moveTo(inset - W, yIn)
        ctx.lineTo(inset + 2 * W, yIn)
        ctx.lineWidth = JOINT * ringH * .5
        ctx.strokeStyle = gray(GR_JOINT)
        ctx.stroke()
    }
}

// Canvas создаётся при первом обращении, а не при импорте модуля:
// document на момент импорта может быть недоступен.
let cached: HTMLCanvasElement | null = null

export const map03 = (): HTMLCanvasElement => cached || (cached = createMap03())

// отладочный показ поверх сцены — как show() в TexturesCanvas
export const showMap03 = (canvas: HTMLCanvasElement = map03()) => {
    document.body.appendChild(canvas)
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.zIndex = '100'
    canvas.style.border = '1px solid red'
}
