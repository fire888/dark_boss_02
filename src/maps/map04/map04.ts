// Потолок зала: круговой свод. Текстура нарисована в той же полярной развёртке, что и пол
// зала (maps/map03): по горизонтали угол, по вертикали радиус, низ картинки — центр зала,
// верх — обод. Поэтому вертикальные полосы становятся радиальными балками, сходящимися
// к центру, горизонтальные — концентрическими кольцами, а нижняя полоса картинки —
// круглым элементом в самой середине потолка.
//
// Развёртку делает room00 (uv потолка: u — угол, v — радиус), рисунок рассчитан на TURNS
// копий тайла на оборот: балок на потолке выходит BEAMS * TURNS.
//
// Заворачивается только по горизонтали и только по тому окну тайла, которое семплится
// (TILE_PAD_FRACTION), иначе на потолке будет виден радиальный шов.
// Серый = высота, остальная механика — в maps/texUtils.

import {
    type P, type T_Rnd, broken, clamp255, grain, gray, grayA, seamless, trace,
} from '../texUtils'

const S = 512
const SEED = 20260215

// столько копий тайла укладывается на полный оборот — то же число, что turns у room00
export const TURNS = 4

// балок на копию (итого BEAMS * TURNS по кругу) и ширина балки в долях сектора.
// Балка не прямоугольная, а сходящаяся: к центру зала она сужается до TAPER своей ширины
// у обода. Прямоугольник в развёртке дал бы на потолке пучок параллельных полос — внутри
// треугольника веера uv интерполируется линейно, и строго радиальным остаётся только луч
// через его вершину в центре. Сужение гонит балку в центр даже там, где веер грубоват
const BEAMS = 3
const BEAM_W = .12
const TAPER = .4
// поперечины на балке — короткие тёмные риски, чтобы она не читалась ровной полосой
const NOTCHES = 7

// радиусы в долях r: докуда идёт центральный элемент, его ядро и где начинается карниз
const MED_V = .28
const CORE_V = .09
const RIM_V = .93
// лучей розетки на копию
const ROSETTE = 6

// яркости: поле между балками — низ рельефа, балка и кольца — верх
const GR_FIELD = 118
const GR_BEAM = 180
const GR_BEAM_EDGE = 88
const GR_BEAM_CROWN = 206
const GR_NOTCH = 120
const GR_MED = 150
const GR_MED_RING = 208
const GR_MED_CORE = 86
const GR_ROSETTE = 190
const GR_RIM = 170
const GR_CRACK = 92
const GR_GRAIN = 20

const FIELD_CRACKS = 10
const FIELD_GRAIN = 900
const BEAM_GRAIN = 60

export const createMap04 = (size: number = S, padFrac: number = 0): HTMLCanvasElement =>
    seamless(
        size, SEED, GR_FIELD,
        (ctx, s, rnd) => drawPass(ctx, s, rnd, padFrac),
        { periodX: size * (1 - 2 * padFrac), periodY: 0 },
    )

