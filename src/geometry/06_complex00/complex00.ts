import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import { floor01 } from "geometry/00_floor01/floor01"
import {
    pilaster00, DEFAULT_PROFILE as PILASTER_DEFAULT_PROFILE, randomProfile as randomPilasterProfile, type T_PilasterProfile,
} from "geometry/01_pilaster00/pilaster00"
import {
    room00, portalMarginFor, portalHeightFor, MIN_PORTAL_WIDTH, DEFAULT_OPTS as ROOM_DEFAULT_OPTS,
    type T_PerimeterPoint, type T_PlanPoint, type T_WallOwner,
} from "geometry/05_room00/room00"
import { wall00 } from "geometry/08_wall00/wall00"

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
// Снаружи. room00 не строит наружного лица своих стен и верха стен — это оболочка комплекса:
//   наружный контур — наружные рёбра плана всех комнат (без соседа), сцепленные в петли; рёбра на одной прямой
//   сливаются в один отрезок фасада, отрезок отстоит от оси плана на толщину стены (там наружное лицо room00);
//   фасад — кладка wall00 от земли до верха стен, против часовой стрелки сверху — лицом наружу;
//   пилястры фасада — pilaster00 от земли до верха стен с шагом pilasterSpacing, выступают наружу;
//   входы — entranceCount порталов portal00 в наружных стенах, разнесённых по периметру поровну. Их строит room00
//   (дыра, портал, порог) по portalWidth на наружном ребре, комплекс заранее выбирает место и ширину, чтобы
//   пилоны поместились и в комнате, и на отрезке фасада, и вырезает ту же дыру в фасаде;
//   крыша — floor01 по наружному контуру, раздвинутому на roofOverhang, плитой roofThickness на верху стен,
//   снизу — софит свеса (тот же контур по часовой стрелке). Внутренний двор (петля по часовой стрелке) крыша
//   не оставляет — накрывается целиком наружной петлёй.
// Прокси у оболочки нет: стену держат прокси внутренних лиц room00, крыша — над потолками.
// shell: false — оболочки нет совсем, только комнаты (так собирает группы комнат level00).
// entranceTargets — входы к заданным точкам плана, до распределения entranceCount.
//
// Оттенок tint — множитель цвета вершин (c) всего комплекса после сборки комнат, поверх запечённого света;
// компоненты не больше 1, поэтому цвет остаётся в [0, 1]. По умолчанию — синий.
//
// Высоты, стены, пилястры и профиль — общие для всех комнат: стыки на общих стенах сходятся только при одинаковых
// уровнях. Своё у комнаты — форма (в координатах плана относительно pos).
//
// Ограничения плана, при которых стены сходятся: многоугольники выпуклые (точка на прямой стороне — можно);
// угол комнаты у конца общего ребра на наружной стене — не больше 150° (иначе торец общей стены не доходит до угла
// и остаётся щель); в точке, где сходятся три комнаты, одна из них проходит её прямо, с углом 180°, — тогда торцы
// общих стен уходят в толщу соседних; четыре комнаты в одной точке не сходятся; несмежные комнаты отстоят друг
// от друга больше чем на две толщины стены. Ряды комнат так и строятся: граница ряда — прямая, перегородки соседних
// рядов — вразбежку. randomOpts строит план строже — цепочкой без точек на три комнаты.

type T_Room = {
    points: T_PlanPoint[], // многоугольник плана относительно pos — оси стен, выпуклый, против часовой стрелки сверху
}

