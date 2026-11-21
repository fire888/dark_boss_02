import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import {
    DEFAULT_PROFILE as PILASTER_DEFAULT_PROFILE, randomProfile as randomPilasterProfile, type T_PilasterProfile,
} from "geometry/01_pilaster00/pilaster00"
import {
    room00, portalMarginFor, MIN_PORTAL_WIDTH,
    type T_PerimeterPoint, type T_PlanPoint, type T_WallOwner, type T_Zone,
} from "geometry/05_room00/room00"

// Комплекс: несколько комнат room00 из смежных многоугольников, между соседями — порталы.
//
// План — выпуклые многоугольники, которые касаются друг друга целыми рёбрами: общее ребро у двух комнат задано
// одними и теми же двумя точками, у каждой в своём обходе (против часовой стрелки сверху, x вправо, +z к зрителю),
// поэтому у соседа оно идёт навстречу. Ребро плана — ось стены: на общем ребре внутреннее лицо каждой комнаты
// отступает от него на полтолщины стены, на наружном ребре внутреннее лицо лежит на нём, а стена уходит наружу.
//
// Общую стену строит комната с меньшим номером (room00, wall: 'shared' — наружное лицо отделано как внутреннее),
// у соседа ребро пустое (wall: 'neighbour'), но дыра портала у него та же — пилястры её обходят. Портал в общей
// стене — по центру ребра плана, шириной portalWidth, сужается, если пилоны не помещаются у одной из комнат;
// уже 1.2 — общая стена без портала.
//
// Высоты, стены, пилястры и профиль — общие для всех комнат: стыки на общих стенах сходятся только при одинаковых
// уровнях. Своё у комнаты — форма и подиумы (zones, в координатах плана относительно pos).
//
// Ограничения плана, при которых стены сходятся: многоугольники выпуклые, углы комнаты у концов общего ребра —
// не тупые (иначе в углу между стеной соседа и своей останется щель), три комнаты не сходятся в одной точке,
// несмежные комнаты отстоят друг от друга больше чем на две толщины стены. randomOpts строит план по этим правилам.

type T_Room = {
    points: T_PlanPoint[], // многоугольник плана относительно pos — оси стен, выпуклый, против часовой стрелки сверху
    zones?: T_Zone[],      // подиумы комнаты, как у room00
}

type T = {
    pos?: A3,                // начало координат плана; pos[1] — земля под полом
    rooms?: T_Room[],        // комнаты; общие рёбра — одинаковые пары точек у двух комнат
    portalWidth?: number,    // ширина проёма портала между соседними комнатами, чистая, между стволами пилястр
    exteriorPortals?: boolean, // случайные порталы в наружных стенах (room00 randomPortals)
    height?: number,         // высота комнат в свету — от верха пола до низа потолка
    wallThickness?: number,  // толщина стен — и наружных, и общих
    floorThickness?: number, // толщина плиты пола
    ceilingThickness?: number, // толщина плиты потолка под верхом стен
    profileHeight?: number,  // высота полосы стены с карнизом (profile00) под потолком; 0 — без неё
    portalHeight?: number,   // высота пилястр портала от пола до низа перемычки
    pilaster?: T_PilasterProfile, // тип пилястр — профиль pilaster00, у порталов и у стен
    pilasterSpacing?: number,     // шаг пилястр вдоль стен, между центрами; 0 — без пилястр у стен
    pilasterWidth?: number,       // ширина ствола пилястры у стены, вдоль стены
    pilasterProtrusion?: number,  // на сколько ствол выступает из стены в комнату
    maxStepUp?: number,           // перепад, на который заходят без лестницы; подиум выше — с крыльцом stairs00
    aoLength?: number,            // длина, на которую растягивается тайл тени у угла стены с полом и потолком
    colorWall?: A3,               // базовый цвет стен до запечённого освещения
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // зал 12 × 10 в центре; справа — трапеция, за ней прямоугольная комната, слева — комната с щипцом
    rooms: [
        {
            points: [{ x: -6, z: 5 }, { x: 6, z: 5 }, { x: 6, z: -5 }, { x: -6, z: -5 }],
            zones: [{ points: [{ x: -5, z: -1 }, { x: -1, z: -1 }, { x: -1, z: -4 }, { x: -5, z: -4 }], level: 1.2 }],
        },
        {
            points: [{ x: 6, z: -5 }, { x: 6, z: 5 }, { x: 15, z: 3 }, { x: 15, z: -3 }],
            zones: [],
        },
        {
            points: [{ x: 15, z: -3 }, { x: 15, z: 3 }, { x: 23, z: 3 }, { x: 23, z: -3 }],
            zones: [],
        },
        {
            points: [{ x: -6, z: 5 }, { x: -6, z: -5 }, { x: -13, z: -5 }, { x: -17, z: 0 }, { x: -13, z: 5 }],
            zones: [],
        },
    ],
    portalWidth: 1.8,
    exteriorPortals: false,
    height: 6,
    wallThickness: .6,
    floorThickness: .15,
    ceilingThickness: .2,
    profileHeight: 1.2,
    portalHeight: 2.6,
    pilaster: { ...PILASTER_DEFAULT_PROFILE },
    pilasterSpacing: 3,
    pilasterWidth: .6,
    pilasterProtrusion: .15,
    maxStepUp: .4,
    aoLength: .5,
    colorWall: [.82, .8, .76],
    //colorWall: [0, 0, 0],
}

