import { _GM, type IBuffersGeom, type A2, type A3, type F_Nrm } from "_CORE/_M/_gm"
import {
    RECT_EARTH, RECT_ORNAMENT,
    UV_WHITE_Q, UV_MOSS_Q, UV_SLAB_Q,
} from "atlases/atlas00/atlas00"
import {
    RECT_AO_NONE, RECT_AO_TOP,
    UV_AO_NONE_Q, UV_AO_TOP_Q,
} from "atlases/atlasAo00/atlasAo00"

// Крыльцо с винтовыми маршами: площадка-полукруг (барабан) у стены здания, вокруг неё по дуге —
// два марша, справа и слева. Марш начинается у здания площадкой-«посадкой» на уровне площадки
// и спускается по дуге к зрителю, до земли. Снаружи марш ограждён стенкой одной высоты по всей
// длине — на parapetHeight выше площадки; без неё (hasWall = false) у марша открыта ступенчатая боковина,
// посадка доходит до наружного края марша и обрывается. Между низами маршей впереди открыт торец барабана.
// По краю площадки — полоса плитки: вдоль стенки над посадкой, поперёк у верхней ступени (щека)
// и вдоль торца барабана над маршами и впереди.
//
// Система координат. Здание — по линии z = pos[2], дуга выпирает в +z, к зрителю.
// Точка задаётся углом и радиусом от центра дуги: pos + [cos(angle) * radius, height, sin(angle) * radius];
// угол 0 — справа (+x), PI / 2 — на зрителя (+z), PI — слева (−x).
// Марш описывается своей угловой координатой stairAngle: 0 у здания, растёт к зрителю. Правый марш
// стоит на angle = stairAngle, левый — зеркально, на angle = PI − stairAngle.
//
// Атласы. uv — атлас цвета atlas00, uv2 — атлас затенения atlasAo00 (aoMap, channel = 2).
// aoMap затеняет внутренние углы (низ барабана и стенки над проступью, проступь у следующего
// подступенка, посадка у стенки) и низ, который примыкает к земле.
//
// Термины. Подступенок (riser) — вертикальная грань ступени, проступь (tread) — горизонтальная.
// Марш — лестница от посадки до земли. Барабан — тело площадки, его торец по радиусу platformRadius.

type T = {
    pos?: A3,                // центр дуги на уровне земли
    platformRadius?: number, // радиус площадки-барабана
    stairWidth?: number,     // ширина марша по радиусу, от барабана до стенки
    wallThickness?: number,  // толщина наружной стенки
    platformHeight?: number, // высота площадки над землёй
    parapetHeight?: number,  // высота стенки над площадкой
    hasWall?: boolean,       // наружная стенка-бортик; без неё у марша открыта боковина
    // желаемые высота и глубина ступени (глубина — по среднему радиусу марша); высота подгоняется так,
    // чтобы целое число ступеней дало ровно platformHeight, глубина сжимается, если марш не влезает в дугу
    stepHeight?: number,
    stepDepth?: number,
    frontGap?: number,       // расстояние по дуге наружного радиуса между низами двух маршей
    tileSize?: number,       // ширина полосы плитки по краю площадки, она же сторона одной плитки
    arcSegmentLength?: number,        // длина сегмента, на которые режется дуга видимой геометрии
    collideArcSegmentLength?: number, // то же для прокси физики, грубее
    // базовые цвета до запечённого освещения; умножаются на тайл атласа
    colorWall?: A3,          // стенка, торец барабана
    colorRiser?: A3,         // подступенки
    colorTop?: A3,           // площадка, посадки, проступи
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    platformRadius: 4,
    stairWidth: 3.2,
    wallThickness: .35,
    platformHeight: 2.6,
    parapetHeight: .9,
    hasWall: true,
    stepHeight: .18,
    stepDepth: .32,
    frontGap: 2.5,
    tileSize: .5,
    arcSegmentLength: .5,
    collideArcSegmentLength: 2,
    colorWall: [.64, .67, .7],
    colorRiser: [1, 1, 1],
    colorTop: [1, 1, 1],
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    const platformRadius = rand(2.5, 6)
    const stairWidth = rand(2.4, 4)
    const wallThickness = rand(.25, .5)
    // высота ограничена длиной четверти дуги по середине марша: выше — ступени сожмутся в щель
    const quarterArcLength = Math.PI / 2 * (platformRadius + stairWidth / 2)
    // приглушённый оттенок: серый яркости brightness, сдвинутый к случайному тону hue
    // на величину до saturationMax
    const tint = (brightnessMin: number, brightnessMax: number, saturationMax: number): A3 => {
        const brightness = rand(brightnessMin, brightnessMax)
        const saturation = rand(0, saturationMax)
        const hue = rand(0, Math.PI * 2)
        return [0, 1, 2].map(channel =>
            Math.min(1, Math.max(0, brightness + saturation * Math.cos(hue - channel * Math.PI * 2 / 3)))) as A3
    }
    return {
        platformRadius,
        stairWidth,
        wallThickness,
        platformHeight: rand(.8, Math.min(3, quarterArcLength * .4)),
        parapetHeight: rand(.6, 1.2),
        hasWall: Math.random() < .7,
        stepHeight: rand(.15, .22),
        stepDepth: rand(.28, .4),
        // между низами маршей — не меньше 1.2
        frontGap: rand(1.2, Math.max(1.2, (platformRadius + stairWidth + wallThickness) * .5)),
        tileSize: rand(.35, .7),
        arcSegmentLength: rand(.3, 1),
        colorWall: tint(.5, .8, .12),
        colorRiser: tint(.75, .95, .15),
        colorTop: tint(.75, .95, .15),
    }
}

