import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import { floor00 } from "geometry/00_floor00/floor00"
import { floor01 } from "geometry/00_floor01/floor01"
import {
    pilaster00, DEFAULT_PROFILE as PILASTER_DEFAULT_PROFILE, randomProfile as randomPilasterProfile, type T_PilasterProfile,
} from "geometry/01_pilaster00/pilaster00"
import { portal00 } from "geometry/02_portal00/portal00"
import { DEFAULT_PROFILE as LINTEL_DEFAULT_PROFILE } from "geometry/03_lintel00/lintel00"
import { profile00 } from "geometry/04_profile00/profile00"
import { wall00 } from "geometry/08_wall00/wall00"

// Комната: толстые стены по периметру, в стенах — порталы (portal00), пол и потолок — floor00 или floor01.
//
// Периметр — замкнутая ломаная в плане по внутреннему лицу стен, против часовой стрелки, если смотреть сверху
// (x вправо, +z к зрителю), как у всех фабрик вдоль пути. Комната — слева от хода пути, стена толщиной
// wallThickness — справа, по нормали ребра (−dz, dx). Фабрика путь не разворачивает: по часовой стрелке комната
// вывернется — стены уйдут внутрь, пол с потолком перевернутся.
//
// Порталы. У точки пути portalWidth > 0 — на ребре от неё к следующей точке стоит портал: проём шириной
// portalWidth (чистый, между стволами пилястр), центр — на доле portalAt длины ребра. Проём сдвигается
// и сужается так, чтобы пилоны с базой и капителью не залезали в соседние стены, но не уже 1.2
// (MIN_PORTAL_WIDTH): заданный уже — расширяется, не помещается шириной 1.2 — портала нет. randomPortals — фабрика сама ставит порталы на часть рёбер, где их нет.
// Общая стена с соседней комнатой (complex00). wall у точки пути — кто строит стену на ребре от неё:
// 'own' — своя наружная стена; 'shared' — эта комната, а за стеной другая комната: наружное лицо строится
// как внутреннее (от пола до низа профиля, с тенью у пола), с прокси; 'neighbour' — стену с порталом строит сосед,
// здесь ребро пустое, но дыра портала считается, чтобы пилястры её обходили. randomPortals ставит порталы только
// на свои стены.
//
// В стене под порталом — дыра от пола до низа перемычки; откосы закрывают стволы пилястр, верх дыры — софит
// перемычки, пол в проёме — порог. portalType 'hole' — та же дыра, но без portal00, порога и прокси откосов:
// проём закрывает то, что к нему пристроено снаружи (у complex00 — portal01 пристройки room02).
//
// Пол — плита толщиной floorThickness на земле pos[1], потолок — та же фабрика пола по развёрнутому контуру:
// верх смотрит вниз, плита висит под верхом стен на ceilingThickness. Тип пола и потолка — floor00 (с кантиком)
// или floor01 (без), пустая строка — случайный на каждой сборке.
//
// Высоты, снизу вверх от pos[1]: земля — верх пола (floorThickness) — низ потолка (+ height) — верх стен
// (+ ceilingThickness). Стены изнутри видны от пола до низа профиля;
// наружного лица у своих стен и верха стен нет — снаружи и сверху комнату не видно.
//
// Профиль под потолком — profile00 (полоса стены с пояском и карнизом) высотой profileHeight по всему периметру,
// выступает в комнату; поверх дыр порталов тоже — перемычки порталов всегда ниже него.
//
// Пилястры у стен — pilaster00 от пола до низа профиля, вдоль каждой стены с шагом около pilasterSpacing.
// Свободные куски стены — между углами и порталами; пилястры встают на оба конца каждого куска (у углов и по бокам
// порталов) и равномерно между ними.
//
// Атласы. uv — atlas00. Стены изнутри (и общая стена с соседом с обеих сторон) — кладка wall00 под colorMasonry,
// между пилястрами и над порталами, тайл не растянут; пороги — земля пола floor01, той же сеткой, что пол.
// uv2 — atlasAo00: тень полосой aoLength у пола изнутри (и у потолка, если профиля нет);
// вертикальные углы стен не затеняются.

