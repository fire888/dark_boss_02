import { _GM, type IBuffersGeom, type A2, type A3, type F_Nrm } from "_CORE/_M/_gm"
import {
    RECT_EARTH, RECT_ORNAMENT,
    UV_WHITE_Q, UV_MOSS_Q, UV_SLAB_Q,
} from "atlases/atlas00/atlas00"
import {
    RECT_AO_NONE, RECT_AO_TOP,
    UV_AO_NONE_Q, UV_AO_TOP_Q,
} from "atlases/atlasAo00/atlasAo00"

// Полукруглое крыльцо: площадка-сектор у стены здания, по дуге — подпорная
// стенка, поднятая над площадкой парапетом. В разрывах дуги — лестницы, врезанные
// в площадку: ступени — кольцевые секторы, поднимаются от внешнего радиуса к центру.
// По краю площадки — полоса плитки вдоль парапета, щёк лестниц и верхних ступеней.
// Без бортика (hasWall = false) площадка доходит до radius, кончается полосой плитки и сразу обрывается.
//
// Система координат. Здание — по линии z = pos[2], дуга выпирает в +z, к зрителю.
// Точка задаётся углом и радиусом от центра дуги: pos + [cos(angle) * radius, height, sin(angle) * radius];
// угол 0 — справа (+x), PI / 2 — на зрителя (+z), PI — слева (−x).
//
// Атласы. uv — атлас цвета atlas00, uv2 — атлас затенения atlasAo00 (aoMap, channel = 2).
// aoMap затеняет внутренние углы (низ внутренней стенки и подступенков над проступью,
// проступь у следующего подступенка, площадка у парапета) и низ геометрии, который будет
// примыкать к земле (низ наружной стенки, торцов, нижнего подступенка);
// цвет вершин несёт только направленный свет.
//
// Термины. Подступенок (riser) — вертикальная грань ступени, проступь (tread) — горизонтальная,
// на неё наступают. Пролёт — проём в стенке, где стоит лестница. Щека — торец стенки у пролёта.

type T_Stair = {
    // угол центра пролёта
    angle: number,
    // ширина пролёта, измеренная по дуге внешнего радиуса
    width: number,
}

