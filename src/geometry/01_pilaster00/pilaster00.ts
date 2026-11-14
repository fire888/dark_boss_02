import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import { RECT_WHITE } from "atlases/atlas00/atlas00"
import { RECT_AO_NONE, RECT_AO_TOP } from "atlases/atlasAo00/atlasAo00"

// Пилястра: выступ из стены — ствол, внизу база, вверху капитель (см. ref.jpg).
//
// Путь. Ствол задаётся ломаной в плане: она выходит из стены, обходит пилястру и возвращается в стену
// (обычно П: от стены вперёд, вдоль, назад к стене). Путь — это лицо ствола; все профили базы и капители
// выстраиваются перед ним, наружу, на свой вынос от пути. Пространство между путём и стеной — тело ствола.
//
// Профиль — сечение пилястры поперёк пути, снизу вверх, точками (вынос от пути, высота):
//   база     — плинт (брусок у земли), над ним полка, скат внутрь, полочка, полка к стволу;
//   ствол    — вынос 0, по самому пути;
//   капитель — полочка, скат наружу, полка под абакой, абака (верхний брусок), её верх до стены.
// Каждый отрезок профиля протягивается вдоль каждого ребра пути — получается квад; на изломах пути
// профиль стыкуется усом (биссектрисой угла). Сечения у стены уходят в стену и не рисуются, низ у земли — тоже.
//
// Система координат. Стена — по линии z = const, на которой лежат концы пути (обычно z = 0 от pos);
// пилястра выступает в +z, к зрителю. Точки пути — { x, z } относительно pos, pos[1] — земля.
// Путь можно задавать в любую сторону: фабрика сама разворачивает его так, чтобы профили шли от стены.
//
// Атласы. uv — atlas00, белый тайл под цвет colorShaft / colorMolding, растянут на каждый отрезок профиля.
// uv2 — atlasAo00: тень во внутренних углах профиля (ствол над полкой базы и под полочкой капители,
// полки у ствола) и у земли (низ плинта). Тень одной длины aoLength по обе стороны угла: у длинной грани
// затеняется только полоса у угла, остальное — без тени.

type T_PathPoint = {
    x: number,
    z: number,
}