export type T_PerimeterPoint = {
    x: number,
    z: number,
    // ширина проёма портала на ребре от этой точки к следующей; 0 — портала нет
    portalWidth?: number,
    // где на ребре центр проёма — доля длины ребра от этой точки
    portalAt?: number,
    // кто строит стену на ребре от этой точки: 'own' (по умолчанию), 'shared', 'neighbour' — см. выше
    wall?: T_WallOwner,
    // что стоит в дыре: 'portal00' (по умолчанию) — портал с порогом; 'hole' — голая дыра, её закрывает пристройка
    portalType?: T_PortalType,
}

export type T_PortalType = 'portal00' | 'hole'

export type T_WallOwner = 'own' | 'shared' | 'neighbour'

// фабрика пола; пустая строка — выбрать случайно
type T_FloorType = '' | 'floor00' | 'floor01'

export type T_PlanPoint = {
    x: number,
    z: number,
}

type T = {
    pos?: A3,                    // начало координат пути; pos[1] — земля под полом
    path?: T_PerimeterPoint[],   // внутреннее лицо стен, замкнутое, против часовой стрелки сверху; порталы — на рёбрах
    randomPortals?: boolean,     // поставить случайные порталы на рёбра без портала
    height?: number,             // высота комнаты в свету — от верха пола до низа потолка
    wallThickness?: number,      // толщина стен наружу от пути
    floorThickness?: number,     // толщина плиты пола
    ceilingThickness?: number,   // толщина плиты потолка под верхом стен
    profileHeight?: number,      // высота полосы стены с карнизом (profile00) под потолком; 0 — без неё
    floorType?: string,          // 'floor00' | 'floor01' | '' — случайный
    ceilingType?: string,        // 'floor00' | 'floor01' | '' — случайный
    portalHeight?: number,       // высота пилястр портала от пола до верха абаки — низ перемычки
    pilaster?: T_PilasterProfile, // тип пилястр — профиль pilaster00, у порталов и у стен
    pilasterSpacing?: number,     // шаг пилястр вдоль стен, между центрами; 0 — без пилястр у стен
    pilasterWidth?: number,       // ширина ствола пилястры у стены, вдоль стены
    pilasterProtrusion?: number,  // на сколько ствол выступает из стены в комнату
    // длина, на которую растягивается тайл тени у угла стены с полом и потолком; видимая тень — примерно её четверть
    aoLength?: number,
    // базовый цвет стен до запечённого освещения; умножается на тайл атласа
    colorWall?: A3,
    // сторона тайла кладки wall00 на стенах изнутри, в метрах
    masonryTileSize?: number,
    // базовый цвет кладки до запечённого освещения; по умолчанию — серо-лиловый, без рыжины, в тон полу и потолку
    colorMasonry?: A3,
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // комната 12 × 10, против часовой стрелки сверху; портал в передней стене (к зрителю) и в правой
    path: [
        { x: -6, z: 5, portalWidth: 1.6, portalAt: .5 },
        { x: 6, z: 5, portalWidth: 1.2, portalAt: .4 },
        { x: 6, z: -5, portalWidth: 0, portalAt: .5 },
        { x: -6, z: -5, portalWidth: 0, portalAt: .5 },
    ],
    randomPortals: false,
    height: 6,
    wallThickness: .6,
    floorThickness: .15,
    ceilingThickness: .2,
    profileHeight: 1.2,
    floorType: '',
    ceilingType: '',
    portalHeight: 2.6,
    pilaster: { ...PILASTER_DEFAULT_PROFILE },
    pilasterSpacing: 3,
    pilasterWidth: .6,
    pilasterProtrusion: .15,
    aoLength: .5,
    colorWall: [.82, .8, .76],
    masonryTileSize: 1.2,
    colorMasonry: [.22, .2, .36],
}

const PORTAL_PIER_WIDTH = .45
const PORTAL_LINTEL_INSET = .05
export const MIN_PORTAL_WIDTH = 1.2