type T = {
    pos?: A3,                // начало координат плана; pos[1] — земля под полом
    rooms?: T_Room[],        // комнаты; общие рёбра — одинаковые пары точек у двух комнат
    portalWidth?: number,    // ширина проёма портала между соседними комнатами, чистая, между стволами пилястр
    entranceCount?: number,  // сколько входов — порталов в наружных стенах, разнесённых по периметру
    roofThickness?: number,  // толщина плиты крыши над верхом стен
    roofOverhang?: number,   // свес крыши за наружное лицо фасада
    masonryTileSize?: number, // сторона тайла кладки фасада, в метрах
    colorFacade?: A3,        // базовый цвет кладки фасада до запечённого освещения
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
    aoLength?: number,            // длина, на которую растягивается тайл тени у угла стены с полом и потолком
    colorWall?: A3,               // базовый цвет стен до запечённого освещения
    tint?: A3,                    // множитель цвета вершин всего комплекса, компоненты от 0 до 1
    shell?: boolean,              // строить оболочку — фасад, пилястры фасада и крышу; false — только комнаты
    // точки плана (относительно pos), к которым нужны входы: на каждую — вход на наружном ребре, ближайшем к точке,
    // сверх entranceCount (level00 подводит к ним туннели)
    entranceTargets?: T_PlanPoint[],
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // Три ряда комнат вдоль x: средний z от −5 до 5, передний (к зрителю) до 13, задний до −13. Границы рядов — прямые
    // z = ±5, перегородки соседних рядов вразбежку: в каждой точке, где сходятся три комнаты, одна проходит её прямо.
    // Средний ряд: зал 12 × 10, справа трапеция, за ней комната с щипцом, слева комната с щипцом.
    // Передний и задний: комнаты со срезанным углом, с щипцом и с косым углом
    rooms: [
        // средний ряд
        { points: [{ x: -6, z: 5 }, { x: 0, z: 5 }, { x: 6, z: 5 }, { x: 6, z: -5 }, { x: 0, z: -5 }, { x: -6, z: -5 }] },
        { points: [{ x: 6, z: 5 }, { x: 11, z: 5 }, { x: 16, z: 5 }, { x: 14, z: -5 }, { x: 10, z: -5 }, { x: 6, z: -5 }] },
        { points: [{ x: 16, z: 5 }, { x: 23, z: 5 }, { x: 27, z: 0 }, { x: 23, z: -5 }, { x: 14, z: -5 }] },
        { points: [{ x: -13, z: 5 }, { x: -6, z: 5 }, { x: -6, z: -5 }, { x: -13, z: -5 }, { x: -17, z: 0 }] },
        // передний ряд
        { points: [{ x: -10, z: 13 }, { x: 0, z: 13 }, { x: 0, z: 5 }, { x: -6, z: 5 }, { x: -13, z: 5 }, { x: -13, z: 10 }] },
        { points: [{ x: 0, z: 13 }, { x: 5.5, z: 16 }, { x: 11, z: 13 }, { x: 11, z: 5 }, { x: 6, z: 5 }, { x: 0, z: 5 }] },
        { points: [{ x: 11, z: 13 }, { x: 20, z: 13 }, { x: 23, z: 10 }, { x: 23, z: 5 }, { x: 16, z: 5 }, { x: 11, z: 5 }] },
        // задний ряд
        { points: [{ x: -13, z: -5 }, { x: -6, z: -5 }, { x: 0, z: -5 }, { x: 0, z: -13 }, { x: -9, z: -13 }, { x: -13, z: -9 }] },
        { points: [{ x: 0, z: -5 }, { x: 6, z: -5 }, { x: 10, z: -5 }, { x: 10, z: -13 }, { x: 5, z: -16 }, { x: 0, z: -13 }] },
        { points: [{ x: 10, z: -5 }, { x: 14, z: -5 }, { x: 23, z: -5 }, { x: 23, z: -10 }, { x: 20, z: -13 }, { x: 10, z: -13 }] },
    ],
    portalWidth: 1.8,
    entranceCount: 4,
    roofThickness: .35,
    roofOverhang: .5,
    masonryTileSize: ROOM_DEFAULT_OPTS.masonryTileSize,
    colorFacade: [...ROOM_DEFAULT_OPTS.colorMasonry],
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
    aoLength: .5,
    colorWall: [.82, .8, .76],
    //colorWall: [0, 0, 0],
    tint: [.45, .62, 1],
    shell: true,
    entranceTargets: [],
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

    const rooms: T_Room[] = plans.map(plan => ({ points: plan.map(([x, z]) => ({ x, z })) }))

    return {
        rooms,
        portalWidth: rand(1.2, 2.6),
        entranceCount: Math.floor(Math.random() * 6),
        roofThickness: rand(.15, .6),
        roofOverhang: rand(0, .9),
        masonryTileSize: rand(.8, 1.8),
        colorFacade: [rand(.2, .85), rand(.2, .8), rand(.3, .85)],
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
        aoLength: rand(.3, .7),
        colorWall: [rand(.65, .9), rand(.65, .9), rand(.65, .9)],
        tint: [rand(.6, .9), rand(.7, .95), 1],
    }
}

