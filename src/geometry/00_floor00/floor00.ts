import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import { RECT_EARTH, UV_ORNAMENT_Q, UV_WHITE_Q } from "atlases/atlas00/atlas00"
import { RECT_AO_NONE, UV_AO_TOP_Q } from "atlases/atlasAo00/atlasAo00"

// Пол по контуру: плоская плита высотой height над землёй, верх залит землёй по сетке тайлов.
// Вдоль края, с отступом borderOffset внутрь, идёт кантик — полоса плитки шириной borderWidth,
// как полоса по краю площадки у лестниц stairs00. Между краем и кантиком и внутри кантика — земля.
//
// Контур — замкнутая ломаная: каждая точка соединяется со следующей, последняя — с первой.
// Обход — против часовой стрелки при взгляде сверху (x вправо, −z вверх, как на карте уровня);
// контур по часовой разворачивается. Самопересечений быть не должно, контур может быть невыпуклым.
//
// План. Вся плоская математика идёт в координатах плана [x, −z]: в них обход «против часовой
// при взгляде сверху» — это положительная площадь _GM.polygonArea2, и работает _GM.triangulatePolygon.
//
// Атласы. uv — atlas00: земля — RECT_EARTH, тайл на клетку сетки groundTileSize, кантик — плитка
// UV_ORNAMENT_Q, бока плиты — UV_WHITE_Q. uv2 — atlasAo00: тень только у низа боков, у земли.

type T_Point = {
    x: number,
    z: number,
}

type T = {
    pos?: A3,                // смещение контура; pos[1] — уровень земли под плитой
    contour?: T_Point[],     // точки контура относительно pos, против часовой стрелки сверху
    height?: number,         // высота верха плиты над землёй; 0 — без боков, только верх
    borderOffset?: number,   // отступ кантика от края плиты внутрь
    borderWidth?: number,    // ширина кантика, она же сторона одной плитки
    groundTileSize?: number, // сторона клетки сетки, на которую ложится один тайл земли
    // базовые цвета до запечённого освещения; умножаются на тайл атласа
    colorGround?: A3,        // земля
    colorBorder?: A3,        // плитка кантика
    colorSide?: A3,          // бока плиты
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // Г-образный пол 6 × 6 с вырезом 3 × 3 в дальнем правом углу
    contour: [
        { x: -3, z: 3 }, { x: 3, z: 3 }, { x: 3, z: 0 },
        { x: 0, z: 0 }, { x: 0, z: -3 }, { x: -3, z: -3 },
    ],
    height: .15,
    borderOffset: .3,
    borderWidth: .4,
    groundTileSize: 1.5,
    colorGround: [1, 1, 1],
    colorBorder: [1, 1, 1],
    colorSide: [.64, .67, .7],
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    const size = rand(3, 10)
    // точки в плане [x, −z] против часовой стрелки
    let plan: A2[]
    const shapeRoll = Math.random()
    if (shapeRoll < .25) {
        // прямоугольник
        const width = size, depth = size * rand(.4, 1)
        plan = [[0, 0], [width, 0], [width, depth], [0, depth]]
    } else if (shapeRoll < .5) {
        // Г-образный: прямоугольник с вырезанным углом
        const width = size, depth = size * rand(.6, 1)
        const cutX = width * rand(.35, .65), cutZ = depth * rand(.35, .65)
        plan = [[0, 0], [width, 0], [width, cutZ], [cutX, cutZ], [cutX, depth], [0, depth]]
    } else {
        // звёздчатый многоугольник: углы по кругу с разбросом, радиус от .6 до 1 — без острых углов
        const pointCount = 3 + Math.floor(Math.random() * 7)
        plan = []
        for (let i = 0; i < pointCount; ++i) {
            const angle = (i + rand(-.3, .3)) / pointCount * Math.PI * 2
            const distance = size / 2 * (pointCount <= 4 ? 1 : rand(.6, 1))
            plan.push([Math.cos(angle) * distance, Math.sin(angle) * distance])
        }
    }
    // иногда — обход по часовой: фабрика обязана его развернуть
    if (Math.random() < .2) plan.reverse()
    // приглушённый оттенок: серый яркости brightness, сдвинутый к случайному тону
    const tint = (brightnessMin: number, brightnessMax: number, saturationMax: number): A3 => {
        const brightness = rand(brightnessMin, brightnessMax)
        const saturation = rand(0, saturationMax)
        const hue = rand(0, Math.PI * 2)
        return [0, 1, 2].map(channel =>
            Math.min(1, Math.max(0, brightness + saturation * Math.cos(hue - channel * Math.PI * 2 / 3)))) as A3
    }
    return {
        contour: plan.map(([x, minusZ]) => ({ x, z: -minusZ })),
        height: Math.random() < .2 ? 0 : rand(.05, .4),
        borderOffset: Math.random() < .2 ? 0 : rand(.1, .6),
        borderWidth: rand(.25, .6),
        groundTileSize: rand(.8, 2.5),
        colorGround: tint(.75, .95, .15),
        colorBorder: tint(.75, .95, .15),
        colorSide: tint(.5, .8, .12),
    }
}