// Сколько стены нужно от края дыры портала до угла комнаты: пилон, вынос базы и капители, карниз перемычки.
// Тот же расчёт, что внутри room00; complex00 по нему заранее выбирает проём, который обе комнаты поставят одинаково
export const portalMarginFor = (pilasterProfile: T_PilasterProfile = {}): number => {
    const pilaster: Required<T_PilasterProfile> = { ...PILASTER_DEFAULT_PROFILE, ...pilasterProfile }
    // перемычка опирается на абаки; карниз шире абаки уходит в стену (так считает portal00)
    const corniceEdge = Math.max(0, pilaster.abacusProjection) - PORTAL_LINTEL_INSET
    const corniceProjection = Math.max(0, Math.min(LINTEL_DEFAULT_PROFILE.corniceProjection, corniceEdge + PORTAL_PIER_WIDTH / 2))
    return PORTAL_PIER_WIDTH + Math.max(pilaster.plinthProjection, pilaster.abacusProjection) + corniceProjection + .1
}

// Высота пилястр портала, которую room00 поставит на самом деле: перемычка с карнизом — под профилем потолка,
// пилястра вмещает базу и капитель; 0 — порталы не помещаются. complex00 по ней узнаёт, будут ли проёмы в стенах
export const portalHeightFor = (pilasterProfile: T_PilasterProfile, height: number, profileHeight: number, portalHeight: number): number => {
    const pilaster: Required<T_PilasterProfile> = { ...PILASTER_DEFAULT_PROFILE, ...pilasterProfile }
    const lintel = LINTEL_DEFAULT_PROFILE
    const lintelHeight = lintel.fasciaHeight + lintel.corniceSlopeHeight + lintel.corniceHeight
    // пилястра должна вместить базу и капитель и ещё немного ствола между ними
    const pilasterMinHeight = pilaster.plinthHeight + pilaster.baseSlopeHeight + pilaster.baseFilletHeight
        + pilaster.abacusHeight + pilaster.capitalSlopeHeight + pilaster.capitalFilletHeight + .3
    const clampedHeight = Math.max(0, height)
    const clampedProfileHeight = Math.min(Math.max(0, profileHeight), clampedHeight)
    const result = Math.min(portalHeight, clampedHeight - clampedProfileHeight - lintelHeight - .05)
    return result >= pilasterMinHeight ? result : 0
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    const pick = <V>(values: V[]): V => values[Math.floor(Math.random() * values.length)]

    const size = rand(25, 70)
    // точки в плане [x, −z]: в этих осях обход против часовой стрелки сверху — положительная площадь
    let plan: A2[]
    const shapeRoll = Math.random()
    if (shapeRoll < .4) {
        // прямоугольник
        const width = size, depth = size * rand(.5, 1)
        plan = [[0, 0], [width, 0], [width, depth], [0, depth]]
    } else if (shapeRoll < .7) {
        // Г-образная: прямоугольник с вырезанным углом
        const width = size, depth = size * rand(.7, 1)
        const cutX = width * rand(.4, .6), cutZ = depth * rand(.4, .6)
        plan = [[0, 0], [width, 0], [width, cutZ], [cutX, cutZ], [cutX, depth], [0, depth]]
    } else {
        // выпуклый многоугольник: углы по кругу с небольшим разбросом
        const pointCount = 5 + Math.floor(Math.random() * 4)
        plan = []
        for (let i = 0; i < pointCount; ++i) {
            const angle = (i + rand(-.2, .2)) / pointCount * Math.PI * 2
            plan.push([Math.cos(angle) * size / 2, Math.sin(angle) * size / 2])
        }
    }
    const path: T_PerimeterPoint[] = plan.map(([x, minusZ]) => ({
        x, z: -minusZ,
        portalWidth: Math.random() < .3 ? rand(1.2, 2.4) : 0,
        portalAt: rand(.2, .8),
    }))

    return {
        path,
        randomPortals: Math.random() < .5,
        height: rand(5, 9),
        wallThickness: rand(.3, 1),
        floorThickness: rand(.05, .3),
        ceilingThickness: rand(.05, .4),
        profileHeight: Math.random() < .1 ? 0 : rand(.8, 1.8),
        floorType: pick<T_FloorType>(['', 'floor00', 'floor01']),
        ceilingType: pick<T_FloorType>(['', 'floor00', 'floor01']),
        portalHeight: rand(2, 3.5),
        pilaster: randomPilasterProfile(),
        pilasterSpacing: Math.random() < .15 ? 0 : rand(2.5, 6),
        pilasterWidth: rand(.4, 1),
        pilasterProtrusion: rand(.06, .3),
        aoLength: rand(.3, .7),
        colorWall: [rand(.65, .9), rand(.65, .9), rand(.65, .9)],
        masonryTileSize: rand(.8, 1.8),
        colorMasonry: [rand(.72, .88), rand(.66, .8), rand(.66, .82)],
    }
}

