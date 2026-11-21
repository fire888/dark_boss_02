import { _GM, type IBuffersGeom, type A2, type A3, type T_SweepProfilePoint } from "_CORE/_M/_gm"
import { RECT_LIMESTONE, RECT_SANDSTONE } from "atlases/atlas00/atlas00"
import { RECT_AO_NONE, RECT_AO_TOP } from "atlases/atlasAo00/atlasAo00"

// Пилястра: выступ из стены — ствол, внизу база, вверху капитель.
//
// Путь. Ствол задаётся ломаной в плане: она выходит из стены, обходит пилястру и возвращается в стену
// (обычно П: от стены вперёд, вдоль, назад к стене). Путь — это лицо ствола; все профили базы и капители
// выстраиваются перед ним, наружу, на свой вынос от пути. Пространство между путём и стеной — тело ствола.
//
// Профиль — сечение пилястры поперёк пути, снизу вверх, точками (вынос от пути, высота):
//   база     — плинт (брусок у земли), над ним полка, скат внутрь, полочка, полка к стволу;
//   ствол    — вынос 0, по самому пути;
//   капитель — полочка, скат наружу, полка под абакой, абака (верхний брусок), её верх до стены.
// Каждый отрезок профиля протягивается вдоль каждого ребра пути — получается квад (_GM.sweepProfile); на изломах
// пути профиль стыкуется усом (биссектрисой угла). Сечения у стены уходят в стену и не рисуются, низ у земли — тоже.
//
// Система координат. Точки пути — { x, z } относительно pos, pos[1] — земля; пилястра выступает от стены.
// Стена у каждого конца пути — прямая через эту точку в направлении startWallDirection / endWallDirection
// (обычно одна стена вдоль x, z = const). Профили выступают вправо от хода пути, если смотреть сверху (x вправо,
// +z к зрителю), — по нормали ребра (−dz, dx). Фабрика путь не разворачивает: против часовой стрелки — профили
// наружу, от стены; по часовой — профили вывернуты внутрь.
//
// Атласы. uv — atlas00: ствол — песчаник RECT_SANDSTONE под colorShaft, база и капитель — известняк RECT_LIMESTONE под
// colorMolding; тайл растянут на каждый отрезок профиля, у ствола — повторяется по высоте, вытянут не больше чем вдвое.
// uv2 — atlasAo00: тень во внутренних углах профиля (ствол над полкой базы и под полочкой капители,
// полки у ствола) и у земли (низ плинта). Тень одной длины aoLength по обе стороны угла: у длинной грани
// затеняется только полоса у угла, остальное — без тени.

type T_PathPoint = {
    x: number,
    z: number,
}

// Профиль пилястры — всё, кроме положения, пути и высоты: её «тип», его берут составные фабрики (portal00)
export type T_PilasterProfile = {
    // база, высоты — снизу вверх; выносы — от пути наружу
    plinthHeight?: number,         // высота плинта
    plinthProjection?: number,     // вынос плинта
    baseSlopeHeight?: number,      // высота ската базы
    baseSlopeProjection?: number,  // вынос низа ската; между ним и плинтом — полка на плинте
    baseFilletHeight?: number,     // высота полочки над скатом
    baseFilletProjection?: number, // вынос полочки; между ней и стволом — полка
    // капитель, высоты — сверху вниз; выносы — от пути наружу
    abacusHeight?: number,            // высота абаки — верхнего бруска
    abacusProjection?: number,        // вынос абаки
    capitalSlopeHeight?: number,      // высота ската капители
    capitalSlopeProjection?: number,  // вынос верха ската; между ним и абакой — полка под абакой
    capitalFilletHeight?: number,     // высота полочки под скатом
    capitalFilletProjection?: number, // вынос полочки; её низ — полка над стволом
    // длина, на которую растягивается тайл тени у внутреннего угла; видимая тень — примерно её четверть
    aoLength?: number,
    // базовые цвета до запечённого освещения; умножаются на тайл атласа
    colorShaft?: A3,   // ствол
    colorMolding?: A3, // база и капитель
}

type T = T_PilasterProfile & {
    pos?: A3,             // начало координат пути; pos[1] — уровень земли
    path?: T_PathPoint[], // лицо ствола в плане: от стены, вокруг пилястры, обратно в стену
    height?: number,      // полная высота пилястры от земли до верха абаки
    // Направление стены в плане [x, z] у первой и у последней точки пути: по нему срезаются профили у стены.
    // Обычно стена одна, вдоль x — [1, 0]; у пилона в проёме (portal00) концы пути — на двух плоскостях стены
    startWallDirection?: A2,
    endWallDirection?: A2,
}