// Многоугольник, раздвинутый наружу на distance: каждое ребро сдвигается вправо от хода, по (−dz, dx), вершина —
// пересечение соседних сдвинутых рёбер; рёбра на одной прямой — точка просто сдвигается
const offsetPolygon = (points: A2[], distance: number): A2[] => {
    const count = points.length
    const lines = points.map((start, i) => {
        const end = points[(i + 1) % count]
        const length = Math.hypot(end[0] - start[0], end[1] - start[1])
        const normal: A2 = [-(end[1] - start[1]) / length, (end[0] - start[0]) / length]
        return { normal, offset: start[0] * normal[0] + start[1] * normal[1] + distance }
    })
    return points.map((point, i) => {
        const previous = lines[(i - 1 + count) % count], next = lines[i]
        const determinant = previous.normal[0] * next.normal[1] - previous.normal[1] * next.normal[0]
        if (Math.abs(determinant) < 1e-6) return [point[0] + next.normal[0] * distance, point[1] + next.normal[1] * distance]
        return [
            (previous.offset * next.normal[1] - next.offset * previous.normal[1]) / determinant,
            (previous.normal[0] * next.offset - next.normal[0] * previous.offset) / determinant,
        ]
    })
}

// Отрезок фасада — наружное лицо стены по отрезку плана: от угла до угла наружного контура. holes — дыры входов,
// отрезки [from, to] вдоль от start
type T_FacadeSegment = { start: A2, end: A2, direction: A2, normal: A2, length: number, holes: [number, number][] }
const distanceAlong = (segment: T_FacadeSegment, point: A2) =>
    (point[0] - segment.start[0]) * segment.direction[0] + (point[1] - segment.start[1]) * segment.direction[1]
const pointAlong = (segment: T_FacadeSegment, distance: number): A2 =>
    [segment.start[0] + segment.direction[0] * distance, segment.start[1] + segment.direction[1] * distance]

