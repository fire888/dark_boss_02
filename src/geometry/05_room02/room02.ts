import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import { floor01, randomOpts as randomFloorOpts } from "geometry/00_floor01/floor01"
import { wall00 } from "geometry/08_wall00/wall00"
import { portal01 } from "geometry/02_portal01/portal01"

// Комната по контуру: пол и потолок — floor01 без выдавливания (только лицо), стены — wall00 по каждому
// ребру контура лицом внутрь, в стенах — порталы portal01. Больше ничего: без пилястр и порогов.
//
// Контур — замкнутая ломаная { x, z } относительно pos, как у floor01. Направление обхода не важно:
// комната сама приводит его к «против часовой стрелки сверху» (положительная площадь в осях плана [x, −z]) —
// пол смотрит вверх, потолок по обратному контуру вниз, стены идут по обратному обходу, и лицо wall00
// (вправо от хода) смотрит внутрь комнаты.
//
// Кладка продолжается через углы: сетка тайла вдоль стены сдвигается на пройденную длину периметра.
//
// Портал стоит за плоскостью стены: проём начинается в ней и уходит наружу на portalDepth, пол портала —
// на уровне пола комнаты. Стена вокруг портала режется на куски wall00: слева и справа на всю высоту,
// над проёмом — от верха портала до потолка, той же кладкой. Портал повёрнут вокруг y по стене, поэтому
// ему передаётся направление на «солнце», повёрнутое обратно. Проём bare — только дыра в стене, без portal01:
// так соседняя комната (пристройки complex00) встречает портал, пришедший от другой комнаты через зазор.

type T_Point = {
    x: number,
    z: number,
}

export type T_Room02Portal = {
    wall: number,   // номер стены — ребра контура от точки wall к следующей, в порядке contour
    offset: number, // где по стене середина проёма: доля длины стены от точки wall, 0..1
    width: number,  // ширина проёма в свету
    height: number, // высота проёма; выше комнаты — срезается до её высоты
    // голая дыра без portal01: проём закрывает портал соседней комнаты, который приходит к этой стене снаружи
    bare?: boolean,
}
type T_Portal = T_Room02Portal

type T = {
    pos?: A3,                   // смещение контура; pos[1] — уровень пола
    contour?: T_Point[],        // точки контура относительно pos, обход любой; самопересечений быть не должно
    height?: number,            // высота комнаты от пола до потолка
    groundTileSize?: number,    // сторона клетки сетки тайла земли у пола и потолка
    groundColorJitter?: number, // разброс яркости земли по клеткам, доля
    masonryTileSize?: number,   // сторона тайла кладки стен в метрах
    // длина, на которую растягивается тайл тени стен от угла с полом и потолком; видимая тень — примерно четверть
    aoLength?: number,
    // базовые цвета до запечённого освещения; умножаются на тайл атласа
    colorFloor?: A3,
    colorCeiling?: A3,
    colorWall?: A3,
    // порталы в стенах; не влезающий в стену или наложенный на соседний — пропускается
    portals?: T_Portal[],
    portalDepth?: number,     // глубина портала — насколько проём уходит за плоскость стены
    portalThickness?: number, // толщина плиты пола портала под уровнем пола
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // Г-образная комната 8 × 8 с вырезом 4 × 4 в дальнем правом углу, против часовой стрелки сверху
    contour: [
        { x: -4, z: 4 }, { x: 4, z: 4 }, { x: 4, z: 0 },
        { x: 0, z: 0 }, { x: 0, z: -4 }, { x: -4, z: -4 },
    ],
    height: 3.5,
    groundTileSize: 1.5,
    groundColorJitter: .3,
    masonryTileSize: 1.2,
    aoLength: .5,
    colorFloor: [1, 1, 1],
    colorCeiling: [.8, .8, .82],
    colorWall: [.8, .73, .74],
    portals: [
        { wall: 0, offset: .5, width: 1.6, height: 2.6 },
        { wall: 5, offset: .3, width: 1.2, height: 2.2 },
    ],
    portalDepth: .8,
    portalThickness: .2,
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд.
// Контур — тот же, что у floor01, в том числе по часовой стрелке: комната обход приводит сама
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    const floorOpts = randomFloorOpts()
    const contour = floorOpts.contour ?? []
    const portalCount = Math.floor(Math.random() * 4)
    const portals: T_Portal[] = []
    for (let i = 0; i < portalCount; ++i) {
        portals.push({
            wall: Math.floor(Math.random() * contour.length),
            offset: rand(.15, .85),
            width: rand(.8, 1.8),
            height: rand(1.8, 2.6),
        })
    }
    return {
        portals,
        portalDepth: rand(.2, 1.5),
        portalThickness: rand(.05, .4),
        contour: floorOpts.contour,
        height: rand(2.2, 6),
        groundTileSize: floorOpts.groundTileSize,
        groundColorJitter: floorOpts.groundColorJitter,
        masonryTileSize: rand(.6, 2),
        aoLength: rand(.3, .7),
        colorFloor: floorOpts.colorGround,
        colorCeiling: floorOpts.colorGround,
        colorWall: [rand(.72, .88), rand(.66, .8), rand(.66, .82)],
    }
}