type T = {
    pos?: A3,                // центр дуги на уровне земли
    radius?: number,         // внешний радиус стенки; без бортика — радиус края площадки
    wallThickness?: number,  // толщина стенки
    platformHeight?: number, // высота площадки над землёй
    parapetHeight?: number,  // высота парапета над площадкой
    hasWall?: boolean,       // подпорная стенка с парапетом; без неё площадка обрывается краем
    // желаемые высота и глубина ступени; высота подгоняется так, чтобы целое число ступеней
    // дало ровно platformHeight
    stepHeight?: number,
    stepDepth?: number,
    stairs?: T_Stair[],
    tileSize?: number,       // ширина полосы плитки по краю площадки, она же сторона одной плитки
    arcSegmentLength?: number,        // длина сегмента, на которые режется дуга видимой геометрии
    collideArcSegmentLength?: number, // то же для прокси физики, грубее
    // базовые цвета до запечённого освещения; умножаются на тайл атласа
    colorWall?: A3,          // стенка и щёки
    colorRiser?: A3,         // подступенки
    colorTop?: A3,           // площадка и проступи
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    radius: 6,
    wallThickness: .4,
    platformHeight: 1.2,
    parapetHeight: 1,
    hasWall: true,
    stepHeight: .2,
    stepDepth: .35,
    stairs: [
        { angle: Math.PI * .25, width: 3 },
        { angle: Math.PI * .75, width: 3 },
    ],
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
    const radius = rand(3, 10)
    const stairs: T_Stair[] = []
    // случайный разворот лестниц от направления «на зрителя» (+z): не больше 0.5 рад
    // и не больше maxTurn — запаса, после которого крайний пролёт упрётся в здание
    const turnAngle = (maxTurn: number) => rand(-1, 1) * Math.min(.5, Math.max(0, maxTurn))
    if (radius < 4 || Math.random() < .35) {
        // малое крыльцо — одна широкая лестница, примерно на зрителя; у здания остаётся стенка 0.5
        const width = radius * rand(.9, 1.2)
        stairs.push({ angle: Math.PI / 2 + turnAngle(Math.PI / 2 - width / radius / 2 - .5 / radius), width })
    } else if (radius >= 5 && Math.random() < .5) {
        // самое большое — три лестницы: на зрителя и две по бокам, тройка развёрнута целиком.
        // Боковые своей ширины и на своём удалении sideOffsetAngle от центральной; центральная сужается так,
        // чтобы до боковых оставалась стенка не меньше 1.
        // Стенка у здания может быть узкой, но боковая в здание не заходит
        const sideOffsetAngle = Math.PI * rand(.28, .4)
        const sideWidth = Math.min(radius * rand(.35, .7), 2 * (Math.PI / 2 - sideOffsetAngle) * radius)
        const centerWidth = Math.min(radius * rand(.4, .9), 2 * (sideOffsetAngle * radius - sideWidth / 2 - 1))
        const groupAngle = Math.PI / 2 + turnAngle(Math.PI / 2 - sideOffsetAngle - sideWidth / radius / 2)
        stairs.push(
            { angle: groupAngle, width: centerWidth },
            { angle: groupAngle - sideOffsetAngle, width: sideWidth },
            { angle: groupAngle + sideOffsetAngle, width: sideWidth },
        )
    } else {
        // большое — две широкие справа и слева, пара развёрнута целиком; ширина — с запасом стенки
        // 1 между пролётами и 0.5 у здания
        const sideOffsetAngle = Math.PI * rand(.2, .3)
        const maxWidth = Math.min(
            2 * sideOffsetAngle * radius - 1,
            2 * ((Math.PI / 2 - sideOffsetAngle) * radius - .5),
        )
        const width = maxWidth * rand(.7, .9)
        const groupAngle = Math.PI / 2 + turnAngle(Math.PI / 2 - sideOffsetAngle - width / radius / 2 - .5 / radius)
        stairs.push({ angle: groupAngle - sideOffsetAngle, width }, { angle: groupAngle + sideOffsetAngle, width })
    }
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
        radius,
        wallThickness: rand(.3, .6),
        platformHeight: rand(.6, 2),
        parapetHeight: rand(.5, 1.4),
        hasWall: Math.random() < .7,
        stepHeight: rand(.15, .25),
        stepDepth: rand(.28, .45),
        stairs,
        tileSize: rand(.35, .7),
        arcSegmentLength: rand(.3, 1),
        // бортики — бетон с оттенком, подступенки и площадка с проступями — тонированный множитель тайла
        colorWall: tint(.5, .8, .12),
        colorRiser: tint(.75, .95, .15),
        colorTop: tint(.75, .95, .15),
    }
}