// План комплекса без геометрии: общие рёбра, внутреннее лицо стен, порталы, отрезки фасада и входы.
// Детерминирован — complex00 строит по нему геометрию
const layoutComplex = (o: Required<T>) => {
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

    // ---- наружный контур: наружные рёбра плана, сцепленные в петли; рёбра на одной прямой — один отрезок фасада

    type T_ExteriorEdge = { room: number, edge: number, start: A2, end: A2 }
    const exteriorEdges: T_ExteriorEdge[] = []
    plans.forEach((plan, room) => {
        if (!isValid[room]) return
        plan.forEach((start, edge) => {
            if (!links[room][edge]) exteriorEdges.push({ room, edge, start, end: plan[(edge + 1) % plan.length] })
        })
    })
    // отрезок по оси плана из подряд идущих наружных рёбер на одной прямой
    type T_Run = { start: A2, end: A2, edges: T_ExteriorEdge[] }
    const isContinuation = (first: { start: A2, end: A2 }, second: { start: A2, end: A2 }) => {
        const dx1 = first.end[0] - first.start[0], dz1 = first.end[1] - first.start[1]
        const dx2 = second.end[0] - second.start[0], dz2 = second.end[1] - second.start[1]
        // синус угла между рёбрами почти ноль, и идут они в одну сторону
        return Math.abs(dx1 * dz2 - dz1 * dx2) < 1e-4 * Math.hypot(dx1, dz1) * Math.hypot(dx2, dz2) && dx1 * dx2 + dz1 * dz2 > 0
    }
    const loops: T_Run[][] = []
    const usedExterior = new Set<T_ExteriorEdge>()
    for (const first of exteriorEdges) {
        if (usedExterior.has(first)) continue
        const chain: T_ExteriorEdge[] = []
        let current: T_ExteriorEdge | undefined = first
        while (current) {
            usedExterior.add(current)
            chain.push(current)
            const end: A2 = current.end
            current = exteriorEdges.find(other => !usedExterior.has(other) && samePoint(other.start, end))
        }
        // цепочка не замкнулась — план нарушает ограничения, оболочку по ней не строим
        if (chain.length < 3 || !samePoint(chain[chain.length - 1].end, chain[0].start)) continue
        const runs: T_Run[] = []
        for (const edge of chain) {
            const last = runs[runs.length - 1]
            if (last && isContinuation(last, edge)) {
                last.end = edge.end
                last.edges.push(edge)
            } else {
                runs.push({ start: edge.start, end: edge.end, edges: [edge] })
            }
        }
        // петля могла начаться посреди прямого отрезка
        if (runs.length > 1 && isContinuation(runs[runs.length - 1], runs[0])) {
            const last = runs.pop()!
            runs[0].start = last.start
            runs[0].edges = [...last.edges, ...runs[0].edges]
        }
        if (runs.length >= 3) loops.push(runs)
    }

    const facadeLoops: T_FacadeSegment[][] = []
    const segmentOfEdge = new Map<T_ExteriorEdge, T_FacadeSegment>()
    for (const runs of loops) {
        const corners = offsetPolygon(runs.map(run => run.start), wallThickness)
        facadeLoops.push(runs.map((run, i) => {
            const runLength = Math.hypot(run.end[0] - run.start[0], run.end[1] - run.start[1])
            const direction: A2 = [(run.end[0] - run.start[0]) / runLength, (run.end[1] - run.start[1]) / runLength]
            const start = corners[i], end = corners[(i + 1) % corners.length]
            const segment: T_FacadeSegment = {
                start, end, direction,
                normal: [-direction[1], direction[0]],
                length: (end[0] - start[0]) * direction[0] + (end[1] - start[1]) * direction[1],
                holes: [],
            }
            for (const edge of run.edges) segmentOfEdge.set(edge, segment)
            return segment
        }))
    }

    // ---- входы: на каждом наружном ребре — самый широкий проём по центру ребра, пилоны которого помещаются и в комнате,
    // и на отрезке фасада; из подходящих рёбер выбираются ближайшие к точкам, делящим периметр на entranceCount частей

    const portalHeight = portalHeightFor(pilaster, o.height, o.profileHeight, o.portalHeight)
    // outer — на наружной петле (против часовой стрелки сверху), а не во внутреннем дворе
    type T_EntranceCandidate = {
        edge: T_ExteriorEdge, segment: T_FacadeSegment, width: number, at: number, along: number, perimeterAt: number, outer: boolean,
    }
    const candidates: T_EntranceCandidate[] = []
    let perimeter = 0
    for (const segments of facadeLoops) {
        const outer = _GM.polygonArea2(segments.map(segment => segment.start)) < 0
        for (const segment of segments) {
            if (portalHeight > 0) {
                for (const edge of exteriorEdges) {
                    if (segmentOfEdge.get(edge) !== segment) continue
                    const center: A2 = [(edge.start[0] + edge.end[0]) / 2, (edge.start[1] + edge.end[1]) / 2]
                    const here = placeOnInnerEdge(edge.room, edge.edge, center)
                    const along = distanceAlong(segment, center)
                    const halfRoom = Math.min(
                        here.distance - portalMargin, here.length - portalMargin - here.distance,
                        along - portalMargin, segment.length - portalMargin - along,
                    )
                    const width = Math.min(Math.max(o.portalWidth, MIN_PORTAL_WIDTH), halfRoom * 2)
                    if (width < MIN_PORTAL_WIDTH) continue
                    candidates.push({ edge, segment, width, at: here.distance / here.length, along, perimeterAt: perimeter + along, outer })
                }
            }
            perimeter += Math.max(0, segment.length)
        }
    }
    const placeEntrance = (index: number) => {
        const { edge, segment, width, at, along } = candidates.splice(index, 1)[0]
        portals[edge.room][edge.edge] = { width, at }
        segment.holes.push([along - width / 2, along + width / 2])
    }

    // сначала входы к заданным точкам: середина дыры на наружной петле, ближайшая к точке
    for (const { x, z } of o.entranceTargets) {
        let best = -1, bestDistance = Infinity
        candidates.forEach((candidate, index) => {
            if (!candidate.outer) return
            const [centerX, centerZ] = pointAlong(candidate.segment, candidate.along)
            const distance = Math.hypot(centerX - x, centerZ - z)
            if (distance < bestDistance) { best = index; bestDistance = distance }
        })
        if (best >= 0) placeEntrance(best)
    }

    const entranceCount = Math.max(0, Math.floor(o.entranceCount))
    for (let i = 0; i < entranceCount && candidates.length > 0; ++i) {
        const target = (i + .5) / entranceCount * perimeter
        let best = 0
        candidates.forEach((candidate, index) => {
            if (Math.abs(candidate.perimeterAt - target) < Math.abs(candidates[best].perimeterAt - target)) best = index
        })
        placeEntrance(best)
    }
    for (const segments of facadeLoops) for (const segment of segments) segment.holes.sort((a, b) => a[0] - b[0])

    return { wallThickness, plans, isValid, links, innerPaths, portals, pilaster, portalMargin, portalHeight, facadeLoops }
}