const drawPass = (ctx: CanvasRenderingContext2D, size: number, rnd: T_Rnd, padFrac: number) => {
    const inset = padFrac * size
    const W = size - 2 * inset
    const H = W

    // v = 0 внизу картинки (центр зала), v = 1 наверху (обод)
    const yOf = (vv: number) => inset + H - vv * H
    const at = (): P => [inset + rnd() * W, inset + rnd() * H]

    // поле между балками: трещины и зерно по всему окну
    for (let i = 0; i < FIELD_CRACKS; ++i) {
        const a = at()
        const ang = rnd() * Math.PI * 2
        const len = (.08 + rnd() * .22) * W
        const b: P = [a[0] + Math.cos(ang) * len, a[1] + Math.sin(ang) * len]

        trace(ctx, broken(a, b, [(rnd() - .5) * .04 * W, (rnd() - .5) * .04 * W]), false)
        ctx.lineWidth = .004 * W
        ctx.strokeStyle = grayA(GR_CRACK, .7)
        ctx.stroke()
    }
    grain(ctx, rnd, FIELD_GRAIN, at, GR_FIELD, GR_GRAIN, .004 * W)

    // радиальные балки: сходящаяся к центру полоса от карниза до центрального элемента
    const sector = W / BEAMS
    for (let b = 0; b < BEAMS; ++b) {
        const xc = inset + (b + .5) * sector
        const half = BEAM_W * sector * .5
        const yTop = yOf(1)
        const yBot = yOf(MED_V)

        // полуширина балки на высоте y: у обода полная, у медальона TAPER от неё
        const halfAt = (y: number) => half * (TAPER + (1 - TAPER) * (yBot - y) / (yBot - yTop))
        // трапеция вдоль балки: k0 и k1 — доли полуширины, от них берутся оба борта
        const strip = (k0: number, k1: number): P[] => [
            [xc + k0 * halfAt(yTop), yTop], [xc + k1 * halfAt(yTop), yTop],
            [xc + k1 * halfAt(yBot), yBot], [xc + k0 * halfAt(yBot), yBot],
        ]

        trace(ctx, strip(-1, 1), true)
        ctx.fillStyle = gray(GR_BEAM)
        ctx.fill()

        // фаски по бокам: высота спадает от гребня балки к полю
        const edge = .3
        ctx.fillStyle = gray(GR_BEAM_EDGE)
        trace(ctx, strip(-1, -1 + edge), true)
        ctx.fill()
        trace(ctx, strip(1 - edge, 1), true)
        ctx.fill()

        // гребень: самая высокая линия посередине балки
        trace(ctx, strip(-.18, .18), true)
        ctx.fillStyle = gray(GR_BEAM_CROWN)
        ctx.fill()

        // поперечные риски: короче у центра ровно настолько, насколько сужается балка
        for (let k = 1; k < NOTCHES; ++k) {
            const y = yTop + (yBot - yTop) * k / NOTCHES + (rnd() - .5) * .01 * H
            const hw = halfAt(y) * (1 - edge)
            ctx.fillStyle = grayA(GR_NOTCH, .8)
            ctx.fillRect(xc - hw, y, hw * 2, .006 * H)
        }

        const inBeam = (): P => {
            const y = yTop + rnd() * (yBot - yTop)
            return [xc + (rnd() - .5) * 2 * halfAt(y), y]
        }
        grain(ctx, rnd, BEAM_GRAIN, inBeam, GR_BEAM, GR_GRAIN, .004 * W)
    }

    // карниз по ободу: кольцо там, где потолок сходится со стеной
    ctx.fillStyle = gray(GR_RIM)
    ctx.fillRect(inset, yOf(1), W, yOf(RIM_V) - yOf(1))
    ctx.fillStyle = grayA(GR_CRACK, .8)
    ctx.fillRect(inset, yOf(RIM_V), W, .008 * H)

    // центральный элемент: нижняя полоса картинки, на потолке это круг в середине
    ctx.fillStyle = gray(GR_MED)
    ctx.fillRect(inset, yOf(MED_V), W, yOf(0) - yOf(MED_V))

    // розетка: чередование лучей, на потолке они расходятся от центра
    const ray = W / ROSETTE
    for (let k = 0; k < ROSETTE; ++k) {
        ctx.fillStyle = grayA(GR_ROSETTE, .55)
        ctx.fillRect(inset + k * ray, yOf(MED_V), ray * .5, yOf(CORE_V) - yOf(MED_V))
    }

    // обод медальона и его ядро
    ctx.fillStyle = gray(GR_MED_RING)
    ctx.fillRect(inset, yOf(MED_V), W, .012 * H)
    ctx.fillStyle = gray(GR_MED_CORE)
    ctx.fillRect(inset, yOf(CORE_V), W, yOf(0) - yOf(CORE_V))
    ctx.fillStyle = gray(GR_MED_RING)
    ctx.fillRect(inset, yOf(CORE_V), W, .010 * H)

    const inMed = (): P => [inset + rnd() * W, yOf(MED_V) + rnd() * (yOf(0) - yOf(MED_V))]
    grain(ctx, rnd, 200, inMed, clamp255(GR_MED), GR_GRAIN, .004 * W)
}

// Canvas создаётся при первом обращении, а не при импорте модуля:
// document на момент импорта может быть недоступен.
let cached: HTMLCanvasElement | null = null

export const map04 = (): HTMLCanvasElement => cached || (cached = createMap04())

// отладочный показ поверх сцены — как show() в TexturesCanvas
export const showMap04 = (canvas: HTMLCanvasElement = map04()) => {
    document.body.appendChild(canvas)
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.zIndex = '100'
    canvas.style.border = '1px solid red'
}
