import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import { RECT_WHITE } from "atlases/atlas00/atlas00"
import { RECT_AO_NONE, RECT_AO_TOP } from "atlases/atlasAo00/atlasAo00"
import { floor00 } from "geometry/00_floor00/floor00"
import { floor01 } from "geometry/00_floor01/floor01"
import {
    pilaster00, DEFAULT_PROFILE as PILASTER_DEFAULT_PROFILE, randomProfile as randomPilasterProfile, type T_PilasterProfile,
} from "geometry/01_pilaster00/pilaster00"
import { portal00 } from "geometry/02_portal00/portal00"
import { DEFAULT_PROFILE as LINTEL_DEFAULT_PROFILE } from "geometry/03_lintel00/lintel00"
import { profile00 } from "geometry/04_profile00/profile00"
import { stairs00 } from "geometry/07_stairs00/stairs00"
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
// перемычки, пол в проёме — порог.
//
// Пол — плита толщиной floorThickness на земле pos[1], потолок — та же фабрика пола по развёрнутому контуру:
// верх смотрит вниз, плита висит под верхом стен на ceilingThickness. Тип пола и потолка — floor00 (с кантиком)
// или floor01 (без), пустая строка — случайный на каждой сборке.
//
// Подиумы (zones) — зоны пола выше уровня комнаты: плита той же фабрики пола от верха пола на level, бока наружу.
// Зона выше maxStepUp получает крыльцо stairs00 — полукруглую площадку вровень с подиумом, приставленную плоской
// стороной к самому длинному краю, с которого дуга со ступенями помещается в комнату и не заходит на другие подиумы.
// Нет такого края — подиум без лестницы. Свет у крыльца запечён stairs00 до поворота, поэтому на повёрнутом крыльце
// он падает с другой стороны, чем на остальной комнате.
//
// Высоты, снизу вверх от pos[1]: земля — верх пола (floorThickness) — низ потолка (+ height) — верх стен
// (+ ceilingThickness). Стены изнутри видны от пола до низа профиля, снаружи — от земли до верха, сверху закрыты.
//
// Профиль под потолком — profile00 (полоса стены с пояском и карнизом) высотой profileHeight по всему периметру,
// выступает в комнату; поверх дыр порталов тоже — перемычки порталов всегда ниже него.
//
// Пилястры у стен — pilaster00 от пола до низа профиля, вдоль каждой стены с шагом около pilasterSpacing.
// Свободные куски стены — между углами и порталами; пилястры встают на оба конца каждого куска (у углов и по бокам
// порталов) и равномерно между ними.
//
// Атласы. uv — atlas00. Стены изнутри (и общая стена с соседом с обеих сторон) — кладка wall00 под colorMasonry,
// между пилястрами и над порталами, тайл не растянут; снаружи, верх стен и пороги — белый тайл под colorWall,
// растянут на каждый кусок. uv2 — atlasAo00: тень полосой
// aoLength у пола изнутри (и у потолка, если профиля нет) и у земли снаружи; вертикальные углы стен не затеняются.

export type T_PerimeterPoint = {
    x: number,
    z: number,
    // ширина проёма портала на ребре от этой точки к следующей; 0 — портала нет
    portalWidth?: number,
    // где на ребре центр проёма — доля длины ребра от этой точки
    portalAt?: number,
    // кто строит стену на ребре от этой точки: 'own' (по умолчанию), 'shared', 'neighbour' — см. выше
    wall?: T_WallOwner,
}

export type T_WallOwner = 'own' | 'shared' | 'neighbour'

// фабрика пола; пустая строка — выбрать случайно
type T_FloorType = '' | 'floor00' | 'floor01'

export type T_PlanPoint = {
    x: number,
    z: number,
}