export const room02 = (opts: T = {}): IBuffersGeom => {
    const {
        pos, contour, height, groundTileSize, groundColorJitter, masonryTileSize, aoLength,
        colorFloor, colorCeiling, colorWall, portals, portalDepth, portalThickness,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }
    if (contour.length < 3 || height <= 1e-6) return result

    // обход против часовой стрелки сверху: в осях плана [x, −z] площадь положительна
    const plan: A2[] = contour.map(({ x, z }) => [x, -z])
    const isCounterClockwise = _GM.polygonArea2(plan) > 0
    const counterClockwise = isCounterClockwise ? contour : [...contour].reverse()

    // ---- пол: лицо вверх на уровне pos[1], без боков
    _GM.mergeIndexedArrays(result, floor01({
        pos, contour: counterClockwise, height: 0,
        groundTileSize, groundColorJitter, colorGround: colorFloor,
    }))

    // ---- потолок: обратный контур — лицо вниз, на высоте комнаты
    _GM.mergeIndexedArrays(result, floor01({
        pos: [pos[0], pos[1] + height, pos[2]],
        contour: [...counterClockwise].reverse(), height: 0,
        groundTileSize, groundColorJitter, colorGround: colorCeiling,
    }))

    // ---- стены: лицо wall00 смотрит вправо от хода, поэтому стена идёт по часовой стрелке сверху —
    // от конца ребра к началу у контура против часовой, от начала к концу у контура по часовой.
    // Тень у пола и у потолка — оба угла внутренние
    const LIGHT = _GM.LIGHT
    let perimeterWalked = 0
    for (let edge = 0; edge < contour.length; ++edge) {
        const edgeStart = contour[edge], edgeEnd = contour[(edge + 1) % contour.length]
        const [from, to] = isCounterClockwise ? [edgeEnd, edgeStart] : [edgeStart, edgeEnd]
        const length = Math.hypot(to.x - from.x, to.z - from.z)
        if (length < 1e-6) continue
        const direction: A2 = [(to.x - from.x) / length, (to.z - from.z) / length]
        // нормаль лица стены — внутрь комнаты, вправо от хода
        const inward: A2 = [-direction[1], direction[0]]
        const pointAlong = (distance: number): A2 => [from.x + direction[0] * distance, from.z + direction[1] * distance]

        // кусок стены от distanceFrom до distanceTo вдоль хода, по высоте от yFrom до потолка
        const wallPiece = (distanceFrom: number, distanceTo: number, yFrom: number) => {
            if (distanceTo - distanceFrom < 1e-6 || height - yFrom < 1e-6) return
            _GM.mergeIndexedArrays(result, wall00({
                pos: [pos[0], pos[1] + yFrom, pos[2]],
                start: pointAlong(distanceFrom),
                end: pointAlong(distanceTo),
                height: height - yFrom,
                tileSize: masonryTileSize,
                tileOffsetX: perimeterWalked + distanceFrom,
                tileOffsetY: yFrom,
                // над проёмом низ куска — край софита, наружный угол, без тени
                shadowBottom: yFrom < 1e-6,
                shadowTop: true,
                aoLength,
                colorWall,
            }))
        }

        // проёмы этой стены по ходу: offset считается от точки wall контура, у развёрнутого хода — с другого конца.
        // Проём, не влезающий в стену или заходящий на предыдущий, пропускается
        const openings = portals
            .filter(portal => portal.wall === edge && portal.width > 1e-3 && portal.width < length)
            .map(portal => {
                const offsetAlongWalk = isCounterClockwise ? 1 - portal.offset : portal.offset
                const center = Math.min(length - portal.width / 2, Math.max(portal.width / 2, offsetAlongWalk * length))
                return {
                    from: center - portal.width / 2, to: center + portal.width / 2,
                    width: portal.width, height: Math.min(height, portal.height), bare: portal.bare ?? false,
                }
            })
            .sort((a, b) => a.from - b.from)
        let walked = 0
        for (const opening of openings) {
            if (opening.from < walked - 1e-6 || opening.height < 1e-3) continue
            wallPiece(walked, opening.from, 0)
            wallPiece(opening.from, opening.to, opening.height)
            walked = opening.to
            if (opening.bare) continue

            // портал: локально проход вдоль z, лицо (+z) — внутрь комнаты, x — по ходу стены.
            // Поворот вокруг y на angle переводит +z в (sin, cos), +x — в (cos, −sin)
            const angle = Math.atan2(inward[0], inward[1])
            const portal = portal01({
                width: opening.width,
                height: opening.height,
                depth: portalDepth,
                thickness: portalThickness,
                groundTileSize,
                groundColorJitter,
                colorGround: colorFloor,
                colorSide: colorWall,
            }, {
                // свет в системе портала: общее направление, повёрнутое вокруг y на −angle
                light: [
                    LIGHT[0] * Math.cos(angle) - LIGHT[2] * Math.sin(angle),
                    LIGHT[1],
                    LIGHT[0] * Math.sin(angle) + LIGHT[2] * Math.cos(angle),
                ],
            })
            // середина проёма — на плоскости стены, сдвинутая наружу на полглубины
            const center = pointAlong((opening.from + opening.to) / 2)
            const centerX = pos[0] + center[0] - inward[0] * portalDepth / 2
            const centerZ = pos[2] + center[1] - inward[1] * portalDepth / 2
            for (const array of [portal.v, portal.vCollide]) {
                _GM.rotateVerticesY(array, angle)
                _GM.translateVertices(array, centerX, pos[1], centerZ)
            }
            _GM.mergeIndexedArrays(result, portal)
        }
        wallPiece(walked, length, 0)
        perimeterWalked += length
    }

    return result
}