export const DEFAULT_PROFILE: Required<T_PilasterProfile> = {
    plinthHeight: .3,
    plinthProjection: .12,
    baseSlopeHeight: .12,
    baseSlopeProjection: .09,
    baseFilletHeight: .05,
    baseFilletProjection: .03,
    abacusHeight: .18,
    abacusProjection: .14,
    capitalSlopeHeight: .15,
    capitalSlopeProjection: .11,
    capitalFilletHeight: .05,
    capitalFilletProjection: .03,
    aoLength: .4,
    colorShaft: [.85, .83, .78],
    colorMolding: [.75, .73, .7],
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // П: ствол 0.6 вдоль стены, выступ 0.2
    path: [{ x: -.3, z: 0 }, { x: -.3, z: .2 }, { x: .3, z: .2 }, { x: .3, z: 0 }],
    height: 3,
    startWallDirection: [1, 0],
    endWallDirection: [1, 0],
    ...DEFAULT_PROFILE,
}

// Случайный профиль из диапазона, в котором пилястры используются; длины рёбер пути вызывающий подбирает
// по plinthProjection и abacusProjection
export const randomProfile = (): Required<T_PilasterProfile> => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)

    // приглушённый оттенок: серый яркости brightness, сдвинутый к случайному тону
    const tint = (brightnessMin: number, brightnessMax: number, saturationMax: number): A3 => {
        const brightness = rand(brightnessMin, brightnessMax)
        const saturation = rand(0, saturationMax)
        const hue = rand(0, Math.PI * 2)
        return [0, 1, 2].map(channel =>
            Math.min(1, Math.max(0, brightness + saturation * Math.cos(hue - channel * Math.PI * 2 / 3)))) as A3
    }

    // выносы убывают от плинта и абаки к стволу
    const plinthProjection = rand(.06, .16)
    const abacusProjection = rand(.06, .18)
    const baseSlopeProjection = plinthProjection * rand(.4, .9)
    const capitalSlopeProjection = abacusProjection * rand(.4, .9)
    return {
        plinthHeight: rand(.15, .4),
        plinthProjection,
        baseSlopeHeight: rand(.05, .2),
        baseSlopeProjection,
        baseFilletHeight: rand(.02, .08),
        baseFilletProjection: baseSlopeProjection * rand(0, .6),
        abacusHeight: rand(.1, .3),
        abacusProjection,
        capitalSlopeHeight: rand(.05, .25),
        capitalSlopeProjection,
        capitalFilletHeight: rand(.02, .08),
        capitalFilletProjection: capitalSlopeProjection * rand(0, .6),
        aoLength: rand(.25, .5),
        colorShaft: tint(.7, .95, .12),
        colorMolding: tint(.6, .9, .12),
    }
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)

    const profile = randomProfile()
    // Рёбра пути с внутренним (вогнутым) изломом при выносе укорачиваются на вынос с каждой вогнутой стороны,
    // поэтому они не короче minEdge — иначе профиль вывернется
    const minEdge = 2 * Math.max(profile.plinthProjection, profile.abacusProjection) + .05

    // Иногда — путь по часовой стрелке: профили вывернуты внутрь, выпуклые изломы П становятся вогнутыми.
    // Тогда только П, и лицо не короче minEdge, бока — не короче половины: их вогнутый излом лишь с одной стороны
    const inward = Math.random() < .2
    const width = inward ? rand(minEdge, minEdge + .8) : rand(.3, 1.2)
    const depth = inward ? rand(minEdge / 2 + .02, minEdge / 2 + .4) : rand(.1, .5)
    let path: T_PathPoint[]
    const shapeRoll = inward ? 0 : Math.random()
    if (shapeRoll < .5) {
        // П: прямоугольный выступ
        path = [{ x: -width / 2, z: 0 }, { x: -width / 2, z: depth }, { x: width / 2, z: depth }, { x: width / 2, z: 0 }]
    } else if (shapeRoll < .75) {
        // ступенчатый: широкий выступ у стены, на нём узкий; уступы — вогнутые изломы
        const backWidth = width + 2 * rand(minEdge, minEdge + .3)
        const backDepth = rand(Math.max(.1, minEdge / 2), .4)
        path = [
            { x: -backWidth / 2, z: 0 }, { x: -backWidth / 2, z: backDepth },
            { x: -width / 2, z: backDepth }, { x: -width / 2, z: backDepth + depth },
            { x: width / 2, z: backDepth + depth }, { x: width / 2, z: backDepth },
            { x: backWidth / 2, z: backDepth }, { x: backWidth / 2, z: 0 },
        ]
    } else {
        // трапеция: бока скошены, лицо уже, чем основание у стены
        const frontWidth = width * rand(.4, .85)
        path = [{ x: -width / 2, z: 0 }, { x: -frontWidth / 2, z: depth }, { x: frontWidth / 2, z: depth }, { x: width / 2, z: 0 }]
    }
    if (inward) path.reverse()

    return { path, height: rand(2, 5), ...profile }
}