export const stairs01 = (opts: T = {}): IBuffersGeom => {
    const {
        pos, platformRadius, stairWidth, wallThickness, platformHeight, parapetHeight, hasWall, stepHeight, stepDepth,
        frontGap, tileSize, arcSegmentLength, collideArcSegmentLength, colorWall, colorRiser, colorTop,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const builder = _GM.createGeomBuilder()
    const { quad, tri, collideQuad, collideTri } = builder

    // ---- радиусы и размеры ступеней

    const innerWallRadius = platformRadius + stairWidth
    const outerRadius = innerWallRadius + wallThickness
    const middleRadius = platformRadius + stairWidth / 2
    // верх стенки над землёй — один по всей длине марша
    const wallTopHeight = platformHeight + parapetHeight

    // ступеней не меньше двух: одна посадка и хотя бы одна проступь
    const stepCount = Math.max(2, Math.round(platformHeight / stepHeight))
    // настоящая высота подступенка: целое число ступеней даёт ровно высоту площадки
    const riserHeight = platformHeight / stepCount
    // верхняя ступень — посадка на уровне площадки, поэтому проступей на одну меньше
    const treadCount = stepCount - 1

    // угол низа марша; не меньше 0.3 рад, чтобы марш было куда положить
    const endAngle = Math.max(.3, Math.PI / 2 - frontGap / (2 * outerRadius))
    // Проступи берут желаемую глубину, но не больше доступного угла: марш оставляет посадке хотя бы
    // квадрат stairWidth × stairWidth или, если и так тесно, половину дуги. Остаток дуги — посадка
    const minLandingAngle = stairWidth / middleRadius
    const stairAngleMax = Math.max(endAngle * .5, endAngle - minLandingAngle)
    const treadAngle = Math.min(stepDepth / middleRadius, stairAngleMax / treadCount)
    const landingAngle = endAngle - treadCount * treadAngle
    // угол подступенка step: 0 — край посадки, treadCount — низ марша у земли
    const riserAngleAt = (step: number) => landingAngle + step * treadAngle
    // высота проступи step: 0 — первая под посадкой
    const treadHeightAt = (step: number) => platformHeight - (step + 1) * riserHeight
    // высота пола у стенки над сегментом с серединой stairAngle: посадка или проступь, в которую он попал
    const floorHeightAt = (stairAngle: number) => {
        if (stairAngle < landingAngle) return platformHeight
        const step = Math.min(treadCount - 1, Math.floor((stairAngle - landingAngle) / treadAngle))
        return treadHeightAt(step)
    }

    // ---- тайлы

    const AO_SHADOW_AT_TOP = UV_AO_TOP_Q
    const AO_SHADOW_AT_BOTTOM = _GM.flipUvQ(UV_AO_TOP_Q)
    // плита проступи перевёрнута: светлая фаска тайла ложится на передний край ступени
    const UV_SLAB_TREAD = _GM.flipUvQ(UV_SLAB_Q)
    // uv2 точки без тени — середина пустого тайла AO
    const AO_UNSHADED_POINT = _GM.rectPoint(RECT_AO_NONE, .5, .5)

    // ---- точки и нормали

    const pointAt = (angle: number, distance: number, height: number): A3 => [
        pos[0] + Math.cos(angle) * distance,
        pos[1] + height,
        pos[2] + Math.sin(angle) * distance,
    ]
    // side: 1 — правый марш, −1 — левый, зеркальный
    const stairPointAt = (side: number, stairAngle: number, distance: number, height: number): A3 =>
        pointAt(side === 1 ? stairAngle : Math.PI - stairAngle, distance, height)
    // направление роста stairAngle (вниз по маршу) и радиальное направление наружу
    const stairTangentAt = (side: number, stairAngle: number): A3 => [-side * Math.sin(stairAngle), 0, Math.cos(stairAngle)]
    const stairRadialAt = (side: number, stairAngle: number): A3 => [side * Math.cos(stairAngle), 0, Math.sin(stairAngle)]
    const negate = (vector: A3): A3 => [-vector[0], -vector[1], -vector[2]]
    const UP: A3 = [0, 1, 0]

    // нормаль цилиндрической грани в самой вершине: изгиб виден без источника света
    const normalOutward: F_Nrm = point => {
        const dx = point[0] - pos[0]
        const dz = point[2] - pos[2]
        const length = Math.hypot(dx, dz) || 1
        return [dx / length, 0, dz / length]
    }
    const normalInward: F_Nrm = point => negate(normalOutward(point))

    const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
    // uv площадки и посадок — плоская проекция всего крыльца на один тайл земли
    const platformUvAt = (angle: number, distance: number): A2 => {
        const point = pointAt(angle, distance, platformHeight)
        return _GM.rectPoint(
            RECT_EARTH,
            clamp01((point[0] - pos[0] + outerRadius) / (2 * outerRadius)),
            clamp01((point[2] - pos[2]) / outerRadius),
        )
    }

    // Делит интервал углов на равные сегменты не длиннее segmentLength по дуге наружного радиуса;
    // возвращает границы сегментов, включая оба конца
    const splitArc = (angleFrom: number, angleTo: number, segmentLength: number): number[] => {
        const segmentCount = Math.max(1, Math.ceil((angleTo - angleFrom) * outerRadius / segmentLength))
        const borders: number[] = []
        for (let i = 0; i <= segmentCount; ++i) borders.push(angleFrom + (angleTo - angleFrom) * i / segmentCount)
        return borders
    }

    // ---- площадка: веер земли из центра, по краю — полоса плитки шириной bandWidth.
    // Над посадкой полоса идёт вдоль стенки, у верхней ступени поворачивает щекой поперёк посадки
    // и дальше идёт вдоль торца барабана. На посадку от стенки ложится тень шириной parapetHeight —
    // как на стенке высотой parapetHeight над ней, поэтому полосы тени по обе стороны угла одной ширины

    const platformCenter: A3 = pointAt(0, 0, platformHeight)
    const bandWidth = Math.min(tileSize, platformRadius / 2)
    // внутренний край полосы вдоль торца барабана; щека начинается от него
    const drumBandInnerRadius = platformRadius - bandWidth
    // доля тени от стенки на расстоянии distance от центра: 1 у стенки, 0 дальше parapetHeight от неё;
    // без стенки угла нет и тени тоже
    const wallShadowAt = (distance: number) =>
        hasWall ? Math.max(0, 1 - (innerWallRadius - distance) / parapetHeight) : 0
    // радиус, где кончается тень, — граница колец, чтобы тень внутри кольца менялась линейно
    const shadowBorders = hasWall && innerWallRadius - parapetHeight > 0 ? [innerWallRadius - parapetHeight] : []

    // Ячейка площадки — кольцевой сектор [angleFrom, angleTo] × [radiusFrom, radiusTo] (в настоящих углах);
    // при radiusFrom = 0 — треугольник веера. uvAt задаёт тайл цвета: земля или плитка.
    // isNearWall — ячейка над посадкой и может попасть в тень стенки
    const platformCell = (
        angleFrom: number, angleTo: number, radiusFrom: number, radiusTo: number,
        isNearWall: boolean, uvAt: (angle: number, distance: number) => A2,
    ) => {
        const hasShadow = isNearWall && wallShadowAt(radiusTo) > 0
        const aoUvAt = (distance: number) =>
            hasShadow ? _GM.rectPoint(RECT_AO_TOP, .5, wallShadowAt(distance)) : AO_UNSHADED_POINT
        if (radiusFrom <= 0) {
            tri(
                platformCenter, pointAt(angleFrom, radiusTo, platformHeight), pointAt(angleTo, radiusTo, platformHeight),
                UP,
                [...uvAt(angleFrom, 0), ...uvAt(angleFrom, radiusTo), ...uvAt(angleTo, radiusTo)],
                [...aoUvAt(0), ...aoUvAt(radiusTo), ...aoUvAt(radiusTo)],
                colorTop,
            )
            return
        }
        quad(
            pointAt(angleFrom, radiusFrom, platformHeight), pointAt(angleTo, radiusFrom, platformHeight),
            pointAt(angleTo, radiusTo, platformHeight), pointAt(angleFrom, radiusTo, platformHeight),
            UP,
            [...uvAt(angleFrom, radiusFrom), ...uvAt(angleTo, radiusFrom), ...uvAt(angleTo, radiusTo), ...uvAt(angleFrom, radiusTo)],
            [...aoUvAt(radiusFrom), ...aoUvAt(radiusFrom), ...aoUvAt(radiusTo), ...aoUvAt(radiusTo)],
            colorTop,
        )
    }
    // Границы колец от центра (0) до radiusEnd: сам 0, radiusEnd и попавшие между ними cuts,
    // по возрастанию и без совпадающих
    const ringBorders = (radiusEnd: number, cuts: number[]): number[] => {
        const borders = [0, ...cuts.filter(cut => cut > 1e-4 && cut < radiusEnd - 1e-4), radiusEnd].sort((a, b) => a - b)
        return borders.filter((border, i) => i === 0 || border - borders[i - 1] > 1e-4)
    }

    // Кусок площадки над дугой [angleFrom, angleTo] до радиуса radiusEnd: веер земли,
    // у края — полоса плиток вдоль дуги. Плиток целое число, каждая режется ещё на сегменты по arcSegmentLength
    const arcPiece = (angleFrom: number, angleTo: number, radiusEnd: number, isNearWall: boolean) => {
        const bandStartRadius = radiusEnd - bandWidth
        const tileCount = Math.max(1, Math.round((angleTo - angleFrom) * (radiusEnd - bandWidth / 2) / bandWidth))
        const tileAngle = (angleTo - angleFrom) / tileCount
        const segmentsPerTile = Math.max(1, Math.ceil(tileAngle * radiusEnd / arcSegmentLength))
        const borders = ringBorders(radiusEnd, isNearWall ? [bandStartRadius, ...shadowBorders] : [bandStartRadius])
        for (let tileIndex = 0; tileIndex < tileCount; ++tileIndex) {
            const tileAngleStart = angleFrom + tileIndex * tileAngle
            // плитка: вдоль дуги — по горизонтали тайла, по радиусу — по вертикали
            const ornamentUvAt = (angle: number, distance: number) => _GM.rectPoint(
                RECT_ORNAMENT,
                clamp01((angle - tileAngleStart) / tileAngle),
                clamp01((distance - bandStartRadius) / bandWidth),
            )
            for (let segmentIndex = 0; segmentIndex < segmentsPerTile; ++segmentIndex) {
                const segmentFrom = tileAngleStart + tileAngle * segmentIndex / segmentsPerTile
                const segmentTo = tileAngleStart + tileAngle * (segmentIndex + 1) / segmentsPerTile
                for (let ring = 0; ring < borders.length - 1; ++ring) {
                    const isInBand = borders[ring] >= bandStartRadius - 1e-4
                    platformCell(
                        segmentFrom, segmentTo, borders[ring], borders[ring + 1], isNearWall,
                        isInBand ? ornamentUvAt : platformUvAt,
                    )
                }
            }
        }
    }

    // Щека у верхней ступени: сектор [angleFrom, angleTo] — веер земли до drumBandInnerRadius,
    // дальше плитки по радиусу до стенки
    const cheekBandPiece = (angleFrom: number, angleTo: number) => {
        const tileCount = Math.max(1, Math.round((innerWallRadius - drumBandInnerRadius) / bandWidth))
        const tileRadialSize = (innerWallRadius - drumBandInnerRadius) / tileCount
        const cuts = [drumBandInnerRadius, ...shadowBorders]
        for (let tileIndex = 1; tileIndex < tileCount; ++tileIndex) cuts.push(drumBandInnerRadius + tileIndex * tileRadialSize)
        const borders = ringBorders(innerWallRadius, cuts)
        for (let ring = 0; ring < borders.length - 1; ++ring) {
            const radiusFrom = borders[ring]
            const radiusTo = borders[ring + 1]
            if (radiusFrom < drumBandInnerRadius - 1e-4) {
                platformCell(angleFrom, angleTo, radiusFrom, radiusTo, true, platformUvAt)
                continue
            }
            // начало плитки, в которую попало кольцо; плитка повёрнута: по радиусу — горизонталь тайла
            const tileIndex = Math.min(tileCount - 1, Math.floor(((radiusFrom + radiusTo) / 2 - drumBandInnerRadius) / tileRadialSize))
            const tileRadiusStart = drumBandInnerRadius + tileIndex * tileRadialSize
            platformCell(angleFrom, angleTo, radiusFrom, radiusTo, true, (angle, distance) => _GM.rectPoint(
                RECT_ORNAMENT,
                clamp01((distance - tileRadiusStart) / tileRadialSize),
                clamp01((angle - angleFrom) / (angleTo - angleFrom)),
            ))
        }
    }

    // cheekAngle — угол, который занимает щека шириной bandWidth на среднем радиусе полосы;
    // не больше посадки — тогда вдоль стенки полосы нет, только щека
    const cheekAngle = Math.min(landingAngle, bandWidth / ((drumBandInnerRadius + innerWallRadius) / 2))
    const wallArcTo = landingAngle - cheekAngle
    // правая посадка: вдоль стенки от здания, потом щека
    if (wallArcTo > 1e-4) arcPiece(0, wallArcTo, innerWallRadius, true)
    cheekBandPiece(wallArcTo, landingAngle)
    // середина — вдоль торца барабана
    arcPiece(landingAngle, Math.PI - landingAngle, platformRadius, false)
    // левая посадка — зеркально
    cheekBandPiece(Math.PI - landingAngle, Math.PI - wallArcTo)
    if (wallArcTo > 1e-4) arcPiece(Math.PI - wallArcTo, Math.PI, innerWallRadius, true)

    // торец барабана впереди, между низами маршей: во всю высоту, тень внизу — у земли
    if (endAngle < Math.PI / 2) {
        const borders = splitArc(endAngle, Math.PI - endAngle, arcSegmentLength)
        for (let k = 0; k < borders.length - 1; ++k) {
            const segmentMiddle = (borders[k] + borders[k + 1]) / 2
            quad(
                pointAt(borders[k], platformRadius, 0), pointAt(borders[k + 1], platformRadius, 0),
                pointAt(borders[k + 1], platformRadius, platformHeight), pointAt(borders[k], platformRadius, platformHeight),
                [Math.cos(segmentMiddle), 0, Math.sin(segmentMiddle)], UV_WHITE_Q, AO_SHADOW_AT_BOTTOM, colorWall, normalOutward,
            )
        }
    }

    // ---- марши

    // границы сегментов стенки: посадка и каждая проступь режутся отдельно, чтобы ступени пола
    // у внутренней стороны стенки пришлись на границы
    const wallBorders: number[] = splitArc(0, landingAngle, arcSegmentLength)
    for (let step = 0; step < treadCount; ++step) {
        wallBorders.push(...splitArc(riserAngleAt(step), riserAngleAt(step + 1), arcSegmentLength).slice(1))
    }

    for (const side of [1, -1]) {
        const pointOf = (stairAngle: number, distance: number, height: number) => stairPointAt(side, stairAngle, distance, height)

        for (let step = 0; step <= treadCount; ++step) {
            const riserAngle = riserAngleAt(step)
            // подступенок смотрит вниз по маршу; тень внизу — угол с проступью ниже, у нижнего — земля
            const riserTop = platformHeight - step * riserHeight
            quad(
                pointOf(riserAngle, platformRadius, riserTop - riserHeight), pointOf(riserAngle, innerWallRadius, riserTop - riserHeight),
                pointOf(riserAngle, innerWallRadius, riserTop), pointOf(riserAngle, platformRadius, riserTop),
                stairTangentAt(side, riserAngle), UV_MOSS_Q, AO_SHADOW_AT_BOTTOM, colorRiser,
            )
            if (step === treadCount) continue

            // Проступь. Первые две вершины — передний край, вторые две — у подступенка выше, там тень
            const nextRiserAngle = riserAngleAt(step + 1)
            const treadHeight = treadHeightAt(step)
            quad(
                pointOf(nextRiserAngle, platformRadius, treadHeight), pointOf(nextRiserAngle, innerWallRadius, treadHeight),
                pointOf(riserAngle, innerWallRadius, treadHeight), pointOf(riserAngle, platformRadius, treadHeight),
                UP, UV_SLAB_TREAD, AO_SHADOW_AT_TOP, colorTop,
            )
            // торец барабана над проступью; тень внизу — угол с проступью
            const borders = splitArc(riserAngle, nextRiserAngle, arcSegmentLength)
            for (let k = 0; k < borders.length - 1; ++k) {
                const segmentMiddle = (borders[k] + borders[k + 1]) / 2
                quad(
                    pointOf(borders[k], platformRadius, treadHeight), pointOf(borders[k + 1], platformRadius, treadHeight),
                    pointOf(borders[k + 1], platformRadius, platformHeight), pointOf(borders[k], platformRadius, platformHeight),
                    stairRadialAt(side, segmentMiddle), UV_WHITE_Q, AO_SHADOW_AT_BOTTOM, colorWall, normalOutward,
                )
            }
        }

        // стенка: наружная сторона от земли, внутренняя — от пола марша, и верх.
        // Без стенки на её месте — боковина марша: ступенчатый профиль от земли до посадки и проступей
        for (let k = 0; k < wallBorders.length - 1; ++k) {
            const segmentFrom = wallBorders[k]
            const segmentTo = wallBorders[k + 1]
            const segmentMiddle = (segmentFrom + segmentTo) / 2
            const floorHeight = floorHeightAt(segmentMiddle)
            if (!hasWall) {
                // тень внизу — низ у земли
                quad(
                    pointOf(segmentFrom, innerWallRadius, 0), pointOf(segmentTo, innerWallRadius, 0),
                    pointOf(segmentTo, innerWallRadius, floorHeight), pointOf(segmentFrom, innerWallRadius, floorHeight),
                    stairRadialAt(side, segmentMiddle), UV_WHITE_Q, AO_SHADOW_AT_BOTTOM, colorWall, normalOutward,
                )
                continue
            }
            // тень внизу: снаружи — низ у земли
            quad(
                pointOf(segmentFrom, outerRadius, 0), pointOf(segmentTo, outerRadius, 0),
                pointOf(segmentTo, outerRadius, wallTopHeight), pointOf(segmentFrom, outerRadius, wallTopHeight),
                stairRadialAt(side, segmentMiddle), UV_WHITE_Q, AO_SHADOW_AT_BOTTOM, colorWall, normalOutward,
            )
            // изнутри — угол с посадкой или проступью
            quad(
                pointOf(segmentFrom, innerWallRadius, floorHeight), pointOf(segmentTo, innerWallRadius, floorHeight),
                pointOf(segmentTo, innerWallRadius, wallTopHeight), pointOf(segmentFrom, innerWallRadius, wallTopHeight),
                negate(stairRadialAt(side, segmentMiddle)), UV_WHITE_Q, AO_SHADOW_AT_BOTTOM, colorWall, normalInward,
            )
            quad(
                pointOf(segmentFrom, innerWallRadius, wallTopHeight), pointOf(segmentTo, innerWallRadius, wallTopHeight),
                pointOf(segmentTo, outerRadius, wallTopHeight), pointOf(segmentFrom, outerRadius, wallTopHeight),
                UP, UV_WHITE_Q, UV_AO_NONE_Q, colorWall,
            )
        }
        // торец стенки у низа марша; у здания торец смотрит в стену и не рисуется
        if (hasWall) quad(
            pointOf(endAngle, innerWallRadius, 0), pointOf(endAngle, outerRadius, 0),
            pointOf(endAngle, outerRadius, wallTopHeight), pointOf(endAngle, innerWallRadius, wallTopHeight),
            stairTangentAt(side, endAngle), UV_WHITE_Q, AO_SHADOW_AT_BOTTOM, colorWall,
        )
    }

    // ---- прокси физики: веер площадки с посадками, пандус на месте каждого марша, стенки,
    // торец барабана над пандусом и впереди

    {
        const borders = splitArc(landingAngle, Math.PI - landingAngle, collideArcSegmentLength)
        for (let k = 0; k < borders.length - 1; ++k) {
            collideTri(platformCenter, pointAt(borders[k], platformRadius, platformHeight), pointAt(borders[k + 1], platformRadius, platformHeight))
        }
        if (endAngle < Math.PI / 2) {
            const frontBorders = splitArc(endAngle, Math.PI - endAngle, collideArcSegmentLength)
            for (let k = 0; k < frontBorders.length - 1; ++k) {
                collideQuad(
                    pointAt(frontBorders[k], platformRadius, 0), pointAt(frontBorders[k + 1], platformRadius, 0),
                    pointAt(frontBorders[k + 1], platformRadius, platformHeight), pointAt(frontBorders[k], platformRadius, platformHeight),
                )
            }
        }
    }
    // пандус: от площадки у края посадки линейно до земли у низа марша
    const rampHeightAt = (stairAngle: number) =>
        stairAngle <= landingAngle ? platformHeight : platformHeight * (endAngle - stairAngle) / (endAngle - landingAngle)
    for (const side of [1, -1]) {
        const pointOf = (stairAngle: number, distance: number, height: number) => stairPointAt(side, stairAngle, distance, height)
        const borders = [
            ...splitArc(0, landingAngle, collideArcSegmentLength),
            ...splitArc(landingAngle, endAngle, collideArcSegmentLength).slice(1),
        ]
        for (let k = 0; k < borders.length - 1; ++k) {
            const segmentFrom = borders[k]
            const segmentTo = borders[k + 1]
            const heightFrom = rampHeightAt(segmentFrom)
            const heightTo = rampHeightAt(segmentTo)
            // посадка — веер до стенки, спуск — пандус между барабаном и стенкой
            if (segmentTo <= landingAngle + 1e-6) {
                collideTri(platformCenter, pointOf(segmentFrom, innerWallRadius, platformHeight), pointOf(segmentTo, innerWallRadius, platformHeight))
            } else {
                collideQuad(
                    pointOf(segmentFrom, platformRadius, heightFrom), pointOf(segmentFrom, innerWallRadius, heightFrom),
                    pointOf(segmentTo, innerWallRadius, heightTo), pointOf(segmentTo, platformRadius, heightTo),
                )
                collideQuad(
                    pointOf(segmentFrom, platformRadius, heightFrom), pointOf(segmentTo, platformRadius, heightTo),
                    pointOf(segmentTo, platformRadius, platformHeight), pointOf(segmentFrom, platformRadius, platformHeight),
                )
            }
            if (!hasWall) {
                // без стенки — боковина пандуса от земли
                collideQuad(
                    pointOf(segmentFrom, innerWallRadius, 0), pointOf(segmentTo, innerWallRadius, 0),
                    pointOf(segmentTo, innerWallRadius, heightTo), pointOf(segmentFrom, innerWallRadius, heightFrom),
                )
                continue
            }
            collideQuad(
                pointOf(segmentFrom, outerRadius, 0), pointOf(segmentTo, outerRadius, 0),
                pointOf(segmentTo, outerRadius, wallTopHeight), pointOf(segmentFrom, outerRadius, wallTopHeight),
            )
            collideQuad(
                pointOf(segmentFrom, innerWallRadius, 0), pointOf(segmentTo, innerWallRadius, 0),
                pointOf(segmentTo, innerWallRadius, wallTopHeight), pointOf(segmentFrom, innerWallRadius, wallTopHeight),
            )
        }
    }

    return builder.g
}