// Зона пола другого уровня — подиум внутри комнаты
export type T_Zone = {
    points: T_PlanPoint[], // контур зоны в плане относительно pos, против часовой стрелки сверху, целиком внутри комнаты
    level: number,         // высота верха зоны над верхом пола комнаты; <= 0 — зона не строится
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
    zones?: T_Zone[],             // подиумы — зоны пола выше уровня комнаты
    // Перепад, на который ещё заходят без лестницы. Зона выше — получает крыльцо stairs00 у одного из краёв
    maxStepUp?: number,
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
    // высокий подиум в дальнем левом углу — с крыльцом к зрителю, и низкий справа — без лестницы
    zones: [
        { points: [{ x: -5, z: -1 }, { x: -1, z: -1 }, { x: -1, z: -4 }, { x: -5, z: -4 }], level: 1.2 },
        { points: [{ x: 2, z: 1 }, { x: 5, z: 1 }, { x: 5, z: -2 }, { x: 2, z: -2 }], level: .3 },
    ],
    maxStepUp: .4,
    aoLength: .5,
    colorWall: [.82, .8, .76],
    masonryTileSize: 1.2,
    colorMasonry: [.22, .2, .36],
}

// точка внутри многоугольника в плане [x, z] — по чётности пересечений луча; обход любой
const isInsidePolygon = ([x, z]: A2, polygon: A2[]): boolean => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, zi] = polygon[i], [xj, zj] = polygon[j]
        if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside
    }
    return inside
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

    // Подиумы — прямоугольники внутри комнаты. Вокруг каждого — запас под крыльцо и пилястры у стен:
    // прямоугольник с запасом целиком в комнате (все его углы внутри и ни одного угла комнаты в нём)
    // и не задевает запасы других подиумов
    const roomPolygon: A2[] = path.map(({ x, z }) => [x, z])
    let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity
    for (const [x, z] of roomPolygon) {
        xMin = Math.min(xMin, x); xMax = Math.max(xMax, x)
        zMin = Math.min(zMin, z); zMax = Math.max(zMax, z)
    }
    const ZONE_MARGIN = 6
    type T_Box = { left: number, right: number, back: number, front: number }
    const reserved: T_Box[] = []
    const zones: T_Zone[] = []
    const zoneCount = Math.floor(Math.random() * 4)
    for (let attempt = 0; attempt < 40 && zones.length < zoneCount; ++attempt) {
        const width = rand(3, 10), depth = rand(3, 10)
        const left = rand(xMin, xMax - width), back = rand(zMin, zMax - depth)
        const box: T_Box = { left: left - ZONE_MARGIN, right: left + width + ZONE_MARGIN, back: back - ZONE_MARGIN, front: back + depth + ZONE_MARGIN }
        const boxCorners: A2[] = [[box.left, box.front], [box.right, box.front], [box.right, box.back], [box.left, box.back]]
        if (!boxCorners.every(corner => isInsidePolygon(corner, roomPolygon))) continue
        if (roomPolygon.some(([x, z]) => x > box.left && x < box.right && z > box.back && z < box.front)) continue
        if (reserved.some(other => box.left < other.right && box.right > other.left && box.back < other.front && box.front > other.back)) continue
        reserved.push(box)
        zones.push({
            // против часовой стрелки сверху: передний левый, передний правый, дальний правый, дальний левый
            points: [{ x: left, z: back + depth }, { x: left + width, z: back + depth }, { x: left + width, z: back }, { x: left, z: back }],
            // иногда ниже порога — без лестницы
            level: Math.random() < .25 ? rand(.1, .35) : rand(.5, 2.5),
        })
    }

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
        zones,
        maxStepUp: rand(.3, .5),
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

    const points: { point: A2, portalWidth: number, portalAt: number, wall: T_WallOwner }[] = []
    for (const { x, z, portalWidth, portalAt, wall } of o.path) {
        const last = points[points.length - 1]
        if (last && Math.hypot(x - last.point[0], z - last.point[1]) < 1e-6) continue
        points.push({ point: [x, z], portalWidth: portalWidth ?? 0, portalAt: portalAt ?? .5, wall: wall ?? 'own' })
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
    const lintelHeight = lintel.fasciaHeight + lintel.corniceSlopeHeight + lintel.corniceHeight
    // пилястра должна вместить базу и капитель и ещё немного ствола между ними
    const pilasterMinHeight = pilaster.plinthHeight + pilaster.baseSlopeHeight + pilaster.baseFilletHeight
        + pilaster.abacusHeight + pilaster.capitalSlopeHeight + pilaster.capitalFilletHeight + .3
    // перемычка с карнизом — под потолком
    const portalHeight = Math.min(o.portalHeight, height - profileHeight - lintelHeight - .05)
    const portalsFit = portalHeight >= pilasterMinHeight
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
    type T_Hole = { from: number, to: number }
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
        holes[edge] = { from, to: from + width }
    }

    // ---- стены

    const builder = _GM.createGeomBuilder()
    const { quad, collideQuad } = builder
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
    const aoUnshadedPoint = _GM.rectPoint(RECT_AO_NONE, .5, .5)
    // uv2 на расстоянии distance от затеняющего ребра: тень у верхнего края тайла — у самого ребра
    const shadowUvAt = (distance: number): A2 => _GM.rectPoint(RECT_AO_TOP, .5, clamp01(1 - distance / aoLength))

    // Вертикальный кусок стены от start до end в плане, по высоте от yFrom до yTo. Режется по высоте на полосы:
    // у затеняющего ребра (низ — пол или земля, верх — потолок) полоса aoLength с тенью, середина — без,
    // поэтому тень у любого куска одной ширины
    const wallPiece = (start: A2, end: A2, yFrom: number, yTo: number, normal: A2, shadowBottom: boolean, shadowTop: boolean) => {
        const pieceHeight = yTo - yFrom
        if (pieceHeight < 1e-6 || Math.hypot(end[0] - start[0], end[1] - start[1]) < 1e-6) return
        const bandHeight = shadowBottom && shadowTop ? Math.min(aoLength, pieceHeight / 2) : Math.min(aoLength, pieceHeight)
        type T_Band = { from: number, to: number, shadow: 'bottom' | 'top' | 'none' }
        const bands: T_Band[] = []
        const middleFrom = shadowBottom ? yFrom + bandHeight : yFrom
        const middleTo = shadowTop ? yTo - bandHeight : yTo
        if (shadowBottom) bands.push({ from: yFrom, to: middleFrom, shadow: 'bottom' })
        if (middleTo - middleFrom > 1e-6) bands.push({ from: middleFrom, to: middleTo, shadow: 'none' })
        if (shadowTop) bands.push({ from: middleTo, to: yTo, shadow: 'top' })
        const aoUvAt = (y: number, shadow: T_Band['shadow']): A2 => {
            if (shadow === 'bottom') return shadowUvAt(y - yFrom)
            if (shadow === 'top') return shadowUvAt(yTo - y)
            return aoUnshadedPoint
        }
        const outwardNormal: A3 = [normal[0], 0, normal[1]]
        for (const { from, to, shadow } of bands) {
            const fractionFrom = (from - yFrom) / pieceHeight, fractionTo = (to - yFrom) / pieceHeight
            quad(
                worldAt(start, from), worldAt(end, from), worldAt(end, to), worldAt(start, to),
                outwardNormal,
                [
                    ..._GM.rectPoint(RECT_WHITE, 0, fractionFrom), ..._GM.rectPoint(RECT_WHITE, 1, fractionFrom),
                    ..._GM.rectPoint(RECT_WHITE, 1, fractionTo), ..._GM.rectPoint(RECT_WHITE, 0, fractionTo),
                ],
                [...aoUvAt(from, shadow), ...aoUvAt(from, shadow), ...aoUvAt(to, shadow), ...aoUvAt(to, shadow)],
                colorWall,
            )
        }
    }

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
                // наружное — внутреннее лицо соседней комнаты
                masonryPiece(outerStart, outerEnd, floorTop, profileBottom, normal, true, !hasProfile)
                collideQuad(worldAt(outerStart, floorTop), worldAt(outerEnd, floorTop), worldAt(outerEnd, ceilingBottom), worldAt(outerStart, ceilingBottom))
            } else {
                // наружное — от земли до верха стен
                wallPiece(outerStart, outerEnd, 0, wallTop, normal, true, false)
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
                // наружное лицо — внутреннее лицо соседней комнаты, режется так же, как своё внутреннее
                masonryPiece(outerStart, outerFrom, floorTop, profileBottom, normal, true, !hasProfile)
                masonryPiece(outerTo, outerEnd, floorTop, profileBottom, normal, true, !hasProfile)
                masonryPiece(outerFrom, outerTo, floorTop + portalHeight, profileBottom, normal, false, !hasProfile)
                collideQuad(worldAt(outerStart, floorTop), worldAt(outerFrom, floorTop), worldAt(outerFrom, ceilingBottom), worldAt(outerStart, ceilingBottom))
                collideQuad(worldAt(outerTo, floorTop), worldAt(outerEnd, floorTop), worldAt(outerEnd, ceilingBottom), worldAt(outerTo, ceilingBottom))
                collideQuad(worldAt(outerFrom, floorTop + portalHeight), worldAt(outerTo, floorTop + portalHeight), worldAt(outerTo, ceilingBottom), worldAt(outerFrom, ceilingBottom))
            } else {
                // наружное лицо: по бокам — во всю высоту, под порогом — от земли, над дырой — до верха стен
                wallPiece(outerStart, outerFrom, 0, wallTop, normal, true, false)
                wallPiece(outerTo, outerEnd, 0, wallTop, normal, true, false)
                wallPiece(outerFrom, outerTo, 0, floorTop, normal, true, false)
                wallPiece(outerFrom, outerTo, floorTop + portalHeight, wallTop, normal, false, false)
            }

            // порог — пол в проёме на уровне верха пола, сквозь толщу стены
            quad(
                worldAt(innerFrom, floorTop), worldAt(innerTo, floorTop), worldAt(outerTo, floorTop), worldAt(outerFrom, floorTop),
                [0, 1, 0], _GM.rectUvQ(RECT_WHITE), _GM.rectUvQ(RECT_AO_NONE), colorWall,
            )
            collideQuad(worldAt(innerFrom, floorTop), worldAt(innerTo, floorTop), worldAt(outerTo, floorTop), worldAt(outerFrom, floorTop))
        }

        // верх стены — на всю толщину, над дырой тоже
        quad(
            worldAt(innerStart, wallTop), worldAt(innerEnd, wallTop), worldAt(outerEnd, wallTop), worldAt(outerStart, wallTop),
            [0, 1, 0], _GM.rectUvQ(RECT_WHITE), _GM.rectUvQ(RECT_AO_NONE), colorWall,
        )
    }
    _GM.mergeIndexedArrays(result, builder.g)

    // ---- порталы в дырах: точки 1, 2 — внутреннее лицо стены, 3, 4 — наружное; обход portal00 выбирает сам

    for (let edge = 0; edge < pointCount; ++edge) {
        const hole = holes[edge]
        // портал в стене соседа строит сосед
        if (!hole || points[edge].wall === 'neighbour') continue
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
                    _GM.mergeIndexedArrays(result, pilaster00({
                        ...pilaster,
                        pos: [pos[0], pos[1] + floorTop, pos[2]],
                        path: pilasterPath.map(toPoint),
                        height: wallPilasterHeight,
                        startWallDirection: direction, endWallDirection: direction,
                    }))
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
    // пол: контур против часовой стрелки — верх вверх. Подиумы — той же фабрикой, чтобы пол был одного вида
    const floorFactoryResolved = floorFactory(o.floorType)
    _GM.mergeIndexedArrays(result, floorFactoryResolved({
        pos, contour, height: floorThickness,
    }))

    // ---- подиумы: плита от верха пола на level, бока наружу; выше maxStepUp — крыльцо stairs00 у одного края

    // подиумы без повторяющихся соседних точек, только выше пола
    const zones: { polygon: A2[], level: number }[] = []
    for (const zone of o.zones) {
        if (!(zone.level > 0)) continue
        const polygon: A2[] = []
        for (const { x, z } of zone.points) {
            const last = polygon[polygon.length - 1]
            if (!last || Math.hypot(x - last[0], z - last[1]) > 1e-6) polygon.push([x, z])
        }
        while (polygon.length > 1 && Math.hypot(polygon[0][0] - polygon[polygon.length - 1][0], polygon[0][1] - polygon[polygon.length - 1][1]) <= 1e-6) {
            polygon.pop()
        }
        if (polygon.length >= 3 && Math.abs(_GM.polygonArea2(polygon)) > 1e-9) zones.push({ polygon, level: zone.level })
    }

    // запас крыльца от стен комнаты (пилястры с базой) и от других подиумов
    const PORCH_CLEARANCE = .8
    const MIN_PORCH_RADIUS = 1.5
    const MAX_PORCH_RADIUS = 5
    const STEP_HEIGHT = .2, STEP_DEPTH = .35

    for (const { polygon, level } of zones) {
        _GM.mergeIndexedArrays(result, floorFactoryResolved({
            pos: [pos[0], pos[1] + floorTop, pos[2]], contour: polygon.map(toPoint), height: level,
        }))
        if (level <= o.maxStepUp) continue

        // Крыльцо — полукруглая площадка вровень с подиумом, плоской стороной к краю подиума, ступени — по дуге
        // наружу. Радиус — такой, чтобы ступени нормальной глубины уложились в него, но не шире края.
        // Края перебираются от длинного к короткому; подходит тот, у которого дуга с запасом остаётся
        // в комнате и не заходит на другие подиумы
        const edgeOrder = polygon.map((_, i) => i).sort((a, b) => {
            const lengthOf = (i: number) => {
                const [startX, startZ] = polygon[i], [endX, endZ] = polygon[(i + 1) % polygon.length]
                return Math.hypot(endX - startX, endZ - startZ)
            }
            return lengthOf(b) - lengthOf(a)
        })
        const radiusForSteps = (Math.round(level / STEP_HEIGHT) - 1) * STEP_DEPTH + .5
        for (const edge of edgeOrder) {
            const [startX, startZ] = polygon[edge], [endX, endZ] = polygon[(edge + 1) % polygon.length]
            const length = Math.hypot(endX - startX, endZ - startZ)
            const radius = Math.min(length / 2 - .1, MAX_PORCH_RADIUS, Math.max(MIN_PORCH_RADIUS, radiusForSteps))
            if (radius < MIN_PORCH_RADIUS) break
            // наружу от подиума — вправо от хода контура; вдоль края — локальная +x крыльца
            const normal: A2 = [-(endZ - startZ) / length, (endX - startX) / length]
            const tangent: A2 = [normal[1], -normal[0]]
            const middle: A2 = [(startX + endX) / 2, (startZ + endZ) / 2]
            let fits = true
            for (let k = 0; k <= 8 && fits; ++k) {
                const angle = Math.PI * k / 8
                const reach = radius + PORCH_CLEARANCE
                const sample: A2 = [
                    middle[0] + tangent[0] * Math.cos(angle) * reach + normal[0] * Math.sin(angle) * reach,
                    middle[1] + tangent[1] * Math.cos(angle) * reach + normal[1] * Math.sin(angle) * reach,
                ]
                if (!isInsidePolygon(sample, pathPoints)) fits = false
                if (zones.some(other => other.polygon !== polygon && isInsidePolygon(sample, other.polygon))) fits = false
            }
            if (!fits) continue

            const porch = stairs00({
                pos: [0, 0, 0], radius, platformHeight: level, hasWall: false,
                stepHeight: STEP_HEIGHT, stepDepth: STEP_DEPTH,
                stairs: [{ angle: Math.PI / 2, width: radius * 1.2 }],
            })
            // stairs00 строит крыльцо у линии z = 0 с дугой в +z: поворот вокруг y переводит +z в normal
            // (makeRotationY: локальная (0, 1) в плане → (sin, cos)), затем сдвиг к середине края на верх пола
            const turn = Math.atan2(normal[0], normal[1])
            for (const array of [porch.v, porch.vCollide]) {
                _GM.rotateVerticesY(array, turn)
                _GM.translateVertices(array, pos[0] + middle[0], pos[1] + floorTop, pos[2] + middle[1])
            }
            _GM.mergeIndexedArrays(result, porch)
            break
        }
    }
    // потолок: тот же контур по часовой стрелке — верх смотрит вниз; отрицательная высота — плита свисает
    // от верха стен до низа потолка, бока смотрят наружу, в стены
    _GM.mergeIndexedArrays(result, floorFactory(o.ceilingType)({
        pos: [pos[0], pos[1] + wallTop, pos[2]], contour: [...contour].reverse(), height: -ceilingThickness,
    }))

    return result
}