export const pilaster00 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const { pos, path, height, aoLength, colorShaft, colorMolding } = o

    const builder = _GM.createGeomBuilder()
    const { collideQuad } = builder

    // ---- путь: без повторяющихся соседних точек; обход не меняется — он задаёт сторону профилей

    // точки пути в плане [x, z]
    const pathPoints: A2[] = []
    for (const { x, z } of path) {
        const last = pathPoints[pathPoints.length - 1]
        if (!last || Math.hypot(x - last[0], z - last[1]) > 1e-6) pathPoints.push([x, z])
    }
    if (pathPoints.length < 2 || height <= 0) return builder.g
    // направление стены у концов пути, единичное; нулевое — стена вдоль x
    const unitWall = ([x, z]: A2): A2 => {
        const length = Math.hypot(x, z)
        return length > 1e-6 ? [x / length, z / length] : [1, 0]
    }
    const startWall = unitWall(o.startWallDirection)
    const endWall = unitWall(o.endWallDirection)
    const pointCount = pathPoints.length
    const edgeCount = pointCount - 1

    // направление и нормаль каждого ребра в плане; нормаль — вправо от хода, (−dz, dx)
    const edgeDirections: A2[] = []
    const edgeNormals: A2[] = []
    for (let i = 0; i < edgeCount; ++i) {
        const dx = pathPoints[i + 1][0] - pathPoints[i][0]
        const dz = pathPoints[i + 1][1] - pathPoints[i][1]
        const length = Math.hypot(dx, dz)
        edgeDirections.push([dx / length, dz / length])
        edgeNormals.push([-dz / length, dx / length])
    }

    // Точка пути pointIndex, вынесенная наружу на distance. На изломе — по биссектрисе (ус), с такой длиной,
    // чтобы обе соседние грани отстояли от пути ровно на distance. На концах пути точка остаётся на линии стены:
    // ребро, подходящее к стене косо, срезается по стене
    const offsetPoint = (pointIndex: number, distance: number): A2 => {
        const [x, z] = pathPoints[pointIndex]
        if (pointIndex === 0 || pointIndex === pointCount - 1) {
            const isStart = pointIndex === 0
            const edge = isStart ? 0 : edgeCount - 1
            const [normalX, normalZ] = edgeNormals[edge]
            const [directionX, directionZ] = edgeDirections[edge]
            const [wallX, wallZ] = isStart ? startWall : endWall
            // сдвиг вдоль ребра, возвращающий вынесенную точку на линию стены: (нормаль·distance + ребро·t) ∥ стене
            const edgeAcrossWall = directionX * wallZ - directionZ * wallX
            const normalAcrossWall = normalX * wallZ - normalZ * wallX
            const alongEdge = Math.abs(edgeAcrossWall) > .1 ? -distance * normalAcrossWall / edgeAcrossWall : 0
            return [x + normalX * distance + directionX * alongEdge, z + normalZ * distance + directionZ * alongEdge]
        }
        const [normal1X, normal1Z] = edgeNormals[pointIndex - 1]
        const [normal2X, normal2Z] = edgeNormals[pointIndex]
        // знаменатель — 1 + cos угла между нормалями; ограничен, чтобы на очень остром изломе ус не улетал
        const miterScale = distance / Math.max(.2, 1 + normal1X * normal2X + normal1Z * normal2Z)
        return [x + (normal1X + normal2X) * miterScale, z + (normal1Z + normal2Z) * miterScale]
    }
    const worldAt = ([x, z]: A2, aboveGround: number): A3 => [pos[0] + x, pos[1] + aboveGround, pos[2] + z]

    // ---- профиль: точки (вынос, высота) снизу вверх

    // выносы убывают от плинта и абаки к стволу и не бывают отрицательными
    const plinthProjection = Math.max(0, o.plinthProjection)
    const baseSlopeProjection = Math.min(plinthProjection, Math.max(0, o.baseSlopeProjection))
    const baseFilletProjection = Math.min(baseSlopeProjection, Math.max(0, o.baseFilletProjection))
    const abacusProjection = Math.max(0, o.abacusProjection)
    const capitalSlopeProjection = Math.min(abacusProjection, Math.max(0, o.capitalSlopeProjection))
    const capitalFilletProjection = Math.min(capitalSlopeProjection, Math.max(0, o.capitalFilletProjection))
    // база и капитель вместе занимают не больше 80% высоты — ствол между ними остаётся всегда
    const heights = [
        o.plinthHeight, o.baseSlopeHeight, o.baseFilletHeight,
        o.abacusHeight, o.capitalSlopeHeight, o.capitalFilletHeight,
    ].map(value => Math.max(0, value))
    const heightScale = Math.min(1, height * .8 / Math.max(1e-6, heights.reduce((sum, value) => sum + value, 0)))
    const [plinthHeight, baseSlopeHeight, baseFilletHeight, abacusHeight, capitalSlopeHeight, capitalFilletHeight] =
        heights.map(value => value * heightScale)

    const baseTop = plinthHeight + baseSlopeHeight + baseFilletHeight
    const capitalBottom = height - abacusHeight - capitalSlopeHeight - capitalFilletHeight
    // цвет точки — у отрезка, который с неё начинается: ствол — colorShaft, остальное — colorMolding
    const profile: T_SweepProfilePoint[] = [
        { projection: plinthProjection, y: 0, color: colorMolding },
        { projection: plinthProjection, y: plinthHeight, color: colorMolding },
        { projection: baseSlopeProjection, y: plinthHeight, color: colorMolding },
        { projection: baseFilletProjection, y: plinthHeight + baseSlopeHeight, color: colorMolding },
        { projection: baseFilletProjection, y: baseTop, color: colorMolding },
        // ствол режется по высоте: тайл вытянут не больше чем вдвое относительно ширины грани
        { projection: 0, y: baseTop, color: colorShaft, uvRect: RECT_SANDSTONE, maxTileStretch: 2 },
        { projection: 0, y: capitalBottom, color: colorMolding },
        { projection: capitalFilletProjection, y: capitalBottom, color: colorMolding },
        { projection: capitalFilletProjection, y: capitalBottom + capitalFilletHeight, color: colorMolding },
        { projection: capitalSlopeProjection, y: height - abacusHeight, color: colorMolding },
        { projection: abacusProjection, y: height - abacusHeight, color: colorMolding },
        { projection: abacusProjection, y: height, color: colorMolding },
    ]

    // ---- грани: каждый отрезок профиля вдоль каждого ребра пути; низ плинта стоит на земле — с тенью

    _GM.sweepProfile(builder, {
        profile, edgeCount, edgeNormals, offsetPoint,
        origin: pos, aoLength, shadowAtStart: true,
        uvRect: RECT_LIMESTONE, aoRectNone: RECT_AO_NONE, aoRectShadow: RECT_AO_TOP,
    })

    // ---- верх абаки: вынесенный на abacusProjection путь, замкнутый по стене

    const topOutline: A2[] = []
    for (let i = 0; i < pointCount; ++i) topOutline.push(offsetPoint(i, abacusProjection))
    _GM.fillPlanPolygon(
        builder, topOutline, pos, height, true, RECT_LIMESTONE, _GM.rectPoint(RECT_AO_NONE, .5, .5), colorMolding,
    )

    // ---- прокси физики: призма по контуру плинта во всю высоту, без профилей и верха —
    // на пилястру не забираются, в неё упираются, а дальше всего у ног выступает плинт

    for (let edge = 0; edge < edgeCount; ++edge) {
        const start = offsetPoint(edge, plinthProjection)
        const end = offsetPoint(edge + 1, plinthProjection)
        collideQuad(worldAt(start, 0), worldAt(end, 0), worldAt(end, height), worldAt(start, height))
    }

    return builder.g
}
