import { _GM, type IBuffersGeom, type A2, type A3, type T_SweepProfilePoint } from "_CORE/_M/_gm"
import { RECT_WHITE } from "atlases/atlas00/atlas00"
import { RECT_AO_NONE, RECT_AO_TOP } from "atlases/atlasAo00/atlasAo00"

// Перемычка: каменная балка над проёмом, лежит на капителях пилястр (верх портала, см. 02_portal00/ref.jpg).
//
// Контур. Замкнутый многоугольник в плане — лицо архитрава (гладкого пояса балки); снизу им закрыт софит
// (нижняя грань балки над проёмом), по нему же протягивается профиль. Балка может уходить в стену — часть
// внутри стены просто не видна.
//
// Профиль — сечение балки поперёк контура, снизу вверх, точками (вынос от контура наружу, высота):
//   архитрав — гладкий пояс, вынос 0;
//   скат     — выкружка под карнизом, наружу до corniceSlopeProjection;
//   карниз   — полка под плитой (свес вниз) и сама карнизная плита на вынос corniceProjection.
// Профиль протягивается вдоль каждого ребра контура (_GM.sweepProfile), углы стыкуются усом.
//
// Система координат: точки контура — { x, z } относительно pos, pos[1] — низ балки (софит).
// Профиль выступает вправо от хода контура, если смотреть сверху (x вправо, +z к зрителю), — по нормали ребра
// (−dz, dx). Фабрика контур не разворачивает: против часовой стрелки — карниз наружу, по часовой — вывернут внутрь.
//
// Атласы. uv — atlas00, белый тайл под цвет colorFascia / colorCornice. uv2 — atlasAo00: тень во внутренних
// углах профиля (архитрав под карнизом, когда скат крутой); софит и верх — без тени.

type T_PlanPoint = {
    x: number,
    z: number,
}

// Профиль перемычки — всё, кроме положения и контура; его берут составные фабрики (portal00)
export type T_LintelProfile = {
    fasciaHeight?: number,           // высота архитрава — гладкого пояса над проёмом
    corniceSlopeHeight?: number,     // высота ската (выкружки) под карнизом
    corniceSlopeProjection?: number, // вынос верха ската от архитрава
    corniceHeight?: number,          // высота карнизной плиты
    corniceProjection?: number,      // вынос карнизной плиты; между ним и скатом — свес плиты снизу
    // длина, на которую растягивается тайл тени у внутреннего угла; видимая тень — примерно её четверть
    aoLength?: number,
    // базовые цвета до запечённого освещения; умножаются на тайл атласа
    colorFascia?: A3,  // архитрав и софит
    colorCornice?: A3, // скат и карниз
}

type T = T_LintelProfile & {
    pos?: A3,               // начало координат контура; pos[1] — низ балки
    outline?: T_PlanPoint[], // лицо архитрава в плане, замкнутый многоугольник без самопересечений
}

export const DEFAULT_PROFILE: Required<T_LintelProfile> = {
    fasciaHeight: .4,
    corniceSlopeHeight: .12,
    corniceSlopeProjection: .1,
    corniceHeight: .2,
    corniceProjection: .16,
    aoLength: .4,
    colorFascia: [.8, .78, .73],
    colorCornice: [.74, .72, .68],
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // балка 2.4 × 0.8, обход против часовой стрелки — карниз наружу
    outline: [{ x: -1.2, z: -.4 }, { x: -1.2, z: .4 }, { x: 1.2, z: .4 }, { x: 1.2, z: -.4 }],
    ...DEFAULT_PROFILE,
}

// случайный профиль из диапазона, в котором перемычки используются
export const randomProfile = (): Required<T_LintelProfile> => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    // приглушённый оттенок: серый яркости brightness, сдвинутый к случайному тону
    const tint = (brightnessMin: number, brightnessMax: number, saturationMax: number): A3 => {
        const brightness = rand(brightnessMin, brightnessMax)
        const saturation = rand(0, saturationMax)
        const hue = rand(0, Math.PI * 2)
        return [0, 1, 2].map(channel =>
            Math.min(1, Math.max(0, brightness + saturation * Math.cos(hue - channel * Math.PI * 2 / 3)))) as A3
    }
    const corniceProjection = rand(.06, .25)
    return {
        fasciaHeight: rand(.2, .7),
        corniceSlopeHeight: rand(0, .2),
        corniceSlopeProjection: corniceProjection * rand(.3, 1),
        corniceHeight: rand(.08, .3),
        corniceProjection,
        aoLength: rand(.25, .5),
        colorFascia: tint(.65, .92, .12),
        colorCornice: tint(.6, .9, .12),
    }
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    // четырёхугольник: прямоугольник, у которого углы сдвинуты — как над косым проёмом
    const profile = randomProfile()
    // Иногда — обход по часовой стрелке: карниз вывернут внутрь и уходит с обеих сторон на corniceProjection,
    // поэтому балка тогда глубже двух выносов
    const inward = Math.random() < .3
    const halfWidth = rand(.6, 2.5)
    const halfDepth = inward ? rand(profile.corniceProjection + .1, .7 + profile.corniceProjection) : rand(.2, .7)
    const jitter = () => rand(-.15, .15)
    // против часовой стрелки сверху
    const outline: T_PlanPoint[] = [
        { x: -halfWidth + jitter(), z: -halfDepth }, { x: -halfWidth + jitter(), z: halfDepth },
        { x: halfWidth + jitter(), z: halfDepth }, { x: halfWidth + jitter(), z: -halfDepth },
    ]
    if (inward) outline.reverse()
    return { outline, ...profile }
}

