// Стены: кладка. Ряды кирпича смещены на полкирпича, между кирпичами — раствор,
// он же самое глубокое место рельефа. Грани кирпича ломаные, углы сколоты.
// От пола (maps/map00) отличается устройством: там общая сетка плит с общим швом,
// здесь каждый кирпич — отдельная фигура на фоне раствора, и ряды не совпадают по вертикали.
// Серый = высота, механика бесшовности и требования к draw — в maps/texUtils.

import {
    type P, type T_Rnd, broken, clamp255, grain, gray, grayA, seamless, shard, trace,
} from '../texUtils'

const S = 512
const SEED = 20260412

// рядов по высоте и кирпичей в ряду; ROWS должно быть чётным, иначе смещение
// на полкирпича не сойдётся при стыке верха с низом.
// Кирпич вдвое мельче прежнего (было 6 x 3): при тайле 256 px это ~42 x 21 px —
// ниже опускаться уже некуда, сколы и трещины перестанут читаться
const ROWS = 12
const COLS = 6
// звеньев в ломаной грани кирпича
const EDGE_SEGMENTS = 3

// ширина шва раствора и разброс, в долях кирпича
const JOINT = .09
const CORNER_JITTER = .035
const EDGE_JITTER = .022

// яркости: раствор — дно, кирпич — верх
const GR_MORTAR = 74
const GR_BRICK = 168
const GR_BRICK_SPREAD = 26
const GR_CHAMFER = [104, 134]
const GR_CHIP = 96
const GR_CRACK = 104
const GR_GRAIN = 24

const CHAMFER_W = [.09, .05]
const CRACK_W = .016

const CHIPS_PER_BRICK = 2
const CRACKS_PER_BRICK = 1
const GRAIN_PER_BRICK = 22

export const createMap01 = (size: number = S): HTMLCanvasElement =>
    seamless(size, SEED, GR_MORTAR, drawPass)

const drawPass = (ctx: CanvasRenderingContext2D, size: number, rnd: T_Rnd) => {
    const bw = size / COLS
    const bh = size / ROWS

    for (let j = 0; j < ROWS; ++j) {
        // нечётный ряд сдвинут на полкирпича; крайний кирпич такого ряда уезжает
        // за правый край, и его хвост приходит слева соседним проходом seamless
        const shift = (j % 2) * .5 * bw

        for (let k = 0; k < COLS; ++k) {
            const x0 = k * bw + shift + JOINT * bw * .5
            const y0 = j * bh + JOINT * bh * .5
            const x1 = x0 + bw - JOINT * bw
            const y1 = y0 + bh - JOINT * bh

            const jit = (amp: number) => (rnd() - .5) * 2 * amp
            const corner = (x: number, y: number): P =>
                [x + jit(CORNER_JITTER * bw), y + jit(CORNER_JITTER * bh)]

            const a = corner(x0, y0)
            const b = corner(x1, y0)
            const c = corner(x1, y1)
            const d = corner(x0, y1)

            const offs = (amp: number) => {
                const o: number[] = []
                for (let m = 1; m < EDGE_SEGMENTS; ++m) o.push(jit(amp))
                return o
            }

            // грани кирпича — ломаные, поэтому шов раствора между соседями рваный
            const path: P[] = [
                ...broken(a, b, offs(EDGE_JITTER * bh)),
                ...broken(b, c, offs(EDGE_JITTER * bw)).slice(1),
                ...broken(c, d, offs(EDGE_JITTER * bh)).slice(1),
                ...broken(d, a, offs(EDGE_JITTER * bw)).slice(1, -1),
            ]

            const base = clamp255(GR_BRICK + jit(GR_BRICK_SPREAD))

            trace(ctx, path, true)
            ctx.fillStyle = gray(base)
            ctx.fill()

            ctx.save()
            ctx.clip()

            // фаска внутрь: высота спадает от середины кирпича к раствору
            for (let m = 0; m < CHAMFER_W.length; ++m) {
                trace(ctx, path, true)
                ctx.lineWidth = CHAMFER_W[m] * bh
                ctx.strokeStyle = gray(Math.min(base, GR_CHAMFER[m]))
                ctx.stroke()
            }

            const inBrick = (): P => [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)]

            // сколы: рваные пятна у краёв, темнее кирпича — выбоины, а не грязь
            for (let s = 0; s < CHIPS_PER_BRICK; ++s) {
                const edge = rnd()
                const p: P = edge < .25 ? [x0 + rnd() * (x1 - x0), y0]
                    : edge < .5 ? [x0 + rnd() * (x1 - x0), y1]
                    : edge < .75 ? [x0, y0 + rnd() * (y1 - y0)]
                    : [x1, y0 + rnd() * (y1 - y0)]

                trace(ctx, shard(p, (.10 + rnd() * .18) * bh, 5 + ((rnd() * 3) | 0), rnd), true)
                ctx.fillStyle = grayA(GR_CHIP, .55 + rnd() * .3)
                ctx.fill()
            }

            // короткие трещины поперёк кирпича
            for (let s = 0; s < CRACKS_PER_BRICK; ++s) {
                const p = inBrick()
                const ang = rnd() * Math.PI * 2
                const len = (.3 + rnd() * .5) * bh
                const q: P = [p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len]

                trace(ctx, broken(p, q, offs(EDGE_JITTER * bh)), false)
                ctx.lineWidth = CRACK_W * bh
                ctx.strokeStyle = grayA(GR_CRACK, .7)
                ctx.stroke()
            }

            grain(ctx, rnd, GRAIN_PER_BRICK, inBrick, base, GR_GRAIN, .05 * bh)

            ctx.restore()
        }
    }
}

// Canvas создаётся при первом обращении, а не при импорте модуля:
// document на момент импорта может быть недоступен.
let cached: HTMLCanvasElement | null = null

export const map01 = (): HTMLCanvasElement => cached || (cached = createMap01())

// отладочный показ поверх сцены — как show() в TexturesCanvas
export const showMap01 = (canvas: HTMLCanvasElement = map01()) => {
    document.body.appendChild(canvas)
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.zIndex = '100'
    canvas.style.border = '1px solid red'
}
