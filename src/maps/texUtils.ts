// Общая механика процедурных текстур из src/maps: map00 (пол), map01 (стены), map02 (потолок).
//
// Все три рисуются в оттенках серого, потому что один и тот же canvas идёт и в map,
// и в bumpMap: яркость читается как высота. 0 — дно шва, 255 — самая выступающая точка.
//
// Бесшовность делает seamless(): отрисовка гоняется девять раз со сдвигом на -size, 0, +size
// по обеим осям, поэтому всё, что вылезло за край, дорисовывается с противоположной стороны.
// Отсюда требование ко всем draw-функциям: каждый проход обязан рисовать ровно одно и то же.
// Math.random не годится — seamless выдаёт в draw свежий mulberry32 с фиксированным сидом,
// а порядок обхода фигур внутри draw должен быть неизменным.
// Всё, что раскладывается по сетке, обязано брать джиттер по индексу с modulo, иначе правый
// край сетки не совпадёт с левым.

export type P = [number, number]

// mulberry32: короткий детерминированный генератор, чтобы девять проходов совпали
export const mulberry32 = (seed: number) => {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6D2B79F5) >>> 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export const gray = (v: number) => `rgb(${v | 0},${v | 0},${v | 0})`
export const grayA = (v: number, a: number) => `rgba(${v | 0},${v | 0},${v | 0},${a})`
export const clamp255 = (v: number) => v < 0 ? 0 : v > 255 ? 255 : v
export const mod = (i: number, n: number) => ((i % n) + n) % n

export type T_Rnd = () => number
export type T_Draw = (ctx: CanvasRenderingContext2D, size: number, rnd: T_Rnd) => void

export type T_SeamlessOpts = {
    // период повторения рисунка по оси; 0 — по этой оси не заворачивать вовсе.
    // Период меньше size нужен, когда текстура ложится не на весь тайл атласа,
    // а на его внутреннюю часть за вычетом PAD: заворачивать надо ровно то окно,
    // которое потом семплится
    periodX?: number,
    periodY?: number,
}

export const seamless = (
    size: number, seed: number, baseGray: number, draw: T_Draw, opts: T_SeamlessOpts = {},
): HTMLCanvasElement => {
    const { periodX = size, periodY = size } = opts
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    ctx.lineJoin = 'bevel'
    ctx.lineCap = 'butt'

    ctx.fillStyle = gray(baseGray)
    ctx.fillRect(0, 0, size, size)

    const offsets = (period: number) => period > 0 ? [-period, 0, period] : [0]

    for (const oy of offsets(periodY)) {
        for (const ox of offsets(periodX)) {
            ctx.save()
            ctx.translate(ox, oy)
            draw(ctx, size, mulberry32(seed))
            ctx.restore()
        }
    }

    return canvas
}

export const trace = (ctx: CanvasRenderingContext2D, pts: P[], close: boolean) => {
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let k = 1; k < pts.length; ++k) ctx.lineTo(pts[k][0], pts[k][1])
    if (close) ctx.closePath()
}

// ломаная между двумя точками: звенья прямые, каждый излом уводит точку вбок от оси
// на offs[k]; число звеньев — offs.length + 1
export const broken = (a: P, b: P, offs: number[]): P[] => {
    const segments = offs.length + 1
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len

    const pts: P[] = [a]
    for (let k = 1; k < segments; ++k) {
        const t = k / segments
        const o = offs[k - 1]
        pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o])
    }
    pts.push(b)
    return pts
}

// рваный многоугольник вокруг точки: то самое «пятно под ломаный камень»
export const shard = (c: P, r: number, corners: number, rnd: T_Rnd): P[] => {
    const pts: P[] = []
    for (let k = 0; k < corners; ++k) {
        const a = (k / corners) * Math.PI * 2
        const rr = r * (.55 + rnd() * .65)
        pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr])
    }
    return pts
}

// мелкая крупа поверх залитой фигуры, чтобы она не читалась ровным пятном
export const grain = (
    ctx: CanvasRenderingContext2D, rnd: T_Rnd, count: number,
    at: () => P, base: number, spread: number, maxR: number,
) => {
    for (let g = 0; g < count; ++g) {
        const p = at()
        ctx.beginPath()
        ctx.arc(p[0], p[1], (.25 + rnd() * .75) * maxR, 0, Math.PI * 2)
        ctx.fillStyle = grayA(base + (rnd() < .5 ? -spread : spread), .25 + rnd() * .35)
        ctx.fill()
    }
}