const isInsidePolygon = ([x, z]: A2, polygon: A2[]): boolean => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, zi] = polygon[i], [xj, zj] = polygon[j]
        if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside
    }
    return inside
}

// расстояние от точки до отрезка в плане
const pointSegmentDistance = ([x, z]: A2, [startX, startZ]: A2, [endX, endZ]: A2): number => {
    const dx = endX - startX, dz = endZ - startZ
    const lengthSquared = dx * dx + dz * dz
    const fraction = lengthSquared > 0 ? Math.min(1, Math.max(0, ((x - startX) * dx + (z - startZ) * dz) / lengthSquared)) : 0
    return Math.hypot(x - startX - dx * fraction, z - startZ - dz * fraction)
}

// пересекаются ли отрезки (строго, без касания концами)
const segmentsCross = (a: A2, b: A2, c: A2, d: A2): boolean => {
    const side = (p: A2, q: A2, r: A2) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0
}

// наименьшее расстояние между многоугольниками; 0 — пересекаются или один внутри другого
const polygonsDistance = (first: A2[], second: A2[]): number => {
    if (first.some(point => isInsidePolygon(point, second)) || second.some(point => isInsidePolygon(point, first))) return 0
    let distance = Infinity
    for (let i = 0; i < first.length; ++i) {
        const a = first[i], b = first[(i + 1) % first.length]
        for (let k = 0; k < second.length; ++k) {
            const c = second[k], d = second[(k + 1) % second.length]
            if (segmentsCross(a, b, c, d)) return 0
            distance = Math.min(distance, pointSegmentDistance(a, c, d), pointSegmentDistance(b, c, d),
                pointSegmentDistance(c, a, b), pointSegmentDistance(d, a, b))
        }
    }
    return distance
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    const wallThickness = rand(.3, 1)

    // первая комната — прямоугольник или выпуклый многоугольник вокруг начала координат
    const plans: A2[][] = []
    if (Math.random() < .5) {
        const width = rand(10, 18), depth = rand(8, 14)
        plans.push([[-width / 2, depth / 2], [width / 2, depth / 2], [width / 2, -depth / 2], [-width / 2, -depth / 2]])
    } else {
        const pointCount = 5 + Math.floor(Math.random() * 3)
        const radius = rand(7, 10)
        const first: A2[] = []
        // против часовой стрелки сверху: в осях [x, −z] угол растёт
        for (let i = 0; i < pointCount; ++i) {
            const angle = (i + rand(-.15, .15)) / pointCount * Math.PI * 2
            first.push([Math.cos(angle) * radius, -Math.sin(angle) * radius])
        }
        plans.push(first)
    }

    // Остальные пристраиваются к свободному ребру уже стоящей комнаты: общее ребро — то же, обход навстречу,
    // боковые стороны — под прямым углом или сходятся внутрь, дальняя сторона — прямая или щипец.
    // От всех комнат, кроме той, к которой пристроена, — запас на две стены
    const MIN_SHARED_EDGE = 6
    const roomCount = 3 + Math.floor(Math.random() * 2)
    const usedEdges = new Set<string>()
    for (let attempt = 0; attempt < 200 && plans.length < roomCount; ++attempt) {
        const parentIndex = Math.floor(Math.random() * plans.length)
        const parent = plans[parentIndex]
        const edge = Math.floor(Math.random() * parent.length)
        const key = `${parentIndex}:${edge}`
        if (usedEdges.has(key)) continue
        const start = parent[edge], end = parent[(edge + 1) % parent.length]
        const length = Math.hypot(end[0] - start[0], end[1] - start[1])
        if (length < MIN_SHARED_EDGE) continue
        const direction: A2 = [(end[0] - start[0]) / length, (end[1] - start[1]) / length]
        // наружу от родителя — вправо от хода ребра
        const normal: A2 = [-direction[1], direction[0]]
        const depth = rand(7, 15)
        const taperStart = Math.random() < .5 ? 0 : rand(0, length * .25)
        const taperEnd = Math.random() < .5 ? 0 : rand(0, length * .25)
        const at = (from: A2, alongNormal: number, alongEdge: number): A2 =>
            [from[0] + normal[0] * alongNormal + direction[0] * alongEdge, from[1] + normal[1] * alongNormal + direction[1] * alongEdge]
        const farStart = at(start, depth, taperStart)
        const farEnd = at(end, depth, -taperEnd)
        const plan: A2[] = [end, start, farStart]
        if (Math.random() < .3) {
            // щипец: вершина посередине дальней стороны
            const middle: A2 = [(farStart[0] + farEnd[0]) / 2, (farStart[1] + farEnd[1]) / 2]
            plan.push(at(middle, rand(2, 5), 0))
        }
        plan.push(farEnd)
        const tooClose = plans.some((other, index) =>
            index !== parentIndex && polygonsDistance(plan, other) < wallThickness * 2 + 1.5)
        if (tooClose) continue
        usedEdges.add(key)
        // у новой комнаты общее ребро — первое
        usedEdges.add(`${plans.length}:0`)
        plans.push(plan)
    }

    // подиумы — прямоугольники с запасом от стен, по одному на комнату и не в каждой
    const ZONE_MARGIN = 3
    const rooms: T_Room[] = plans.map(plan => {
        const zones: T_Zone[] = []
        if (Math.random() < .5) {
            let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity
            for (const [x, z] of plan) {
                xMin = Math.min(xMin, x); xMax = Math.max(xMax, x)
                zMin = Math.min(zMin, z); zMax = Math.max(zMax, z)
            }
            for (let attempt = 0; attempt < 20 && !zones.length; ++attempt) {
                const width = rand(2.5, 6), depth = rand(2.5, 6)
                const left = rand(xMin, xMax - width), back = rand(zMin, zMax - depth)
                const box = { left: left - ZONE_MARGIN, right: left + width + ZONE_MARGIN, back: back - ZONE_MARGIN, front: back + depth + ZONE_MARGIN }
                const boxCorners: A2[] = [[box.left, box.front], [box.right, box.front], [box.right, box.back], [box.left, box.back]]
                if (!boxCorners.every(corner => isInsidePolygon(corner, plan))) continue
                zones.push({
                    points: [{ x: left, z: back + depth }, { x: left + width, z: back + depth }, { x: left + width, z: back }, { x: left, z: back }],
                    level: Math.random() < .25 ? rand(.1, .35) : rand(.5, 2),
                })
            }
        }
        return { points: plan.map(([x, z]) => ({ x, z })), zones }
    })

    return {
        rooms,
        portalWidth: rand(1.2, 2.6),
        exteriorPortals: Math.random() < .3,
        height: rand(4.5, 8),
        wallThickness,
        floorThickness: rand(.05, .3),
        ceilingThickness: rand(.05, .4),
        profileHeight: Math.random() < .1 ? 0 : rand(.8, 1.6),
        portalHeight: rand(2, 3.2),
        pilaster: randomPilasterProfile(),
        pilasterSpacing: Math.random() < .15 ? 0 : rand(2.5, 6),
        pilasterWidth: rand(.4, 1),
        pilasterProtrusion: rand(.06, .3),
        maxStepUp: rand(.3, .5),
        aoLength: rand(.3, .7),
        colorWall: [rand(.65, .9), rand(.65, .9), rand(.65, .9)],
    }
}