export const floor00 = (opts: T = {}): IBuffersGeom => {
    const {
        pos, contour, height, borderOffset, borderWidth, groundTileSize, colorGround, colorBorder, colorSide,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const builder = _GM.createGeomBuilder()
    const { quad, tri, collideTri } = builder

    const UP: A3 = [0, 1, 0]
    const AO_SHADOW_AT_BOTTOM = _GM.flipUvQ(UV_AO_TOP_Q)
    const AO_UNSHADED_POINT = _GM.rectPoint(RECT_AO_NONE, .5, .5)
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

    // ---- контур в плане: без повторяющихся соседних точек, против часовой стрелки

    const plan: A2[] = []
    for (const { x, z } of contour) {
        const last = plan[plan.length - 1]
        if (!last || Math.hypot(x - last[0], -z - last[1]) > 1e-6) plan.push([x, -z])
    }
    while (plan.length > 1 && Math.hypot(plan[0][0] - plan[plan.length - 1][0], plan[0][1] - plan[plan.length - 1][1]) <= 1e-6) {
        plan.pop()
    }
    if (plan.length < 3 || Math.abs(_GM.polygonArea2(plan)) < 1e-9) return builder.g
    if (_GM.polygonArea2(plan) < 0) plan.reverse()
    const pointCount = plan.length

    // точка плана на высоте над землёй — в мир
    const worldAt = (point: A2, aboveGround: number): A3 => [pos[0] + point[0], pos[1] + aboveGround, pos[2] - point[1]]

    // ---- рёбра: единичное направление, длина и нормаль внутрь (влево от направления при обходе против часовой)

    const edgeDirections: A2[] = []
    const edgeLengths: number[] = []
    for (let i = 0; i < pointCount; ++i) {
        const start = plan[i], end = plan[(i + 1) % pointCount]
        const length = Math.hypot(end[0] - start[0], end[1] - start[1])
        edgeLengths.push(length)
        edgeDirections.push([(end[0] - start[0]) / length, (end[1] - start[1]) / length])
    }
    const inwardNormalOf = (edge: number): A2 => [-edgeDirections[edge][1], edgeDirections[edge][0]]

    // Укорочение рёбер при сдвиге контура внутрь на единицу: в выпуклой вершине оба соседних ребра
    // укорачиваются на tan(половины поворота), в вогнутой — удлиняются (значение отрицательное)
    const vertexShortening: number[] = []
    for (let i = 0; i < pointCount; ++i) {
        const incoming = edgeDirections[(i + pointCount - 1) % pointCount], outgoing = edgeDirections[i]
        const cross = incoming[0] * outgoing[1] - incoming[1] * outgoing[0]
        const dot = incoming[0] * outgoing[0] + incoming[1] * outgoing[1]
        vertexShortening.push(cross / Math.max(1e-6, 1 + dot))
    }
    // Наибольший сдвиг, при котором ни одно ребро ещё не схлопнулось; кантик с отступом ужимаются
    // в него с запасом, иначе сдвинутый контур вывернется
    let maxInset = Infinity
    for (let i = 0; i < pointCount; ++i) {
        const shortening = vertexShortening[i] + vertexShortening[(i + 1) % pointCount]
        if (shortening > 1e-9) maxInset = Math.min(maxInset, edgeLengths[i] / shortening)
    }
    const insetScale = Math.min(1, .9 * maxInset / Math.max(1e-9, borderOffset + borderWidth))
    const borderStart = borderOffset * insetScale
    const borderEnd = (borderOffset + borderWidth) * insetScale

    // Контур, сдвинутый внутрь на inset: вершина уходит по биссектрисе на inset / cos(половины поворота),
    // чтобы каждое ребро сдвинулось ровно на inset
    const insetContour = (inset: number): A2[] => plan.map((point, i) => {
        const normalBefore = inwardNormalOf((i + pointCount - 1) % pointCount), normalAfter = inwardNormalOf(i)
        const scale = inset / Math.max(1e-6, 1 + normalBefore[0] * normalAfter[0] + normalBefore[1] * normalAfter[1])
        return [point[0] + (normalBefore[0] + normalAfter[0]) * scale, point[1] + (normalBefore[1] + normalAfter[1]) * scale]
    })
    const borderOuter = insetContour(borderStart)
    const borderInner = insetContour(borderEnd)

    // ---- земля: выпуклый кусок плана режется по сетке groundTileSize, у каждой клетки — свой целый тайл.
    // Сетка привязана к pos, поэтому соседние куски и соседние полы с тем же pos стыкуются тайлами
    const fillGround = (piece: A2[]) => {
        let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity
        for (const [x, y] of piece) {
            xMin = Math.min(xMin, x); xMax = Math.max(xMax, x)
            yMin = Math.min(yMin, y); yMax = Math.max(yMax, y)
        }
        const cellXFrom = Math.floor(xMin / groundTileSize), cellXTo = Math.ceil(xMax / groundTileSize)
        const cellYFrom = Math.floor(yMin / groundTileSize), cellYTo = Math.ceil(yMax / groundTileSize)
        for (let cellX = cellXFrom; cellX < cellXTo; ++cellX) {
            for (let cellY = cellYFrom; cellY < cellYTo; ++cellY) {
                const cellLeft = cellX * groundTileSize, cellBottom = cellY * groundTileSize
                const cellPart = _GM.clipPolygonToRect(piece, cellLeft, cellBottom, cellLeft + groundTileSize, cellBottom + groundTileSize)
                if (cellPart.length < 3) continue
                const uvAt = (point: A2) => _GM.rectPoint(
                    RECT_EARTH,
                    clamp01((point[0] - cellLeft) / groundTileSize),
                    clamp01((point[1] - cellBottom) / groundTileSize),
                )
                // кусок клетки выпуклый — веер из первой точки
                for (let k = 1; k < cellPart.length - 1; ++k) {
                    const a = cellPart[0], b = cellPart[k], c = cellPart[k + 1]
                    if (Math.abs(_GM.polygonArea2([a, b, c])) < 1e-9) continue
                    tri(
                        worldAt(a, height), worldAt(b, height), worldAt(c, height), UP,
                        [...uvAt(a), ...uvAt(b), ...uvAt(c)],
                        [...AO_UNSHADED_POINT, ...AO_UNSHADED_POINT, ...AO_UNSHADED_POINT],
                        colorGround,
                    )
                }
            }
        }
    }

    // отступ между краем и кантиком: по трапеции на ребро
    if (borderStart > 1e-6) {
        for (let i = 0; i < pointCount; ++i) {
            const next = (i + 1) % pointCount
            fillGround([plan[i], plan[next], borderOuter[next], borderOuter[i]])
        }
    }
    // середина внутри кантика — невыпуклая, сначала на треугольники
    const innerTriangles = _GM.triangulatePolygon(borderInner)
    for (let k = 0; k < innerTriangles.length; k += 3) {
        fillGround([borderInner[innerTriangles[k]], borderInner[innerTriangles[k + 1]], borderInner[innerTriangles[k + 2]]])
    }

    // ---- кантик: вдоль каждого ребра целое число плиток; низ тайла — к краю плиты.
    // Угловые плитки срезаны по биссектрисе угла, как стык полос на углу
    for (let i = 0; i < pointCount; ++i) {
        const next = (i + 1) % pointCount
        const outerStart = borderOuter[i], outerEnd = borderOuter[next]
        const innerStart = borderInner[i], innerEnd = borderInner[next]
        const middleLength = (Math.hypot(outerEnd[0] - outerStart[0], outerEnd[1] - outerStart[1])
            + Math.hypot(innerEnd[0] - innerStart[0], innerEnd[1] - innerStart[1])) / 2
        const tileCount = Math.max(1, Math.round(middleLength / Math.max(1e-6, borderEnd - borderStart)))
        const lerp = (from: A2, to: A2, t: number): A2 => [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
        for (let tile = 0; tile < tileCount; ++tile) {
            const tFrom = tile / tileCount, tTo = (tile + 1) / tileCount
            quad(
                worldAt(lerp(outerStart, outerEnd, tFrom), height), worldAt(lerp(outerStart, outerEnd, tTo), height),
                worldAt(lerp(innerStart, innerEnd, tTo), height), worldAt(lerp(innerStart, innerEnd, tFrom), height),
                UP, UV_ORNAMENT_Q, _GM.rectUvQ(RECT_AO_NONE), colorBorder,
            )
        }
    }

    // ---- бока плиты: по квадру на ребро, нормаль наружу — вправо от направления; тень внизу — низ у земли
    if (height > 1e-6) {
        for (let i = 0; i < pointCount; ++i) {
            const start = plan[i], end = plan[(i + 1) % pointCount]
            const inward = inwardNormalOf(i)
            const outwardNormal: A3 = [-inward[0], 0, inward[1]]
            quad(
                worldAt(start, 0), worldAt(end, 0), worldAt(end, height), worldAt(start, height),
                outwardNormal, UV_WHITE_Q, AO_SHADOW_AT_BOTTOM, colorSide,
            )
        }
    }

    // ---- прокси физики: только верх по исходному контуру, без кантика и сетки.
    // Бока не нужны: плита низкая, на неё заходят, а не упираются
    const topTriangles = _GM.triangulatePolygon(plan)
    for (let k = 0; k < topTriangles.length; k += 3) {
        collideTri(worldAt(plan[topTriangles[k]], height), worldAt(plan[topTriangles[k + 1]], height), worldAt(plan[topTriangles[k + 2]], height))
    }

    return builder.g
}