export const complex00 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }
    const { wallThickness, plans, isValid, links, innerPaths, portals, pilaster, portalMargin, portalHeight, facadeLoops } = layoutComplex(o)

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
            randomPortals: false,
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
            aoLength: o.aoLength,
            colorWall: o.colorWall,
        }))
    })

    // ---- оболочка: фасад, пилястры фасада, крыша; без неё — только комнаты (level00)
    if (o.shell) {
        // ---- фасад: кладка wall00 от земли до верха стен; у дыры входа — под порогом (толща пола) и над перемычкой.
        // Сетка кладки привязана к проекции на направление отрезка и к земле — куски одного отрезка продолжают одну кладку

        const floorTop = Math.max(0, o.floorThickness)
        const wallTop = floorTop + Math.max(0, o.height) + Math.max(0, o.ceilingThickness)
        const roofOverhang = Math.max(0, o.roofOverhang)
        // под свесом крыши — тень у верха фасада
        const shadowUnderRoof = roofOverhang > 1e-3
        const masonryTileSize = Math.max(.1, o.masonryTileSize)
        const facadePiece = (segment: T_FacadeSegment, from: number, to: number, yFrom: number, yTo: number, shadowBottom: boolean) => {
            if (to - from < 1e-6 || yTo - yFrom < 1e-6) return
            const start = pointAlong(segment, from)
            const piece = wall00({
                pos: [o.pos[0], o.pos[1] + yFrom, o.pos[2]],
                start, end: pointAlong(segment, to),
                height: yTo - yFrom,
                tileSize: masonryTileSize,
                tileOffsetX: start[0] * segment.direction[0] + start[1] * segment.direction[1],
                tileOffsetY: yFrom,
                shadowBottom, shadowTop: shadowUnderRoof && yTo >= wallTop,
                aoLength: o.aoLength,
                colorWall: o.colorFacade,
            })
            piece.vCollide = []
            _GM.mergeIndexedArrays(result, piece)
        }
        for (const segments of facadeLoops) {
            for (const segment of segments) {
                let cursor = 0
                for (const [from, to] of segment.holes) {
                    facadePiece(segment, cursor, from, 0, wallTop, true)
                    facadePiece(segment, from, to, 0, floorTop, true)
                    facadePiece(segment, from, to, floorTop + portalHeight, wallTop, false)
                    cursor = to
                }
                facadePiece(segment, cursor, segment.length, 0, wallTop, true)
            }
        }

        // ---- пилястры фасада: pilaster00 от земли до верха стен, наружу; на концах свободных кусков отрезка
        // (у углов и по бокам входов) и равномерно между ними с шагом не больше pilasterSpacing

        const pilasterHalfWidth = Math.max(.05, o.pilasterWidth) / 2
        const pilasterProtrusion = Math.max(.02, o.pilasterProtrusion)
        // наибольший вынос базы или капители от ствола
        const pilasterProjection = Math.max(pilaster.plinthProjection ?? 0, pilaster.abacusProjection ?? 0, 0)
        if (o.pilasterSpacing > 0 && wallTop > 2) {
            // от угла — чтобы база не залезла в соседний отрезок у вогнутого угла контура
            const cornerClearance = pilasterHalfWidth + pilasterProjection + pilasterProtrusion + .1
            // от края дыры входа — пилон портала с выносами, плюс полширины и вынос самой пилястры
            const holeClearance = portalMargin + pilasterHalfWidth + pilasterProjection + .1
            for (const segments of facadeLoops) {
                for (const segment of segments) {
                    const freeRanges: [number, number][] = []
                    let rangeFrom = cornerClearance
                    for (const [from, to] of segment.holes) {
                        freeRanges.push([rangeFrom, from - holeClearance])
                        rangeFrom = to + holeClearance
                    }
                    freeRanges.push([rangeFrom, segment.length - cornerClearance])
                    for (const [from, to] of freeRanges) {
                        if (to < from) continue
                        const rangeLength = to - from
                        const count = rangeLength < o.pilasterSpacing ? 1 : Math.ceil(rangeLength / o.pilasterSpacing) + 1
                        for (let k = 0; k < count; ++k) {
                            const center = count === 1 ? (from + to) / 2 : from + rangeLength * k / (count - 1)
                            const wallLeft = pointAlong(segment, center - pilasterHalfWidth)
                            const wallRight = pointAlong(segment, center + pilasterHalfWidth)
                            const outward = (point: A2): A2 =>
                                [point[0] + segment.normal[0] * pilasterProtrusion, point[1] + segment.normal[1] * pilasterProtrusion]
                            // П из стены наружу; лицо ствола идёт по ходу отрезка — профили выступают вправо от хода, наружу
                            const piece = pilaster00({
                                ...pilaster,
                                pos: o.pos,
                                path: [wallLeft, outward(wallLeft), outward(wallRight), wallRight].map(([x, z]) => ({ x, z })),
                                height: wallTop,
                                startWallDirection: segment.direction, endWallDirection: segment.direction,
                            })
                            piece.vCollide = []
                            _GM.mergeIndexedArrays(result, piece)
                        }
                    }
                }
            }
        }

        // ---- крыша: floor01 по наружному контуру, раздвинутому на свес, — плита на верху стен; снизу — софит свеса.
        // Крышу получают только наружные петли (против часовой стрелки сверху — в осях [x, z] площадь отрицательна)

        for (const segments of facadeLoops) {
            const corners = segments.map(segment => segment.start)
            if (_GM.polygonArea2(corners) >= 0) continue
            const contour = (roofOverhang > 1e-3 ? offsetPolygon(corners, roofOverhang) : corners).map(([x, z]) => ({ x, z }))
            const roofPos: A3 = [o.pos[0], o.pos[1] + wallTop, o.pos[2]]
            const roof = floor01({ pos: roofPos, contour, height: Math.max(.01, o.roofThickness) })
            roof.vCollide = []
            _GM.mergeIndexedArrays(result, roof)
            if (shadowUnderRoof) {
                // контур по часовой стрелке — верх смотрит вниз
                const soffit = floor01({ pos: roofPos, contour: [...contour].reverse(), height: 0 })
                soffit.vCollide = []
                _GM.mergeIndexedArrays(result, soffit)
            }
        }
    }

    // ---- оттенок всего комплекса: множитель цвета каждой вершины
    const tint = o.tint.map(channel => Math.min(1, Math.max(0, channel)))
    for (let i = 0; i < result.c.length; ++i) result.c[i] *= tint[i % 3]

    return result
}
