import { _GM, type IBuffersGeom, type A2, type A3, type T_LightOpts } from "_CORE/_M/_gm"
import { floor01 } from "geometry/00_floor01/floor01"

// Портал из четырёх граней floor01: пол, левый откос, правый откос и верх (софит). У каждой лицо —
// земля floor01 по сетке тайлов, смотрит в проём. Выдавлен только пол — плита thickness с боками;
// откосы и верх — без выдавливания (height 0 у floor01), только лицо.
//
// Проём — прямоугольник width × height, насквозь по глубине depth. Система координат: pos — середина порога
// по x и z, pos[1] — уровень пола проёма; проход идёт вдоль z, передняя плоскость стены — в +z, к зрителю.
//
// Пол и верх — floor01 как есть: пол — плита под уровнем пола, верх — тот же контур в обратном обходе
// (лицо вниз) на высоте проёма. Откосы — floor01, повёрнутый вокруг оси z на ∓90°: лицо смотрит внутрь
// проёма. Свет floor01 запекает в своей системе координат, поэтому ему передаётся направление
// на «солнце», повёрнутое обратно, — после поворота освещение совпадает с общим.

type T = {
    pos?: A3,                  // середина порога; pos[1] — уровень пола проёма
    width?: number,            // ширина проёма в свету, по x
    height?: number,           // высота проёма в свету, от пола до верха
    depth?: number,            // глубина проёма — толщина стены, по z
    thickness?: number,        // толщина плиты пола под уровнем пола; откосы и верх не выдавлены
    groundTileSize?: number,   // сторона клетки сетки, на которую ложится один тайл земли, — у всех четырёх плит
    groundColorJitter?: number, // разброс яркости земли по клеткам, доля
    // базовые цвета до запечённого освещения; умножаются на тайл атласа
    colorGround?: A3,          // лицо плит — земля
    colorSide?: A3,            // бока плит — рамка по плоскостям стены
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    width: 1.6,
    height: 2.8,
    depth: .6,
    thickness: .2,
    groundTileSize: .5,
    groundColorJitter: .3,
    colorGround: [1, 1, 1],
    colorSide: [.64, .67, .7],
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    // приглушённый оттенок: серый яркости brightness, сдвинутый к случайному тону
    const tint = (brightnessMin: number, brightnessMax: number, saturationMax: number): A3 => {
        const brightness = rand(brightnessMin, brightnessMax)
        const saturation = rand(0, saturationMax)
        const hue = rand(0, Math.PI * 2)
        return [0, 1, 2].map(channel =>
            Math.min(1, Math.max(0, brightness + saturation * Math.cos(hue - channel * Math.PI * 2 / 3)))) as A3
    }
    return {
        width: rand(.8, 3),
        height: rand(1.8, 4),
        depth: rand(.2, 1.5),
        thickness: rand(.05, .4),
        groundTileSize: rand(.3, 1.2),
        groundColorJitter: rand(.15, .4),
        colorGround: tint(.75, .95, .15),
        colorSide: tint(.5, .8, .12),
    }
}

// lightOpts — свет сборщика; по умолчанию общий свет уровня. Нужен составной фабрике, которая поворачивает
// готовый портал (room02 — по стене): она передаёт направление на «солнце», повёрнутое обратно
export const portal01 = (opts: T = {}, lightOpts: T_LightOpts = {}): IBuffersGeom => {
    const { pos, width, height, depth, thickness, groundTileSize, groundColorJitter, colorGround, colorSide }: Required<T> =
        { ...DEFAULT_OPTS, ...opts }

    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }
    const slabLook = { groundTileSize, groundColorJitter, colorGround, colorSide }

    // Прямоугольник в плане floor01 против часовой стрелки сверху: в осях плана [x, −z] площадь положительна
    const rectangleContour = (xFrom: number, xTo: number) => {
        const plan: A2[] = [[xFrom, -depth / 2], [xTo, -depth / 2], [xTo, depth / 2], [xFrom, depth / 2]]
        return plan.map(([x, minusZ]) => ({ x, z: -minusZ }))
    }

    // сдвиг готовой части в pos — и видимой геометрии, и прокси
    const placeAndMerge = (part: IBuffersGeom) => {
        _GM.translateVertices(part.v, pos[0], pos[1], pos[2])
        _GM.translateVertices(part.vCollide, pos[0], pos[1], pos[2])
        _GM.mergeIndexedArrays(result, part)
    }

    // ---- пол: плита толщиной thickness под уровнем пола, лицо вверх на y = 0
    placeAndMerge(floor01({
        ...slabLook,
        pos: [0, -thickness, 0],
        contour: rectangleContour(-width / 2, width / 2),
        height: thickness,
    }, lightOpts))

    // ---- верх: тот же контур в обратном обходе — лицо вниз на y = height, без выдавливания (height 0 — без боков)
    placeAndMerge(floor01({
        ...slabLook,
        pos: [0, height, 0],
        contour: rectangleContour(-width / 2, width / 2).reverse(),
        height: 0,
    }, lightOpts))

    // ---- откосы: лицо строится вверх на y = 0 без выдавливания, длина вдоль локального x — высота проёма,
    // затем поворот вокруг z.
    // Поворот на angle: x' = x·cos − y·sin, y' = x·sin + y·cos
    const LIGHT = lightOpts.light ?? _GM.LIGHT
    const rotateZ = (vector: A3, angle: number): A3 => [
        vector[0] * Math.cos(angle) - vector[1] * Math.sin(angle),
        vector[0] * Math.sin(angle) + vector[1] * Math.cos(angle),
        vector[2],
    ]
    const jamb = (angle: number, localXFrom: number, localXTo: number, shiftX: number) => {
        // свет в системе плиты: общее направление, повёрнутое обратно
        const part = floor01({
            ...slabLook,
            pos: [0, 0, 0],
            contour: rectangleContour(localXFrom, localXTo),
            height: 0,
        }, { ...lightOpts, light: rotateZ(LIGHT, -angle) })
        _GM.rotateVerticesZ(part.v, angle)
        _GM.rotateVerticesZ(part.vCollide, angle)
        _GM.translateVertices(part.v, shiftX, 0, 0)
        _GM.translateVertices(part.vCollide, shiftX, 0, 0)
        placeAndMerge(part)
    }
    // левый: поворот на −90° — лицо +y смотрит в +x, локальный x ∈ [−height, 0] уходит в y ∈ [0, height]
    jamb(-Math.PI / 2, -height, 0, -width / 2)
    // правый: поворот на +90° — лицо смотрит в −x, локальный x ∈ [0, height] — та же высота
    jamb(Math.PI / 2, 0, height, width / 2)

    return result
}