export const lintel00 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const { pos, outline, aoLength, colorFascia, colorCornice } = o

    const builder = _GM.createGeomBuilder()
    const { collideQuad, collideTri } = builder

    // ---- контур: без повторяющихся соседних точек; обход не меняется — он задаёт сторону профиля

    const points: A2[] = []
    for (const { x, z } of outline) {
        const last = points[points.length - 1]
        if (!last || Math.hypot(x - last[0], z - last[1]) > 1e-6) points.push([x, z])
    }
    if (points.length > 1 && Math.hypot(points[0][0] - points[points.length - 1][0], points[0][1] - points[points.length - 1][1]) < 1e-6) {
        points.pop()
    }
    if (points.length < 3) return builder.g
    const pointCount = points.length

    // нормаль ребра — вправо от хода, (−dz, dx): наружу у обхода против часовой стрелки
    const edgeNormals: A2[] = []
    for (let i = 0; i < pointCount; ++i) {
        const [x0, z0] = points[i]
        const [x1, z1] = points[(i + 1) % pointCount]
        const length = Math.hypot(x1 - x0, z1 - z0)
        edgeNormals.push([-(z1 - z0) / length, (x1 - x0) / length])
    }

    // Точка контура, вынесенная наружу на distance по биссектрисе угла (ус), — так, чтобы обе соседние
    // грани отстояли от контура ровно на distance. Замкнутый контур: индекс по кругу
    const offsetPoint = (pointIndex: number, distance: number): A2 => {
        const index = pointIndex % pointCount
        const [x, z] = points[index]
        const [normal1X, normal1Z] = edgeNormals[(index + pointCount - 1) % pointCount]
        const [normal2X, normal2Z] = edgeNormals[index]
        // знаменатель — 1 + cos угла между нормалями; ограничен, чтобы на очень остром угле ус не улетал
        const miterScale = distance / Math.max(.2, 1 + normal1X * normal2X + normal1Z * normal2Z)
        return [x + (normal1X + normal2X) * miterScale, z + (normal1Z + normal2Z) * miterScale]
    }

    // ---- профиль: точки (вынос, высота) снизу вверх

    const fasciaHeight = Math.max(0, o.fasciaHeight)
    const corniceSlopeHeight = Math.max(0, o.corniceSlopeHeight)
    const corniceHeight = Math.max(0, o.corniceHeight)
    const corniceProjection = Math.max(0, o.corniceProjection)
    // скат не выходит дальше плиты
    const corniceSlopeProjection = Math.min(corniceProjection, Math.max(0, o.corniceSlopeProjection))
    const slopeTop = fasciaHeight + corniceSlopeHeight
    const totalHeight = slopeTop + corniceHeight
    if (totalHeight <= 0) return builder.g

    const profile: T_SweepProfilePoint[] = [
        { projection: 0, y: 0, color: colorFascia },
        { projection: 0, y: fasciaHeight, color: colorCornice },
        { projection: corniceSlopeProjection, y: slopeTop, color: colorCornice },
        { projection: corniceProjection, y: slopeTop, color: colorCornice },
        { projection: corniceProjection, y: totalHeight, color: colorCornice },
    ]

    _GM.sweepProfile(builder, {
        profile, edgeCount: pointCount, edgeNormals, offsetPoint,
        origin: pos, aoLength, shadowAtStart: false,
        uvRect: RECT_WHITE, aoRectNone: RECT_AO_NONE, aoRectShadow: RECT_AO_TOP,
    })

    // ---- софит (низ по контуру) и верх карнизной плиты

    const aoUnshaded = _GM.rectPoint(RECT_AO_NONE, .5, .5)
    _GM.fillPlanPolygon(builder, points, pos, 0, false, RECT_WHITE, aoUnshaded, colorFascia)
    const topOutline: A2[] = points.map((_, i) => offsetPoint(i, corniceProjection))
    _GM.fillPlanPolygon(builder, topOutline, pos, totalHeight, true, RECT_WHITE, aoUnshaded, colorCornice)

    // ---- прокси физики: призма по контуру архитрава без карниза — бока и софит (в балку упираются головой)

    const worldAt = ([x, z]: A2, y: number): A3 => [pos[0] + x, pos[1] + y, pos[2] + z]
    for (let i = 0; i < pointCount; ++i) {
        const start = points[i]
        const end = points[(i + 1) % pointCount]
        collideQuad(worldAt(start, 0), worldAt(end, 0), worldAt(end, totalHeight), worldAt(start, totalHeight))
    }
    for (let i = 1; i < pointCount - 1; ++i) collideTri(worldAt(points[0], 0), worldAt(points[i], 0), worldAt(points[i + 1], 0))

    return builder.g
}