type T = {
    pos?: A3,            // начало координат пути; pos[1] — уровень земли
    path?: T_PathPoint[], // лицо ствола в плане: от стены, вокруг пилястры, обратно в стену
    height?: number,     // полная высота пилястры от земли до верха абаки
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

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // П: ствол 0.6 вдоль стены, выступ 0.2
    path: [{ x: -.3, z: 0 }, { x: -.3, z: .2 }, { x: .3, z: .2 }, { x: .3, z: 0 }],
    height: 3,
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

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)

    const plinthProjection = rand(.06, .16)
    const abacusProjection = rand(.06, .18)
    // Рёбра пути с внутренним (вогнутым) изломом при выносе укорачиваются на вынос с каждой вогнутой стороны,
    // поэтому они не короче minEdge — иначе профиль вывернется
    const minEdge = 2 * Math.max(plinthProjection, abacusProjection) + .05

    const width = rand(.3, 1.2)
    const depth = rand(.1, .5)
    let path: T_PathPoint[]
    const shapeRoll = Math.random()
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
    // иногда — путь в обратную сторону: фабрика обязана развернуть его сама
    if (Math.random() < .2) path.reverse()

    // приглушённый оттенок: серый яркости brightness, сдвинутый к случайному тону
    const tint = (brightnessMin: number, brightnessMax: number, saturationMax: number): A3 => {
        const brightness = rand(brightnessMin, brightnessMax)
        const saturation = rand(0, saturationMax)
        const hue = rand(0, Math.PI * 2)
        return [0, 1, 2].map(channel =>
            Math.min(1, Math.max(0, brightness + saturation * Math.cos(hue - channel * Math.PI * 2 / 3)))) as A3
    }

    // выносы убывают от плинта и абаки к стволу
    const baseSlopeProjection = plinthProjection * rand(.4, .9)
    const capitalSlopeProjection = abacusProjection * rand(.4, .9)
    return {
        path,
        height: rand(2, 5),
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

export const pilaster00 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const { pos, path, height, aoLength, colorShaft, colorMolding } = o

    const builder = _GM.createGeomBuilder()
    const { quad, tri, collideQuad } = builder

    const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
    const AO_UNSHADED_POINT = _GM.rectPoint(RECT_AO_NONE, .5, .5)

    // ---- путь: без повторяющихся соседних точек, обход такой, чтобы «наружу» было от стены

    // точки пути в плане [x, z]
    const pathPoints: A2[] = []
    for (const { x, z } of path) {
        const last = pathPoints[pathPoints.length - 1]
        if (!last || Math.hypot(x - last[0], z - last[1]) > 1e-6) pathPoints.push([x, z])
    }
    if (pathPoints.length < 2 || height <= 0) return builder.g
    // Путь, замкнутый стеной, обходит тело ствола. Нормаль ребра наружу берётся как (−dz, dx) — она смотрит
    // от тела, если площадь в осях [x, z] отрицательна; иначе путь разворачивается
    if (_GM.polygonArea2(pathPoints) > 0) pathPoints.reverse()
    const pointCount = pathPoints.length
    const edgeCount = pointCount - 1

    // направление и нормаль наружу каждого ребра в плане
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
            const edge = pointIndex === 0 ? 0 : edgeCount - 1
            const [normalX, normalZ] = edgeNormals[edge]
            const [directionX, directionZ] = edgeDirections[edge]
            // сдвиг вдоль ребра, возвращающий вынесенную точку на линию стены z = const
            const alongEdge = Math.abs(directionZ) > .1 ? -normalZ * distance / directionZ : 0
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
    // isShaft — точка, с которой начинается отрезок ствола (красится colorShaft)
    type T_ProfilePoint = { projection: number, y: number, isShaft?: boolean }
    const rawProfile: T_ProfilePoint[] = [
        { projection: plinthProjection, y: 0 },
        { projection: plinthProjection, y: plinthHeight },
        { projection: baseSlopeProjection, y: plinthHeight },
        { projection: baseFilletProjection, y: plinthHeight + baseSlopeHeight },
        { projection: baseFilletProjection, y: baseTop },
        { projection: 0, y: baseTop, isShaft: true },
        { projection: 0, y: capitalBottom },
        { projection: capitalFilletProjection, y: capitalBottom },
        { projection: capitalFilletProjection, y: capitalBottom + capitalFilletHeight },
        { projection: capitalSlopeProjection, y: height - abacusHeight },
        { projection: abacusProjection, y: height - abacusHeight },
        { projection: abacusProjection, y: height },
    ]
    // нулевые высоты и выносы дают совпадающие точки — отрезок нулевой длины выбрасывается
    const profile: T_ProfilePoint[] = []
    for (const point of rawProfile) {
        const last = profile[profile.length - 1]
        if (last && Math.hypot(point.projection - last.projection, point.y - last.y) < 1e-6) {
            last.isShaft = last.isShaft || point.isShaft
            continue
        }
        profile.push({ ...point })
    }
    const segmentCount = profile.length - 1

    // ---- тени профиля

    // Направление отрезка профиля в осях (вынос, высота), единичное
    const segmentDirection = (segment: number): A2 => {
        const dProjection = profile[segment + 1].projection - profile[segment].projection
        const dy = profile[segment + 1].y - profile[segment].y
        const length = Math.hypot(dProjection, dy)
        return [dProjection / length, dy / length]
    }
    // Внутренний угол профиля в точке pointIndex — между отрезками pointIndex − 1 и pointIndex.
    // Профиль идёт снизу вверх, тело — слева от него, поэтому поворот направо (векторное < 0) — вогнутый угол.
    // Тупые вогнутые углы (скат к полочке, 135°) почти не затенены — тень только у углов острее 120°.
    // Начало профиля стоит на земле — там тоже угол
    const isShadowCorner = (pointIndex: number): boolean => {
        if (pointIndex === 0) return true
        if (pointIndex >= segmentCount) return false
        const [ax, ay] = segmentDirection(pointIndex - 1)
        const [bx, by] = segmentDirection(pointIndex)
        return ax * by - ay * bx < 0 && ax * bx + ay * by < .5
    }

    // uv2 точки на расстоянии distance от затеняющего угла: тайл AO_TOP растянут на aoLength,
    // тень у его верхнего края (v = 1) — у самого угла
    const shadowUvAt = (distance: number): A2 => _GM.rectPoint(RECT_AO_TOP, .5, clamp01(1 - distance / aoLength))

    // ---- грани: каждый отрезок профиля вдоль каждого ребра пути

    for (let segment = 0; segment < segmentCount; ++segment) {
        const start = profile[segment]
        const end = profile[segment + 1]
        const length = Math.hypot(end.projection - start.projection, end.y - start.y)
        const [directionProjection, directionY] = segmentDirection(segment)
        // нормаль отрезка в осях (вынос, высота): направление, повёрнутое направо — от тела
        const normalProjection = directionY
        const normalY = -directionProjection
        const color = start.isShaft ? colorShaft : colorMolding

        // Отрезок режется на куски по длине: у затеняющего угла — полоса aoLength с тенью, середина — без.
        // Если отрезок короче двух полос, тени с обоих концов встречаются посередине
        const shadowAtStart = isShadowCorner(segment)
        const shadowAtEnd = isShadowCorner(segment + 1)
        const bandLength = shadowAtStart && shadowAtEnd ? Math.min(aoLength, length / 2) : Math.min(aoLength, length)
        // куски: доли отрезка [from, to] и тень у начала, у конца или нет
        type T_Piece = { from: number, to: number, shadow: 'start' | 'end' | 'none' }
        const pieces: T_Piece[] = []
        const bandFraction = bandLength / length
        const middleFrom = shadowAtStart ? bandFraction : 0
        const middleTo = shadowAtEnd ? 1 - bandFraction : 1
        if (shadowAtStart) pieces.push({ from: 0, to: bandFraction, shadow: 'start' })
        if (middleTo - middleFrom > 1e-6) pieces.push({ from: middleFrom, to: middleTo, shadow: 'none' })
        if (shadowAtEnd) pieces.push({ from: 1 - bandFraction, to: 1, shadow: 'end' })

        // uv2 на доле fraction отрезка в куске с тенью shadow
        const aoUvAt = (fraction: number, shadow: T_Piece['shadow']): A2 => {
            if (shadow === 'start') return shadowUvAt(fraction * length)
            if (shadow === 'end') return shadowUvAt((1 - fraction) * length)
            return AO_UNSHADED_POINT
        }
        // точка профиля на доле fraction
        const profileAt = (fraction: number) => ({
            projection: start.projection + (end.projection - start.projection) * fraction,
            y: start.y + (end.y - start.y) * fraction,
        })

        for (let edge = 0; edge < edgeCount; ++edge) {
            const [edgeNormalX, edgeNormalZ] = edgeNormals[edge]
            const outwardNormal: A3 = [edgeNormalX * normalProjection, normalY, edgeNormalZ * normalProjection]
            for (const { from, to, shadow } of pieces) {
                const bottom = profileAt(from)
                const top = profileAt(to)
                quad(
                    worldAt(offsetPoint(edge, bottom.projection), bottom.y),
                    worldAt(offsetPoint(edge + 1, bottom.projection), bottom.y),
                    worldAt(offsetPoint(edge + 1, top.projection), top.y),
                    worldAt(offsetPoint(edge, top.projection), top.y),
                    outwardNormal,
                    // тайл: вдоль ребра — горизонталь, вдоль отрезка профиля — вертикаль
                    [
                        ..._GM.rectPoint(RECT_WHITE, 0, from), ..._GM.rectPoint(RECT_WHITE, 1, from),
                        ..._GM.rectPoint(RECT_WHITE, 1, to), ..._GM.rectPoint(RECT_WHITE, 0, to),
                    ],
                    [...aoUvAt(from, shadow), ...aoUvAt(from, shadow), ...aoUvAt(to, shadow), ...aoUvAt(to, shadow)],
                    color,
                )
            }
        }
    }

    // ---- верх абаки: вынесенный на abacusProjection путь, замкнутый по стене

    {
        // в осях плана [x, −z] обход против часовой стрелки — положительная площадь, как ждёт триангуляция
        const topOutline: A2[] = []
        for (let i = 0; i < pointCount; ++i) {
            const [x, z] = offsetPoint(i, abacusProjection)
            topOutline.push([x, -z])
        }
        if (_GM.polygonArea2(topOutline) < 0) topOutline.reverse()
        let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity
        for (const [x, y] of topOutline) {
            xMin = Math.min(xMin, x); xMax = Math.max(xMax, x)
            yMin = Math.min(yMin, y); yMax = Math.max(yMax, y)
        }
        // тайл — плоская проекция верха целиком
        const topUvAt = ([x, y]: A2) => _GM.rectPoint(
            RECT_WHITE,
            clamp01((x - xMin) / Math.max(1e-6, xMax - xMin)),
            clamp01((y - yMin) / Math.max(1e-6, yMax - yMin)),
        )
        const topAt = ([x, y]: A2): A3 => [pos[0] + x, pos[1] + height, pos[2] - y]
        const triangles = _GM.triangulatePolygon(topOutline)
        for (let k = 0; k < triangles.length; k += 3) {
            const a = topOutline[triangles[k]], b = topOutline[triangles[k + 1]], c = topOutline[triangles[k + 2]]
            tri(
                topAt(a), topAt(b), topAt(c), [0, 1, 0],
                [...topUvAt(a), ...topUvAt(b), ...topUvAt(c)],
                [...AO_UNSHADED_POINT, ...AO_UNSHADED_POINT, ...AO_UNSHADED_POINT],
                colorMolding,
            )
        }
    }

    // ---- прокси физики: призма по контуру плинта во всю высоту, без профилей и верха —
    // на пилястру не забираются, в неё упираются, а дальше всего у ног выступает плинт

    for (let edge = 0; edge < edgeCount; ++edge) {
        const start = offsetPoint(edge, plinthProjection)
        const end = offsetPoint(edge + 1, plinthProjection)
        collideQuad(worldAt(start, 0), worldAt(end, 0), worldAt(end, height), worldAt(start, height))
    }

    return builder.g
}