export const complex00 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }
    const wallThickness = Math.max(.05, o.wallThickness)
    const SAME_POINT = 1e-3

    // многоугольники плана без повторяющихся соседних точек
    const plans: A2[][] = o.rooms.map(({ points }) => {
        const plan: A2[] = []
        for (const { x, z } of points) {
            const last = plan[plan.length - 1]
            if (!last || Math.hypot(x - last[0], z - last[1]) > SAME_POINT) plan.push([x, z])
        }
        while (plan.length > 1 && Math.hypot(plan[0][0] - plan[plan.length - 1][0], plan[0][1] - plan[plan.length - 1][1]) <= SAME_POINT) {
            plan.pop()
        }
        return plan
    })
    const isValid = plans.map(plan => plan.length >= 3 && Math.abs(_GM.polygonArea2(plan)) > 1e-9)

    // ---- общие рёбра: ребро i комнаты a совпадает с ребром k комнаты b, пройденным навстречу

    type T_EdgeLink = { owner: T_WallOwner, room: number, edge: number }
    const links: (T_EdgeLink | null)[][] = plans.map(plan => plan.map(() => null))
    const samePoint = (p: A2, q: A2) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= SAME_POINT
    for (let a = 0; a < plans.length; ++a) {
        if (!isValid[a]) continue
        for (let i = 0; i < plans[a].length; ++i) {
            if (links[a][i]) continue
            const start = plans[a][i], end = plans[a][(i + 1) % plans[a].length]
            for (let b = a + 1; b < plans.length && !links[a][i]; ++b) {
                if (!isValid[b]) continue
                for (let k = 0; k < plans[b].length; ++k) {
                    if (links[b][k]) continue
                    if (samePoint(start, plans[b][(k + 1) % plans[b].length]) && samePoint(end, plans[b][k])) {
                        links[a][i] = { owner: 'shared', room: b, edge: k }
                        links[b][k] = { owner: 'neighbour', room: a, edge: i }
                        break
                    }
                }
            }
        }
    }

    // ---- внутреннее лицо стен: общее ребро отступает внутрь на полтолщины, наружное остаётся на месте.
    // Вершина — пересечение соседних сдвинутых рёбер; рёбра на одной прямой — точка просто сдвигается

    const innerPaths: A2[][] = plans.map((plan, room) => {
        if (!isValid[room]) return []
        const count = plan.length
        // ребро — нормаль наружу (вправо от хода) и прямая n · p = offset после сдвига
        const lines = plan.map((start, i) => {
            const end = plan[(i + 1) % count]
            const length = Math.hypot(end[0] - start[0], end[1] - start[1])
            const normal: A2 = [-(end[1] - start[1]) / length, (end[0] - start[0]) / length]
            const inset = links[room][i] ? wallThickness / 2 : 0
            return { normal, inset, offset: start[0] * normal[0] + start[1] * normal[1] - inset }
        })
        return plan.map((point, i) => {
            const previous = lines[(i - 1 + count) % count], next = lines[i]
            const determinant = previous.normal[0] * next.normal[1] - previous.normal[1] * next.normal[0]
            if (Math.abs(determinant) < 1e-6) return [point[0] - next.normal[0] * next.inset, point[1] - next.normal[1] * next.inset]
            return [
                (previous.offset * next.normal[1] - next.offset * previous.normal[1]) / determinant,
                (previous.normal[0] * next.offset - next.normal[0] * previous.offset) / determinant,
            ]
        })
    })

    // ---- порталы в общих стенах: центр — середина ребра плана, ширина — чтобы пилоны помещались у обеих комнат

    const pilaster: T_PilasterProfile = { ...PILASTER_DEFAULT_PROFILE, ...o.pilaster }
    // небольшой запас сверх отступа room00, чтобы она не сдвигала проём
    const portalMargin = portalMarginFor(pilaster) + .01
    // положение центра на внутреннем ребре комнаты: расстояние от начала ребра и его длина
    const placeOnInnerEdge = (room: number, edge: number, center: A2) => {
        const path = innerPaths[room]
        const start = path[edge], end = path[(edge + 1) % path.length]
        const length = Math.hypot(end[0] - start[0], end[1] - start[1])
        const distance = ((center[0] - start[0]) * (end[0] - start[0]) + (center[1] - start[1]) * (end[1] - start[1])) / length
        return { distance, length }
    }
    const portals: { width: number, at: number }[][] = plans.map(plan => plan.map(() => ({ width: 0, at: .5 })))
    for (let room = 0; room < plans.length; ++room) {
        plans[room].forEach((start, edge) => {
            const link = links[room][edge]
            if (link?.owner !== 'shared') return
            const end = plans[room][(edge + 1) % plans[room].length]
            const center: A2 = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
            const here = placeOnInnerEdge(room, edge, center)
            const there = placeOnInnerEdge(link.room, link.edge, center)
            const halfRoom = Math.min(
                here.distance - portalMargin, here.length - portalMargin - here.distance,
                there.distance - portalMargin, there.length - portalMargin - there.distance,
            )
            const width = Math.min(Math.max(o.portalWidth, MIN_PORTAL_WIDTH), halfRoom * 2)
            if (width < MIN_PORTAL_WIDTH) return
            portals[room][edge] = { width, at: here.distance / here.length }
            portals[link.room][link.edge] = { width, at: there.distance / there.length }
        })
    }

    // ---- комнаты

    plans.forEach((_, room) => {
        if (!isValid[room]) return
        const path: T_PerimeterPoint[] = innerPaths[room].map(([x, z], edge) => ({
            x, z,
            portalWidth: portals[room][edge].width,
            portalAt: portals[room][edge].at,
            wall: links[room][edge]?.owner ?? 'own',
        }))
        _GM.mergeIndexedArrays(result, room00({
            pos: o.pos,
            path,
            randomPortals: o.exteriorPortals,
            height: o.height,
            wallThickness,
            floorThickness: o.floorThickness,
            ceilingThickness: o.ceilingThickness,
            profileHeight: o.profileHeight,
            portalHeight: o.portalHeight,
            pilaster,
            pilasterSpacing: o.pilasterSpacing,
            pilasterWidth: o.pilasterWidth,
            pilasterProtrusion: o.pilasterProtrusion,
            zones: o.rooms[room].zones ?? [],
            maxStepUp: o.maxStepUp,
            aoLength: o.aoLength,
            colorWall: o.colorWall,
        }))
    })

    return result
}