export const stairs00 = (opts: T = {}): IBuffersGeom => {
    const {
        pos, radius, wallThickness, platformHeight, parapetHeight, hasWall, stepHeight, stepDepth, stairs,
        tileSize, arcSegmentLength, collideArcSegmentLength, colorWall, colorRiser, colorTop,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const builder = _GM.createGeomBuilder()
    const { quad, tri, collideQuad, collideTri } = builder

    // ---- размеры ступеней

    // высота верха стенки над землёй: верх парапета или, без бортика, край площадки
    const wallTopHeight = hasWall ? platformHeight + parapetHeight : platformHeight
    const stepCount = Math.max(1, Math.round(platformHeight / stepHeight))
    // настоящая высота подступенка: целое число ступеней даёт ровно высоту площадки
    const riserHeight = platformHeight / stepCount
    // Последняя ступень — сама площадка, поэтому проступей stepCount - 1. Глубина проступи ограничена:
    // пролёт обязан пробить стенку насквозь и уместиться в радиус — иначе нижние проступи проходят
    // через центр и выворачиваются
    const treadCount = Math.max(1, stepCount - 1)
    const treadDepth = Math.max(Math.min(stepDepth, (radius - .1) / treadCount), (wallThickness + .01) / treadCount)
    // радиус верхней ступени: здесь пролёт выходит на площадку
    const topStepRadius = radius - (stepCount - 1) * treadDepth

    // ---- тайлы

    // площадка — земля, подступенки — мох, проступи — плита, стенка — белый тайл под colorWall
    const RECT_PLATFORM = RECT_EARTH

    // Затенение: верх тайла AO_TOP — тень. Как есть он кладёт тень на верхнее ребро квада (третья
    // и четвёртая вершины), перевёрнутый — на нижнее (первая и вторая)
    const AO_SHADOW_AT_TOP = UV_AO_TOP_Q
    const AO_SHADOW_AT_BOTTOM = _GM.flipUvQ(UV_AO_TOP_Q)
    // плита проступи перевёрнута: светлая фаска тайла ложится на внешний край ступени
    const UV_SLAB_TREAD = _GM.flipUvQ(UV_SLAB_Q)

    // ---- точки и нормали

    const pointAt = (angle: number, distance: number, height: number): A3 => [
        pos[0] + Math.cos(angle) * distance,
        pos[1] + height,
        pos[2] + Math.sin(angle) * distance,
    ]
    // касательная к дуге в сторону роста угла и радиальное направление наружу
    const tangentAt = (angle: number): A3 => [-Math.sin(angle), 0, Math.cos(angle)]
    const radialAt = (angle: number): A3 => [Math.cos(angle), 0, Math.sin(angle)]
    const negate = (vector: A3): A3 => [-vector[0], -vector[1], -vector[2]]
    const UP: A3 = [0, 1, 0]

    // Нормаль цилиндрической грани берётся в самой вершине, а не в середине сегмента:
    // так цвет меняется вдоль дуги плавно, и изгиб виден без источника света
    const normalOutward: F_Nrm = point => {
        const dx = point[0] - pos[0]
        const dz = point[2] - pos[2]
        const length = Math.hypot(dx, dz) || 1
        return [dx / length, 0, dz / length]
    }
    const normalInward: F_Nrm = point => negate(normalOutward(point))

    const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
    // uv площадки — плоская проекция всего полукруга на один тайл земли
    const platformUvAt = (angle: number, distance: number): A2 => {
        const point = pointAt(angle, distance, platformHeight)
        return _GM.rectPoint(
            RECT_PLATFORM,
            clamp01((point[0] - pos[0] + radius) / (2 * radius)),
            clamp01((point[2] - pos[2]) / radius),
        )
    }
    // uv2 точки без тени — середина пустого тайла AO
    const AO_UNSHADED_POINT = _GM.rectPoint(RECT_AO_NONE, .5, .5)

    // Делит интервал углов на равные сегменты не длиннее segmentLength по дуге внешнего радиуса;
    // возвращает границы сегментов, включая оба конца
    const splitArc = (angleFrom: number, angleTo: number, segmentLength: number): number[] => {
        const segmentCount = Math.max(1, Math.ceil((angleTo - angleFrom) * radius / segmentLength))
        const borders: number[] = []
        for (let i = 0; i <= segmentCount; ++i) borders.push(angleFrom + (angleTo - angleFrom) * i / segmentCount)
        return borders
    }

    // ---- участки дуги: стенка и пролёты лестниц, по порядку от угла 0 (справа) до PI (слева)

    const ANGLE_START = 0
    const ANGLE_END = Math.PI

    type T_ArcSpan = { angleFrom: number, angleTo: number, isStair: boolean }
    const arcSpans: T_ArcSpan[] = []
    {
        // пролёты обрезаются, не доходя 0.01 рад до здания, — у края всегда остаётся кусок стенки
        const openings = stairs
            .map(stair => {
                const halfAngle = stair.width / radius / 2
                return {
                    angleFrom: Math.max(ANGLE_START + .01, stair.angle - halfAngle),
                    angleTo: Math.min(ANGLE_END - .01, stair.angle + halfAngle),
                }
            })
            .filter(opening => opening.angleTo > opening.angleFrom)
            .sort((a, b) => a.angleFrom - b.angleFrom)

        // угол, до которого дуга уже разложена на участки
        let coveredTo = ANGLE_START
        for (const opening of openings) {
            // пересекающиеся пролёты сливаются в один
            const angleFrom = Math.max(coveredTo, opening.angleFrom)
            if (opening.angleTo <= angleFrom) continue
            if (angleFrom > coveredTo) arcSpans.push({ angleFrom: coveredTo, angleTo: angleFrom, isStair: false })
            arcSpans.push({ angleFrom, angleTo: opening.angleTo, isStair: true })
            coveredTo = opening.angleTo
        }
        if (coveredTo < ANGLE_END) arcSpans.push({ angleFrom: coveredTo, angleTo: ANGLE_END, isStair: false })
    }

    const platformCenter: A3 = pointAt(0, 0, platformHeight)

    // ---- площадка: веер из центра, по краю — полоса плитки шириной bandWidth. Полоса идёт вдоль
    // парапета, у пролёта поворачивает вдоль щеки лестницы (полоса-«щека» — сектор шириной bandWidth
    // по среднему радиусу) и идёт вдоль верхней ступени.
    // У парапета на площадку ложится тень шириной parapetHeight: тайл AO растянут на parapetHeight,
    // как на внутренней стенке над площадкой, поэтому полосы тени по обе стороны угла одной ширины

    // внешний край площадки: внутренняя сторона стенки или, без бортика, сам край
    const platformEdgeRadius = hasWall ? radius - wallThickness : radius
    const bandWidth = Math.min(tileSize, topStepRadius / 2)
    // внутренний край полосы плитки вдоль верхней ступени
    const stairBandInnerRadius = topStepRadius - bandWidth
    // доля тени от парапета на расстоянии distance от центра: 1 у стенки, 0 дальше parapetHeight от неё;
    // без парапета угла нет и тени тоже
    const parapetShadowAt = (distance: number) =>
        hasWall ? Math.max(0, 1 - (platformEdgeRadius - distance) / parapetHeight) : 0
    // радиус, где кончается тень, — граница колец, чтобы тень внутри кольца менялась линейно
    const shadowBorders = hasWall ? [platformEdgeRadius - parapetHeight] : []

    // Ячейка площадки — кольцевой сектор [angleFrom, angleTo] × [radiusFrom, radiusTo];
    // при radiusFrom = 0 — треугольник веера. uvAt задаёт тайл цвета: земля или плитка.
    // isNearParapet — ячейка у парапета и может попасть в его тень
    const platformCell = (
        angleFrom: number, angleTo: number, radiusFrom: number, radiusTo: number,
        isNearParapet: boolean, uvAt: (angle: number, distance: number) => A2,
    ) => {
        const hasShadow = isNearParapet && parapetShadowAt(radiusTo) > 0
        const aoUvAt = (distance: number) =>
            hasShadow ? _GM.rectPoint(RECT_AO_TOP, .5, parapetShadowAt(distance)) : AO_UNSHADED_POINT
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
    const arcPiece = (angleFrom: number, angleTo: number, radiusEnd: number, isNearParapet: boolean) => {
        const bandStartRadius = radiusEnd - bandWidth
        const tileCount = Math.max(1, Math.round((angleTo - angleFrom) * (radiusEnd - bandWidth / 2) / bandWidth))
        const tileAngle = (angleTo - angleFrom) / tileCount
        const segmentsPerTile = Math.max(1, Math.ceil(tileAngle * radiusEnd / arcSegmentLength))
        const borders = ringBorders(radiusEnd, isNearParapet ? [bandStartRadius, ...shadowBorders] : [bandStartRadius])
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
                        segmentFrom, segmentTo, borders[ring], borders[ring + 1], isNearParapet,
                        isInBand ? ornamentUvAt : platformUvAt,
                    )
                }
            }
        }
    }

    // Полоса-«щека» у пролёта: сектор [angleFrom, angleTo] — веер земли до stairBandInnerRadius,
    // дальше плитки по радиусу до края площадки
    const cheekBandPiece = (angleFrom: number, angleTo: number) => {
        const tileCount = Math.max(1, Math.round((platformEdgeRadius - stairBandInnerRadius) / bandWidth))
        const tileRadialSize = (platformEdgeRadius - stairBandInnerRadius) / tileCount
        const cuts = [stairBandInnerRadius, topStepRadius, ...shadowBorders]
        for (let tileIndex = 1; tileIndex < tileCount; ++tileIndex) cuts.push(stairBandInnerRadius + tileIndex * tileRadialSize)
        const borders = ringBorders(platformEdgeRadius, cuts)
        for (let ring = 0; ring < borders.length - 1; ++ring) {
            const radiusFrom = borders[ring]
            const radiusTo = borders[ring + 1]
            if (radiusFrom < stairBandInnerRadius - 1e-4) {
                platformCell(angleFrom, angleTo, radiusFrom, radiusTo, true, platformUvAt)
                continue
            }
            // начало плитки, в которую попало кольцо; плитка повёрнута: по радиусу — горизонталь тайла
            const tileIndex = Math.min(tileCount - 1, Math.floor(((radiusFrom + radiusTo) / 2 - stairBandInnerRadius) / tileRadialSize))
            const tileRadiusStart = stairBandInnerRadius + tileIndex * tileRadialSize
            platformCell(angleFrom, angleTo, radiusFrom, radiusTo, true, (angle, distance) => _GM.rectPoint(
                RECT_ORNAMENT,
                clamp01((distance - tileRadiusStart) / tileRadialSize),
                clamp01((angle - angleFrom) / (angleTo - angleFrom)),
            ))
        }
    }

    for (let spanIndex = 0; spanIndex < arcSpans.length; ++spanIndex) {
        const { angleFrom, angleTo, isStair } = arcSpans[spanIndex]
        if (isStair) {
            // над пролётом площадка кончается у верхней ступени
            arcPiece(angleFrom, angleTo, topStepRadius, false)
            continue
        }
        // У пролётов — щёки, между ними — дуга вдоль парапета; у здания щеки нет.
        // cheekAngle — угол, который занимает щека шириной bandWidth на среднем радиусе полосы
        const cheekAngle = bandWidth / ((stairBandInnerRadius + platformEdgeRadius) / 2)
        let arcFrom = spanIndex > 0 ? angleFrom + cheekAngle : angleFrom
        let arcTo = spanIndex < arcSpans.length - 1 ? angleTo - cheekAngle : angleTo
        // участок стенки уже двух щёк — щёки делят его пополам, дуги между ними нет
        if (arcFrom > arcTo) arcFrom = arcTo = Math.min(angleTo, Math.max(angleFrom, (arcFrom + arcTo) / 2))
        if (arcFrom > angleFrom) cheekBandPiece(angleFrom, arcFrom)
        if (arcTo > arcFrom) arcPiece(arcFrom, arcTo, platformEdgeRadius, true)
        if (angleTo > arcTo) cheekBandPiece(arcTo, angleTo)
    }

    // ---- лестницы и стенка

    for (let spanIndex = 0; spanIndex < arcSpans.length; ++spanIndex) {
        const { angleFrom, angleTo, isStair } = arcSpans[spanIndex]
        const segmentBorders = splitArc(angleFrom, angleTo, arcSegmentLength)

        if (isStair) {
            for (let k = 0; k < segmentBorders.length - 1; ++k) {
                const segmentFrom = segmentBorders[k]
                const segmentTo = segmentBorders[k + 1]
                const segmentMiddle = (segmentFrom + segmentTo) / 2
                // ступени снизу вверх: нижняя — на внешнем радиусе, каждая следующая ближе к центру
                for (let step = 0; step < stepCount; ++step) {
                    const riserRadius = radius - step * treadDepth
                    // подступенок: тень внизу — в углу с проступью ниже, у нижнего — у земли
                    const riserBottom = step * riserHeight
                    quad(
                        pointAt(segmentFrom, riserRadius, riserBottom), pointAt(segmentTo, riserRadius, riserBottom),
                        pointAt(segmentTo, riserRadius, riserBottom + riserHeight),
                        pointAt(segmentFrom, riserRadius, riserBottom + riserHeight),
                        radialAt(segmentMiddle), UV_MOSS_Q, AO_SHADOW_AT_BOTTOM, colorRiser, normalOutward,
                    )
                    // Проступь; у последней ступени её роль играет площадка.
                    // Первые две вершины — внешний край, вторые две — внутренний, у следующего подступенка, там тень
                    if (step < stepCount - 1) {
                        const treadHeight = (step + 1) * riserHeight
                        quad(
                            pointAt(segmentFrom, riserRadius, treadHeight), pointAt(segmentTo, riserRadius, treadHeight),
                            pointAt(segmentTo, riserRadius - treadDepth, treadHeight),
                            pointAt(segmentFrom, riserRadius - treadDepth, treadHeight),
                            UP, UV_SLAB_TREAD, AO_SHADOW_AT_TOP, colorTop,
                        )
                    }
                }
            }
            continue
        }

        // стенка: наружная сторона, а с бортиком ещё внутренняя сторона парапета и его верх
        const innerRadius = radius - wallThickness
        for (let k = 0; k < segmentBorders.length - 1; ++k) {
            const segmentFrom = segmentBorders[k]
            const segmentTo = segmentBorders[k + 1]
            const segmentMiddle = (segmentFrom + segmentTo) / 2
            // тень внизу: снаружи — низ у земли, изнутри — угол с площадкой
            quad(
                pointAt(segmentFrom, radius, 0), pointAt(segmentTo, radius, 0),
                pointAt(segmentTo, radius, wallTopHeight), pointAt(segmentFrom, radius, wallTopHeight),
                radialAt(segmentMiddle), UV_WHITE_Q, AO_SHADOW_AT_BOTTOM, colorWall, normalOutward,
            )
            if (!hasWall) continue
            quad(
                pointAt(segmentFrom, innerRadius, platformHeight), pointAt(segmentTo, innerRadius, platformHeight),
                pointAt(segmentTo, innerRadius, wallTopHeight), pointAt(segmentFrom, innerRadius, wallTopHeight),
                negate(radialAt(segmentMiddle)), UV_WHITE_Q, AO_SHADOW_AT_BOTTOM, colorWall, normalInward,
            )
            quad(
                pointAt(segmentFrom, innerRadius, wallTopHeight), pointAt(segmentTo, innerRadius, wallTopHeight),
                pointAt(segmentTo, radius, wallTopHeight), pointAt(segmentFrom, radius, wallTopHeight),
                UP, UV_WHITE_Q, UV_AO_NONE_Q, colorWall,
            )
        }

        // Торцы участка стенки. У пролёта торец — щека лестницы: под площадкой от верхней ступени
        // до края площадки и, с бортиком, сам торец стенки во всю высоту. У здания торцы смотрят
        // в стену и не видны — не рисуются. Тень внизу — низ у земли
        const endCaps: { angle: number, normal: A3, isAtBuilding: boolean }[] = [
            { angle: angleFrom, normal: negate(tangentAt(angleFrom)), isAtBuilding: spanIndex === 0 },
            { angle: angleTo, normal: tangentAt(angleTo), isAtBuilding: spanIndex === arcSpans.length - 1 },
        ]
        for (const { angle, normal, isAtBuilding } of endCaps) {
            if (isAtBuilding) continue
            quad(
                pointAt(angle, topStepRadius, 0), pointAt(angle, platformEdgeRadius, 0),
                pointAt(angle, platformEdgeRadius, platformHeight), pointAt(angle, topStepRadius, platformHeight),
                normal, UV_WHITE_Q, AO_SHADOW_AT_BOTTOM, colorWall,
            )
            if (hasWall) quad(
                pointAt(angle, innerRadius, 0), pointAt(angle, radius, 0),
                pointAt(angle, radius, wallTopHeight), pointAt(angle, innerRadius, wallTopHeight),
                normal, UV_WHITE_Q, AO_SHADOW_AT_BOTTOM, colorWall,
            )
        }
    }

    // ---- прокси физики: веер площадки, стенка с двух сторон, пандус на месте каждой лестницы

    for (const { angleFrom, angleTo, isStair } of arcSpans) {
        const segmentBorders = splitArc(angleFrom, angleTo, collideArcSegmentLength)
        const platformRadius = isStair ? topStepRadius : platformEdgeRadius
        for (let k = 0; k < segmentBorders.length - 1; ++k) {
            const segmentFrom = segmentBorders[k]
            const segmentTo = segmentBorders[k + 1]
            collideTri(
                platformCenter,
                pointAt(segmentFrom, platformRadius, platformHeight), pointAt(segmentTo, platformRadius, platformHeight),
            )
            if (isStair) {
                // пандус от земли у нижней ступени до площадки у верхней
                collideQuad(
                    pointAt(segmentFrom, radius, 0), pointAt(segmentTo, radius, 0),
                    pointAt(segmentTo, topStepRadius, platformHeight), pointAt(segmentFrom, topStepRadius, platformHeight),
                )
            } else {
                collideQuad(
                    pointAt(segmentFrom, radius, 0), pointAt(segmentTo, radius, 0),
                    pointAt(segmentTo, radius, wallTopHeight), pointAt(segmentFrom, radius, wallTopHeight),
                )
                if (hasWall) collideQuad(
                    pointAt(segmentFrom, radius - wallThickness, platformHeight),
                    pointAt(segmentTo, radius - wallThickness, platformHeight),
                    pointAt(segmentTo, radius - wallThickness, wallTopHeight),
                    pointAt(segmentFrom, radius - wallThickness, wallTopHeight),
                )
            }
        }
    }

    return builder.g
}