export const room00 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const { pos, randomPortals, aoLength, colorWall } = o
    const pilaster: Required<T_PilasterProfile> = { ...PILASTER_DEFAULT_PROFILE, ...o.pilaster }
    const lintel = LINTEL_DEFAULT_PROFILE

    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }

    const height = Math.max(0, o.height)
    const wallThickness = Math.max(.05, o.wallThickness)
    const floorThickness = Math.max(0, o.floorThickness)
    const ceilingThickness = Math.max(0, o.ceilingThickness)
    const floorTop = floorThickness
    const ceilingBottom = floorTop + height
    const wallTop = ceilingBottom + ceilingThickness
    // профиль под потолком — полоса стены с карнизом от profileBottom до потолка; стена изнутри доходит до его низа
    const profileHeight = Math.min(Math.max(0, o.profileHeight), height)
    const hasProfile = profileHeight > 1e-6
    const profileBottom = ceilingBottom - profileHeight

    // ---- периметр: без повторяющихся соседних точек и без повтора первой точки в конце

    const points: { point: A2, portalWidth: number, portalAt: number, wall: T_WallOwner, portalType: T_PortalType }[] = []
    for (const { x, z, portalWidth, portalAt, wall, portalType } of o.path) {
        const last = points[points.length - 1]
        if (last && Math.hypot(x - last.point[0], z - last.point[1]) < 1e-6) continue
        points.push({
            point: [x, z], portalWidth: portalWidth ?? 0, portalAt: portalAt ?? .5, wall: wall ?? 'own',
            portalType: portalType ?? 'portal00',
        })
    }
    while (points.length > 1) {
        const first = points[0].point, last = points[points.length - 1].point
        if (Math.hypot(first[0] - last[0], first[1] - last[1]) > 1e-6) break
        points.pop()
    }
    const pathPoints = points.map(({ point }) => point)
    if (pathPoints.length < 3 || Math.abs(_GM.polygonArea2(pathPoints)) < 1e-9 || height <= 0) return result
    const pointCount = pathPoints.length
    const pointAt = (pointIndex: number): A2 => pathPoints[(pointIndex + pointCount) % pointCount]
    const worldAt = ([x, z]: A2, y: number): A3 => [pos[0] + x, pos[1] + y, pos[2] + z]
    const along = (from: A2, direction: A2, distance: number): A2 =>
        [from[0] + direction[0] * distance, from[1] + direction[1] * distance]

    // рёбра: единичное направление, длина и нормаль в плане вправо от хода — наружу, в толщу стены
    const edgeDirections: A2[] = []
    const edgeLengths: number[] = []
    const edgeNormals: A2[] = []
    for (let i = 0; i < pointCount; ++i) {
        const [startX, startZ] = pointAt(i)
        const [endX, endZ] = pointAt(i + 1)
        const length = Math.hypot(endX - startX, endZ - startZ)
        edgeLengths.push(length)
        edgeDirections.push([(endX - startX) / length, (endZ - startZ) / length])
        edgeNormals.push([-(endZ - startZ) / length, (endX - startX) / length])
    }

    // Наружное лицо стены в точке пути: ус по биссектрисе, чтобы обе соседние грани отстояли на wallThickness.
    // Знаменатель — 1 + cos угла между нормалями; ограничен, чтобы на остром изломе ус не улетал
    const outerPoints: A2[] = pathPoints.map(([x, z], i) => {
        const [normal1X, normal1Z] = edgeNormals[(i - 1 + pointCount) % pointCount]
        const [normal2X, normal2Z] = edgeNormals[i]
        const miterScale = wallThickness / Math.max(.2, 1 + normal1X * normal2X + normal1Z * normal2Z)
        return [x + (normal1X + normal2X) * miterScale, z + (normal1Z + normal2Z) * miterScale]
    })

    // ---- порталы: размеры, общие для всех

    const toPoint = ([x, z]: A2) => ({ x, z })
    // пилястра должна вместить базу и капитель и ещё немного ствола между ними
    const pilasterMinHeight = pilaster.plinthHeight + pilaster.baseSlopeHeight + pilaster.baseFilletHeight
        + pilaster.abacusHeight + pilaster.capitalSlopeHeight + pilaster.capitalFilletHeight + .3
    // перемычка с карнизом — под потолком
    const portalHeight = portalHeightFor(pilaster, height, profileHeight, o.portalHeight)
    const portalsFit = portalHeight > 0
    const pierWidth = PORTAL_PIER_WIDTH
    const lintelInset = PORTAL_LINTEL_INSET
    // Перемычка опирается на абаки и уходит в стену, если карниз шире абаки (так считает portal00). Пилон
    // выступает из стены хотя бы на столько, чтобы лицо перемычки вышло из обеих плоскостей стены и её софит
    // закрыл верх дыры по всей толщине
    const corniceEdge = Math.max(0, pilaster.abacusProjection) - lintelInset
    const corniceProjection = Math.max(0, Math.min(lintel.corniceProjection, corniceEdge + pierWidth / 2))
    const pierProtrusion = Math.max(.1, corniceProjection - corniceEdge + .02)
    // от края дыры вдоль стены — пилон, а за ним вынос базы, капители и карниза перемычки
    const portalMargin = portalMarginFor(pilaster)

    // дыра в стене на ребре: отрезок [from, to] вдоль ребра от его начала
    type T_Hole = { from: number, to: number, isBare: boolean }
    const holes: (T_Hole | null)[] = []
    for (let edge = 0; edge < pointCount; ++edge) {
        holes.push(null)
        if (!portalsFit) continue
        let { portalWidth, portalAt } = points[edge]
        if (!(portalWidth > 0) && randomPortals && points[edge].wall === 'own' && Math.random() < .4) {
            portalWidth = MIN_PORTAL_WIDTH + Math.random() * 1.2
            portalAt = .3 + Math.random() * .4
        }
        if (!(portalWidth > 0)) continue
        // Наружные углы стены у концов ребра, спроецированные на ребро: у вогнутого угла комнаты наружное лицо
        // короче внутреннего, и пилон не должен уходить за него
        const length = edgeLengths[edge], direction = edgeDirections[edge]
        const start = pointAt(edge)
        const projection = (point: A2) => (point[0] - start[0]) * direction[0] + (point[1] - start[1]) * direction[1]
        const minFrom = Math.max(0, projection(outerPoints[edge])) + portalMargin
        const maxTo = Math.min(length, projection(outerPoints[(edge + 1) % pointCount])) - portalMargin
        const width = Math.min(Math.max(portalWidth, MIN_PORTAL_WIDTH), maxTo - minFrom)
        if (width < MIN_PORTAL_WIDTH) continue
        const from = Math.min(Math.max(portalAt * length - width / 2, minFrom), maxTo - width)
        holes[edge] = { from, to: from + width, isBare: points[edge].portalType === 'hole' }
    }

    // ---- стены

    const builder = _GM.createGeomBuilder()
    const { collideQuad } = builder

    // Кусок стены, видимый из комнаты, — кладка wall00. Лицо wall00 смотрит вправо от хода start → end:
    // если normal смотрит в другую сторону, концы меняются местами. Сетка кладки привязана к проекции на направление
    // стены и к верху пола, поэтому куски одной стены (по бокам и над проёмом) продолжают одну кладку.
    // Прокси wall00 не берётся — у стены свой, во всю высоту до потолка
    const masonryTileSize = Math.max(.1, o.masonryTileSize)
    const masonryPiece = (start: A2, end: A2, yFrom: number, yTo: number, normal: A2, shadowBottom: boolean, shadowTop: boolean) => {
        const length = Math.hypot(end[0] - start[0], end[1] - start[1])
        if (yTo - yFrom < 1e-6 || length < 1e-6) return
        const facesNormal = -(end[1] - start[1]) * normal[0] + (end[0] - start[0]) * normal[1] > 0
        const [wallStart, wallEnd] = facesNormal ? [start, end] : [end, start]
        const wallDirection: A2 = [(wallEnd[0] - wallStart[0]) / length, (wallEnd[1] - wallStart[1]) / length]
        const piece = wall00({
            pos: [pos[0], pos[1] + yFrom, pos[2]],
            start: wallStart, end: wallEnd,
            height: yTo - yFrom,
            tileSize: masonryTileSize,
            tileOffsetX: wallStart[0] * wallDirection[0] + wallStart[1] * wallDirection[1],
            tileOffsetY: yFrom - floorTop,
            shadowBottom, shadowTop, aoLength,
            colorWall: o.colorMasonry,
        })
        piece.vCollide = []
        _GM.mergeIndexedArrays(result, piece)
    }

    for (let edge = 0; edge < pointCount; ++edge) {
        const innerStart = pointAt(edge), innerEnd = pointAt(edge + 1)
        const outerStart = outerPoints[edge], outerEnd = outerPoints[(edge + 1) % pointCount]
        const direction = edgeDirections[edge], normal = edgeNormals[edge]
        const inwardNormal: A2 = [-normal[0], -normal[1]]
        const hole = holes[edge]
        const wallOwner = points[edge].wall
        // стену строит соседняя комната
        if (wallOwner === 'neighbour') continue
        const shared = wallOwner === 'shared'

        if (!hole) {
            // внутреннее лицо — в комнату, от пола до потолка
            masonryPiece(innerStart, innerEnd, floorTop, profileBottom, inwardNormal, true, !hasProfile)
            collideQuad(worldAt(innerStart, floorTop), worldAt(innerEnd, floorTop), worldAt(innerEnd, ceilingBottom), worldAt(innerStart, ceilingBottom))
            if (shared) {
                // наружное — внутреннее лицо соседней комнаты; у своей стены наружного лица нет
                masonryPiece(outerStart, outerEnd, floorTop, profileBottom, normal, true, !hasProfile)
                collideQuad(worldAt(outerStart, floorTop), worldAt(outerEnd, floorTop), worldAt(outerEnd, ceilingBottom), worldAt(outerStart, ceilingBottom))
            }
        } else {
            // края дыры на внутреннем и наружном лице
            const innerFrom = along(innerStart, direction, hole.from), innerTo = along(innerStart, direction, hole.to)
            const outerFrom = along(innerFrom, normal, wallThickness), outerTo = along(innerTo, normal, wallThickness)

            // внутреннее лицо: по бокам дыры — во всю высоту, над дырой — от низа перемычки до потолка
            masonryPiece(innerStart, innerFrom, floorTop, profileBottom, inwardNormal, true, !hasProfile)
            masonryPiece(innerTo, innerEnd, floorTop, profileBottom, inwardNormal, true, !hasProfile)
            masonryPiece(innerFrom, innerTo, floorTop + portalHeight, profileBottom, inwardNormal, false, !hasProfile)
            collideQuad(worldAt(innerStart, floorTop), worldAt(innerFrom, floorTop), worldAt(innerFrom, ceilingBottom), worldAt(innerStart, ceilingBottom))
            collideQuad(worldAt(innerTo, floorTop), worldAt(innerEnd, floorTop), worldAt(innerEnd, ceilingBottom), worldAt(innerTo, ceilingBottom))
            collideQuad(worldAt(innerFrom, floorTop + portalHeight), worldAt(innerTo, floorTop + portalHeight), worldAt(innerTo, ceilingBottom), worldAt(innerFrom, ceilingBottom))

            if (shared) {
                // наружное лицо — внутреннее лицо соседней комнаты, режется так же, как своё внутреннее;
                // у своей стены наружного лица нет
                masonryPiece(outerStart, outerFrom, floorTop, profileBottom, normal, true, !hasProfile)
                masonryPiece(outerTo, outerEnd, floorTop, profileBottom, normal, true, !hasProfile)
                masonryPiece(outerFrom, outerTo, floorTop + portalHeight, profileBottom, normal, false, !hasProfile)
                collideQuad(worldAt(outerStart, floorTop), worldAt(outerFrom, floorTop), worldAt(outerFrom, ceilingBottom), worldAt(outerStart, ceilingBottom))
                collideQuad(worldAt(outerTo, floorTop), worldAt(outerEnd, floorTop), worldAt(outerEnd, ceilingBottom), worldAt(outerTo, ceilingBottom))
                collideQuad(worldAt(outerFrom, floorTop + portalHeight), worldAt(outerTo, floorTop + portalHeight), worldAt(outerTo, ceilingBottom), worldAt(outerFrom, ceilingBottom))
            }

            // голая дыра: порог, откосы и их прокси — у пристройки
            if (hole.isBare) continue
            // Порог — пол в проёме на уровне верха пола, сквозь толщу стены: верх floor01 без боков (высота 0).
            // Сетка тайлов привязана к тому же pos, что у пола комнаты, — клетки порога продолжают пол.
            // Прокси floor01 не берётся — у порога свой квад ниже
            const thresholdPlan: A2[] = [innerFrom, outerFrom, outerTo, innerTo]
            // floor01 ждёт обход против часовой стрелки сверху — положительную площадь в осях [x, −z]
            if (_GM.polygonArea2(thresholdPlan.map(([x, z]): A2 => [x, -z])) < 0) thresholdPlan.reverse()
            const threshold = floor01({
                pos: [pos[0], pos[1] + floorTop, pos[2]], contour: thresholdPlan.map(toPoint), height: 0,
            })
            threshold.vCollide = []
            _GM.mergeIndexedArrays(result, threshold)
            collideQuad(worldAt(innerFrom, floorTop), worldAt(innerTo, floorTop), worldAt(outerTo, floorTop), worldAt(outerFrom, floorTop))
            // откосы дыры сквозь толщу стены: у пилонов портала прокси нет, без откосов игрок зашёл бы в стену сбоку
            collideQuad(worldAt(innerFrom, floorTop), worldAt(outerFrom, floorTop), worldAt(outerFrom, floorTop + portalHeight), worldAt(innerFrom, floorTop + portalHeight))
            collideQuad(worldAt(innerTo, floorTop), worldAt(outerTo, floorTop), worldAt(outerTo, floorTop + portalHeight), worldAt(innerTo, floorTop + portalHeight))
        }
    }
    _GM.mergeIndexedArrays(result, builder.g)

    // ---- порталы в дырах: точки 1, 2 — внутреннее лицо стены, 3, 4 — наружное; обход portal00 выбирает сам

    for (let edge = 0; edge < pointCount; ++edge) {
        const hole = holes[edge]
        // портал в стене соседа строит сосед
        if (!hole || hole.isBare || points[edge].wall === 'neighbour') continue
        const innerStart = pointAt(edge)
        const direction = edgeDirections[edge], normal = edgeNormals[edge]
        const innerFrom = along(innerStart, direction, hole.from), innerTo = along(innerStart, direction, hole.to)
        const outerFrom = along(innerFrom, normal, wallThickness), outerTo = along(innerTo, normal, wallThickness)
        _GM.mergeIndexedArrays(result, portal00({
            pos: [pos[0], pos[1] + floorTop, pos[2]],
            points: [innerFrom, innerTo, outerTo, outerFrom].map(toPoint),
            height: portalHeight,
            pierWidth, pierProtrusion, lintelInset,
            pilaster, lintel: { ...lintel },
        }))
    }

    // ---- пилястры у стен: от пола до низа профиля (без профиля — до потолка)

    const wallPilasterHeight = profileBottom - floorTop
    const pilasterHalfWidth = Math.max(.05, o.pilasterWidth) / 2
    const pilasterProtrusion = Math.max(.02, o.pilasterProtrusion)
    const pilasterSpacing = o.pilasterSpacing
    // наибольший вынос базы или капители от ствола
    const pilasterProjection = Math.max(pilaster.plinthProjection, pilaster.abacusProjection, 0)
    if (pilasterSpacing > 0 && wallPilasterHeight >= pilasterMinHeight) {
        // центр пилястры не ближе к углу комнаты, чем полширины, вынос и выступ: база не залезет в соседнюю стену
        const cornerClearance = pilasterHalfWidth + pilasterProjection + pilasterProtrusion + .1
        // и не ближе к краю дыры портала, чем пилон с выносами, плюс полширины и вынос самой пилястры
        const holeClearance = portalMargin + pilasterHalfWidth + pilasterProjection + .1
        for (let edge = 0; edge < pointCount; ++edge) {
            const length = edgeLengths[edge], direction = edgeDirections[edge], normal = edgeNormals[edge]
            const inwardNormal: A2 = [-normal[0], -normal[1]]
            const innerStart = pointAt(edge)
            // свободные куски стены — отрезки, где может стоять центр пилястры
            const hole = holes[edge]
            const freeRanges: [number, number][] = hole
                ? [[cornerClearance, hole.from - holeClearance], [hole.to + holeClearance, length - cornerClearance]]
                : [[cornerClearance, length - cornerClearance]]
            for (const [rangeFrom, rangeTo] of freeRanges) {
                if (rangeTo < rangeFrom) continue
                const rangeLength = rangeTo - rangeFrom
                // пилястры на обоих концах куска и равномерно между ними, шаг не больше pilasterSpacing;
                // кусок короче шага — одна пилястра посередине
                const count = rangeLength < pilasterSpacing ? 1 : Math.ceil(rangeLength / pilasterSpacing) + 1
                for (let k = 0; k < count; ++k) {
                    const center = count === 1 ? (rangeFrom + rangeTo) / 2 : rangeFrom + rangeLength * k / (count - 1)
                    const wallLeft = along(innerStart, direction, center - pilasterHalfWidth)
                    const wallRight = along(innerStart, direction, center + pilasterHalfWidth)
                    // П из стены в комнату. pilaster00 выносит профили вправо от хода пути: чтобы база и капитель
                    // смотрели в комнату, лицо ствола проходится против хода периметра — от дальнего края к ближнему
                    const pilasterPath: A2[] = [
                        wallRight,
                        along(wallRight, inwardNormal, pilasterProtrusion),
                        along(wallLeft, inwardNormal, pilasterProtrusion),
                        wallLeft,
                    ]
                    const wallPilaster = pilaster00({
                        ...pilaster,
                        pos: [pos[0], pos[1] + floorTop, pos[2]],
                        path: pilasterPath.map(toPoint),
                        height: wallPilasterHeight,
                        startWallDirection: direction, endWallDirection: direction,
                    })
                    // без прокси: пилястра выступает из стены на ладонь, её держит прокси стены — экономия тел физики
                    wallPilaster.vCollide = []
                    _GM.mergeIndexedArrays(result, wallPilaster)
                }
            }
        }
    }

    // ---- профиль под потолком: profile00 по периметру. Путь развёрнут по часовой стрелке — профиль выступает
    // внутрь, в комнату. Полоса сама продолжает внутреннее лицо стены до потолка

    if (hasProfile) {
        _GM.mergeIndexedArrays(result, profile00({
            pos: [pos[0], pos[1] + profileBottom, pos[2]],
            path: pathPoints.map(toPoint).reverse(),
            closed: true,
            height: profileHeight,
            colorWall,
        }))
    }

    // ---- пол и потолок: тип не задан — случайный на этой сборке

    const floorFactory = (type: string) => {
        const resolved = type === 'floor00' || type === 'floor01' ? type : Math.random() < .5 ? 'floor00' : 'floor01'
        return resolved === 'floor00' ? floor00 : floor01
    }
    const contour = pathPoints.map(toPoint)
    // пол: контур против часовой стрелки — верх вверх
    _GM.mergeIndexedArrays(result, floorFactory(o.floorType)({
        pos, contour, height: floorThickness,
    }))

    // потолок: тот же контур по часовой стрелке — верх смотрит вниз; отрицательная высота — плита свисает
    // от верха стен до низа потолка, бока смотрят наружу, в стены
    _GM.mergeIndexedArrays(result, floorFactory(o.ceilingType)({
        pos: [pos[0], pos[1] + wallTop, pos[2]], contour: [...contour].reverse(), height: -ceilingThickness,
    }))

    return result
}
