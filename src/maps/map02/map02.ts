// Потолок: тёсаная порода. Сетки нет вообще — по площади разбросаны рваные пластины
// породы разной яркости, сквозь них идут длинные ломаные трещины со сколотым светлым
// краем, поверх — каверны и крупная крошка.
// Отличие от пола (maps/map00) и стен (maps/map01): те построены на регулярной раскладке
// (плиты и ряды кирпича), здесь порядка нет, и рисунок не читается рядами при взгляде вверх.
// Серый = высота, механика бесшовности и требования к draw — в maps/texUtils.

import {
    type P, type T_Rnd, broken, clamp255, grain, grayA, seamless, shard, trace,
} from '../texUtils'

const S = 512
const SEED = 20261102

// потолок темнее пола и стен: света он получает меньше, и рельеф на нём мельче
const GR_BASE = 132
const GR_PLATE_SPREAD = 30
const GR_CRACK = 46
const GR_CRACK_LIP = 190
const GR_PIT = 58
const GR_GRAIN = 28

// пластины, трещины и каверны мельче прежних примерно в 2.5 раза, а число их поднято
// пропорционально площади, иначе порода расползлась бы в редкие пятна на голом фоне
const PLATES = 90
const CRACKS = 22
const PITS = 70
const GRAIN_COUNT = 1500

// звеньев в длинной трещине и её боковой увод, в долях стороны
const CRACK_SEGMENTS = 5
const CRACK_JITTER = .018
const CRACK_LEN = [.14, .34]
const CRACK_W = .0045
const LIP_W = .0026

export const createMap02 = (size: number = S): HTMLCanvasElement =>
    seamless(size, SEED, GR_BASE, drawPass)

const drawPass = (ctx: CanvasRenderingContext2D, size: number, rnd: T_Rnd) => {
    const at = (): P => [rnd() * size, rnd() * size]

    // пластины породы: широкие рваные пятна, перекрывающие друг друга
    for (let i = 0; i < PLATES; ++i) {
        const c = at()
        const r = (.040 + rnd() * .065) * size
        const base = clamp255(GR_BASE + (rnd() - .5) * 2 * GR_PLATE_SPREAD)

        trace(ctx, shard(c, r, 6 + ((rnd() * 5) | 0), rnd), true)
        ctx.fillStyle = grayA(base, .55 + rnd() * .35)
        ctx.fill()
    }

    // трещины: длинные ломаные, дно тёмное, а с одной стороны идёт светлый скол —
    // из-за него bumpMap читает стенку каверны, а не просто тёмную линию
    for (let i = 0; i < CRACKS; ++i) {
        const a = at()
        const ang = rnd() * Math.PI * 2
        const len = (CRACK_LEN[0] + rnd() * (CRACK_LEN[1] - CRACK_LEN[0])) * size
        const b: P = [a[0] + Math.cos(ang) * len, a[1] + Math.sin(ang) * len]

        const offs: number[] = []
        for (let k = 1; k < CRACK_SEGMENTS; ++k) offs.push((rnd() - .5) * 2 * CRACK_JITTER * size)

        const pts = broken(a, b, offs)
        const lip = (rnd() < .5 ? 1 : -1) * CRACK_W * size

        trace(ctx, pts.map(([x, y]): P => [x - Math.sin(ang) * lip, y + Math.cos(ang) * lip]), false)
        ctx.lineWidth = LIP_W * size
        ctx.strokeStyle = grayA(GR_CRACK_LIP, .5)
        ctx.stroke()

        trace(ctx, pts, false)
        ctx.lineWidth = CRACK_W * size
        ctx.strokeStyle = grayA(GR_CRACK, .85)
        ctx.stroke()

        // ответвления: короткие ломаные от случайных изломов основной трещины
        const branches = 1 + ((rnd() * 3) | 0)
        for (let k = 0; k < branches; ++k) {
            const from = pts[1 + ((rnd() * (pts.length - 2)) | 0)]
            const bAng = ang + (rnd() - .5) * 2
            const bLen = (.02 + rnd() * .05) * size
            const to: P = [from[0] + Math.cos(bAng) * bLen, from[1] + Math.sin(bAng) * bLen]

            trace(ctx, broken(to, from, [(rnd() - .5) * 2 * CRACK_JITTER * size * .4]), false)
            ctx.lineWidth = CRACK_W * size * .6
            ctx.strokeStyle = grayA(GR_CRACK, .7)
            ctx.stroke()
        }
    }

    // каверны: мелкие тёмные выбоины со светлым ободком по верхнему краю
    for (let i = 0; i < PITS; ++i) {
        const c = at()
        const r = (.005 + rnd() * .012) * size
        const pit = shard(c, r, 5 + ((rnd() * 3) | 0), rnd)

        trace(ctx, pit, true)
        ctx.fillStyle = grayA(GR_PIT, .6 + rnd() * .3)
        ctx.fill()

        trace(ctx, pit.map(([x, y]): P => [x, y - r * .25]), true)
        ctx.lineWidth = LIP_W * size * .7
        ctx.strokeStyle = grayA(GR_CRACK_LIP, .3)
        ctx.stroke()
    }

    grain(ctx, rnd, GRAIN_COUNT, at, GR_BASE, GR_GRAIN, .0035 * size)
}

// Canvas создаётся при первом обращении, а не при импорте модуля:
// document на момент импорта может быть недоступен.
let cached: HTMLCanvasElement | null = null

export const map02 = (): HTMLCanvasElement => cached || (cached = createMap02())

// отладочный показ поверх сцены — как show() в TexturesCanvas
export const showMap02 = (canvas: HTMLCanvasElement = map02()) => {
    document.body.appendChild(canvas)
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.zIndex = '100'
    canvas.style.border = '1px solid red'
}
