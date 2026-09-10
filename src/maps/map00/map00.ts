// Карта уровня, нарисованная на canvas — по образцу фабрик тайлов
// в chapter10/entities/TexturesCanvas.ts (create1 и соседи):
// функция создаёт свой canvas, рисует в 2d-контексте и возвращает его.
// В отличие от тайлов атласа, карта не квадрат 256 и не идёт в THREE.CanvasTexture —
// её размер задаётся снаружи, а читать её предполагается пикселями.

const S = 512

const COL_BG = '#0e1013'
const COL_GRID = '#1b2129'
const COL_ROOM = '#4db5ff'
const COL_WAY = '#234e6c'
const COL_GATE = '#ffb74d'

type T_Room = { x: number, y: number, r: number }

// доли от стороны, чтобы карта не зависела от S
const ROOMS: T_Room[] = [
    { x: .50, y: .82, r: .050 },
    { x: .50, y: .58, r: .085 },
    { x: .24, y: .40, r: .065 },
    { x: .74, y: .38, r: .070 },
    { x: .48, y: .18, r: .060 },
]

// пары индексов ROOMS, между которыми идёт коридор
const WAYS: [number, number][] = [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4]]

const WAY_WIDTH = .022
const GRID_STEP = 8

export const createMap00 = (size: number = S): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')

    ctx.fillStyle = COL_BG
    ctx.fillRect(0, 0, size, size)

    ctx.strokeStyle = COL_GRID
    ctx.lineWidth = 1
    const step = size / GRID_STEP
    for (let i = 1; i < GRID_STEP; i++) {
        ctx.beginPath()
        ctx.moveTo(i * step, 0)
        ctx.lineTo(i * step, size)
        ctx.moveTo(0, i * step)
        ctx.lineTo(size, i * step)
        ctx.stroke()
    }

    // коридоры рисуются раньше залов, чтобы залы перекрыли их концы
    ctx.strokeStyle = COL_WAY
    ctx.lineWidth = WAY_WIDTH * size
    ctx.lineCap = 'round'
    for (const [a, b] of WAYS) {
        ctx.beginPath()
        ctx.moveTo(ROOMS[a].x * size, ROOMS[a].y * size)
        ctx.lineTo(ROOMS[b].x * size, ROOMS[b].y * size)
        ctx.stroke()
    }

    ctx.fillStyle = COL_ROOM
    for (const room of ROOMS) {
        ctx.beginPath()
        ctx.arc(room.x * size, room.y * size, room.r * size, 0, Math.PI * 2)
        ctx.fill()
    }

    // вход: первый зал в списке
    ctx.strokeStyle = COL_GATE
    ctx.lineWidth = size * .008
    ctx.beginPath()
    ctx.arc(ROOMS[0].x * size, ROOMS[0].y * size, ROOMS[0].r * size * 1.6, 0, Math.PI * 2)
    ctx.stroke()

    return canvas
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
