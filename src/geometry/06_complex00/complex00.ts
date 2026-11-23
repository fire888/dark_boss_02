import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import {
    DEFAULT_PROFILE as PILASTER_DEFAULT_PROFILE, randomProfile as randomPilasterProfile, type T_PilasterProfile,
} from "geometry/01_pilaster00/pilaster00"
import {
    room00, portalMarginFor, portalHeightFor, MIN_PORTAL_WIDTH, DEFAULT_OPTS as ROOM_DEFAULT_OPTS,
    type T_PerimeterPoint, type T_PlanPoint, type T_WallOwner, type T_PortalType,
} from "geometry/05_room00/room00"
import { room02, type T_Room02Portal } from "geometry/05_room02/room02"

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
// Снаружи комплекса ничего нет: room00 не строит наружного лица своих стен и верха стен, фасада и крыши тоже нет.
// Наружный контур считается только для входов: наружные рёбра плана всех комнат (без соседа), сцепленные в петли,
// рёбра на одной прямой — один отрезок, отстоящий от оси плана на толщину стены (там наружное лицо room00).
// Входы — entranceCount порталов portal00 в наружных стенах, разнесённых по периметру поровну. Их строит room00
// (дыра, портал, порог) по portalWidth на наружном ребре, комплекс заранее выбирает место и ширину, чтобы пилоны
// поместились и в комнате, и на отрезке наружного контура.
//
// Пристройки — annexCount групп малых комнат room02 у наружного лица стены, у входов, расставленных по entranceCount
// (у входов к entranceTargets — нет). Группа целиком лежит в прямоугольнике annexWidth вдоль стены по центру входа
// и annexDepth наружу; у края отрезка наружного контура и у соседних дыр прямоугольник сужается, не уже проёма с запасом.
// Пол всех комнат пристройки — на верху пола комплекса, потолок ниже, чем у комплекса.
//   Главная комната — вплотную к наружному лицу стены, глубокая, высотой annexHeight. Периметр сложный: дальние углы — прямые,
//   со срезом или с Г-вырезом, иногда дальняя стена — щипец. Дыра в стене комплекса у такого входа голая
//   (room00, portalType 'hole'): без portal00 и порога, её закрывает portal01 главной комнаты — room02 ставит его
//   за своей стеной, то есть в толщу стены комплекса, глубиной в толщину стены.
//   Малые комнаты — у левой, правой и дальней стены главной (если она не щипец), ещё ниже; между стенами —
//   зазор в толщину стены, проход — portal01 главной комнаты через зазор, у малой комнаты в стене голая дыра
//   (room02, bare). Малая комната — прямоугольник, иногда со срезанными дальними углами.
// Форма группы — от зерна по месту входа: одна и та же на пересборке.
// Главная комната, которая задевает крылья комплекса или другую пристройку, не строится — вход остаётся с portal00;
// задевающая малая комната не строится — без неё и проход к ней.
// annexTargets — пристройки к заданным точкам плана, сверх annexCount: вход на наружном ребре, ближайшем к точке,
// и пристройка у него (level00 заранее резервирует под неё место). Если пристройка не встала, вход к такой точке
// убирается — дыра никуда не вела бы.
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
    masonryTileSize?: number, // сторона тайла кладки стен пристроек, в метрах
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
    // точки плана (относительно pos), к которым нужны входы: на каждую — вход на наружном ребре, ближайшем к точке,
    // сверх entranceCount (level00 подводит к ним туннели)
    entranceTargets?: T_PlanPoint[],
    annexCount?: number,  // сколько пристроек room02 у входов; не больше числа входов entranceCount
    annexWidth?: number,  // ширина пристройки вдоль стены
    annexDepth?: number,  // глубина пристройки от стены наружу
    annexHeight?: number, // высота главной комнаты пристройки в свету; не выше height, малые комнаты — ниже неё
    // точки плана (относительно pos), у которых нужен вход с пристройкой, сверх annexCount (так ставит их level00)
    annexTargets?: T_PlanPoint[],
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
    masonryTileSize: ROOM_DEFAULT_OPTS.masonryTileSize,
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
    entranceTargets: [],
    annexCount: 2,
    annexWidth: 14,
    annexDepth: 11,
    annexHeight: 3.6,
    annexTargets: [],
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
        masonryTileSize: rand(.8, 1.8),
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
        annexCount: Math.floor(Math.random() * 4),
        annexWidth: rand(9, 18),
        annexDepth: rand(7, 14),
        annexHeight: rand(3, 4.5),
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

// Отрезок наружного контура — наружное лицо стены по отрезку плана: от угла до угла наружного контура. holes — дыры входов,
// отрезки [from, to] вдоль от start
type T_FacadeSegment = { start: A2, end: A2, direction: A2, normal: A2, length: number, holes: [number, number][] }
const distanceAlong = (segment: T_FacadeSegment, point: A2) =>
    (point[0] - segment.start[0]) * segment.direction[0] + (point[1] - segment.start[1]) * segment.direction[1]
const pointAlong = (segment: T_FacadeSegment, distance: number): A2 =>
    [segment.start[0] + segment.direction[0] * distance, segment.start[1] + segment.direction[1] * distance]

// Комната пристройки в осях входа: u — вдоль стены от середины входа, v — наружу от наружного лица стены
type T_AnnexRoom = { contour: A2[], portals: T_Room02Portal[], height: number }
// малая комната и портал к ней в главной комнате — добавляется, только если малая комната встала
type T_AnnexChild = { room: T_AnnexRoom, mainPortal: T_Room02Portal }

// Группа пристройки в прямоугольнике u ∈ [−halfWidth, halfWidth], v ∈ [0, depth]: главная комната и малые у её стен.
// holeWidth — проём входа, gap — зазор между стенами главной и малой комнаты (он же глубина портала между ними)
const layoutAnnex = (random: () => number, halfWidth: number, depth: number, holeWidth: number, gap: number,
    annexHeight: number, portalHeight: number): { main: T_AnnexRoom, children: T_AnnexChild[] } => {
    const rand = (min: number, max: number) => min + random() * (max - min)
    // наименьшая сторона малой комнаты и запас стены по бокам проёма
    const CHILD_MIN = 2.2
    const PORTAL_SIDE = .3
    const childPortalWidth = Math.min(holeWidth, 1.6)

    // ---- главная комната: прямоугольник у стены, дальние углы — прямые, срез или Г-вырез, иногда щипец
    const mainHalf = Math.min(halfWidth, Math.max(holeWidth / 2 + .6, halfWidth * rand(.28, .42)))
    const mainDepth = Math.min(depth, Math.max(holeWidth + 1, depth * rand(.6, .8)))
    const cornerCut = Math.min(mainHalf, mainDepth) * rand(.2, .4)
    type T_Corner = 'plain' | 'chamfer' | 'notch'
    const cornerKind = (): T_Corner => { const roll = random(); return roll < .3 ? 'plain' : roll < .65 ? 'chamfer' : 'notch' }
    const leftCorner = cornerKind(), rightCorner = cornerKind()
    const hasGable = random() < .3 && depth - mainDepth > 1.2
    // докуда по v стены главной комнаты прямые, и где по u начинается и кончается дальняя стена
    const leftTop = leftCorner === 'plain' ? mainDepth : mainDepth - cornerCut
    const rightTop = rightCorner === 'plain' ? mainDepth : mainDepth - cornerCut
    const farLeft = leftCorner === 'plain' ? -mainHalf : -mainHalf + cornerCut
    const farRight = rightCorner === 'plain' ? mainHalf : mainHalf - cornerCut

    // ребро 0 — у стены, от +u к −u (навстречу отрезку наружного контура); ребро 1 — левая стена снизу вверх
    const points: A2[] = [[mainHalf, 0], [-mainHalf, 0], [-mainHalf, leftTop]]
    if (leftCorner === 'chamfer') points.push([farLeft, mainDepth])
    if (leftCorner === 'notch') points.push([farLeft, leftTop], [farLeft, mainDepth])
    // дальняя стена — от (farLeft, mainDepth) к (farRight, mainDepth), если не щипец
    const farEdge = points.length - 1
    if (hasGable) points.push([(farLeft + farRight) / 2, mainDepth + Math.min(depth - mainDepth - .1, rand(1, 3))])
    if (rightCorner === 'chamfer') points.push([farRight, mainDepth])
    if (rightCorner === 'notch') points.push([farRight, mainDepth], [farRight, rightTop])
    points.push([mainHalf, rightTop])
    // правая стена — последнее ребро, сверху вниз к точке 0
    const rightEdge = points.length - 1

    const main: T_AnnexRoom = {
        contour: points,
        portals: [{ wall: 0, offset: .5, width: holeWidth, height: portalHeight }],
        height: annexHeight,
    }

    // ---- малые комнаты: ещё ниже, у боковых стен — вне ширины главной, у дальней — в её ширине
    const children: T_AnnexChild[] = []
    const childHeight = () => Math.max(portalHeight + .3, annexHeight * rand(.75, .9))
    // прямоугольник, ребро 0 — к главной комнате; у дальних от неё углов иногда срез
    const childContour = (wallStart: A2, wallEnd: A2, outward: A2, childDepth: number): A2[] => {
        const far = (point: A2, distance: number): A2 => [point[0] + outward[0] * distance, point[1] + outward[1] * distance]
        if (random() < .5) return [wallStart, wallEnd, far(wallEnd, childDepth), far(wallStart, childDepth)]
        const chamfer = Math.min(childDepth, Math.hypot(wallEnd[0] - wallStart[0], wallEnd[1] - wallStart[1])) * rand(.2, .35)
        const along: A2 = [(wallEnd[0] - wallStart[0]), (wallEnd[1] - wallStart[1])]
        const alongLength = Math.hypot(...along)
        const step = (point: A2, distance: number): A2 => [point[0] + along[0] / alongLength * distance, point[1] + along[1] / alongLength * distance]
        return [wallStart, wallEnd, far(wallEnd, childDepth - chamfer), step(far(wallEnd, childDepth), -chamfer),
            step(far(wallStart, childDepth), chamfer), far(wallStart, childDepth - chamfer)]
    }

    // сбоку: side = −1 — слева, +1 — справа. Малая комната — v ∈ [childFrom, childFrom + childLength], не ближе gap к стене;
    // проём — посередине того, что у неё общего с прямой частью боковой стены главной
    const sideChild = (side: -1 | 1) => {
        const wallTop = side < 0 ? leftTop : rightTop
        const width = Math.min(halfWidth - mainHalf - gap, rand(CHILD_MIN, 5))
        const childLength = Math.min(depth - gap, rand(CHILD_MIN, 6))
        const fromMax = Math.min(depth - childLength, wallTop - childPortalWidth - PORTAL_SIDE * 2)
        if (width < CHILD_MIN || childLength < childPortalWidth + PORTAL_SIDE * 2 || fromMax < gap || random() < .1) return
        const childFrom = rand(gap, fromMax)
        const portalCenter = (childFrom + Math.min(childFrom + childLength, wallTop)) / 2
        const wallU = side * (mainHalf + gap)
        // ребро 0 малой комнаты — к главной; оно идёт по v навстречу стене главной комнаты
        const [wallStart, wallEnd]: A2[] = side < 0
            ? [[wallU, childFrom], [wallU, childFrom + childLength]]
            : [[wallU, childFrom + childLength], [wallU, childFrom]]
        const offsetOnChild = side < 0 ? (portalCenter - childFrom) / childLength : (childFrom + childLength - portalCenter) / childLength
        children.push({
            room: {
                contour: childContour(wallStart, wallEnd, [side * width, 0].map(Math.sign) as A2, width),
                portals: [{ wall: 0, offset: offsetOnChild, width: childPortalWidth, height: portalHeight, bare: true }],
                height: childHeight(),
            },
            mainPortal: side < 0
                ? { wall: 1, offset: portalCenter / leftTop, width: childPortalWidth, height: portalHeight }
                : { wall: rightEdge, offset: (rightTop - portalCenter) / rightTop, width: childPortalWidth, height: portalHeight },
        })
    }
    sideChild(-1)
    sideChild(1)

    // за дальней стеной: в ширине главной комнаты, проём — посередине общего с прямой дальней стеной
    if (!hasGable && random() < .9) {
        const childDepth = Math.min(depth - mainDepth - gap, rand(CHILD_MIN, 5))
        const width = Math.min(mainHalf * 2, rand(CHILD_MIN, 6))
        const farLength = farRight - farLeft
        if (childDepth >= CHILD_MIN && width >= childPortalWidth + PORTAL_SIDE * 2 && farLength >= childPortalWidth + PORTAL_SIDE * 2) {
            // начало по u: так, чтобы общее с дальней стеной вмещало проём
            const fromMin = Math.max(-mainHalf, farLeft - width + childPortalWidth + PORTAL_SIDE * 2)
            const fromMax = Math.min(mainHalf - width, farRight - childPortalWidth - PORTAL_SIDE * 2)
            if (fromMax >= fromMin) {
                const childFrom = rand(fromMin, fromMax)
                const portalCenter = (Math.max(childFrom, farLeft) + Math.min(childFrom + width, farRight)) / 2
                const wallV = mainDepth + gap
                children.push({
                    room: {
                        // ребро 0 — к главной, от +u к −u, навстречу дальней стене главной
                        contour: childContour([childFrom + width, wallV], [childFrom, wallV], [0, 1], childDepth),
                        portals: [{ wall: 0, offset: (childFrom + width - portalCenter) / width, width: childPortalWidth, height: portalHeight, bare: true }],
                        height: childHeight(),
                    },
                    mainPortal: { wall: farEdge, offset: (portalCenter - farLeft) / farLength, width: childPortalWidth, height: portalHeight },
                })
            }
        }
    }

    return { main, children }
}

// План комплекса без геометрии: общие рёбра, внутреннее лицо стен, порталы, отрезки наружного контура и входы.
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
    const portals: { width: number, at: number, type: T_PortalType }[][] =
        plans.map(plan => plan.map(() => ({ width: 0, at: .5, type: 'portal00' as T_PortalType })))
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
            portals[room][edge] = { width, at: here.distance / here.length, type: 'portal00' }
            portals[link.room][link.edge] = { width, at: there.distance / there.length, type: 'portal00' }
        })
    }

    // ---- наружный контур: наружные рёбра плана, сцепленные в петли; рёбра на одной прямой — один отрезок наружного контура

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
    // и на отрезке наружного контура; из подходящих рёбер выбираются ближайшие к точкам, делящим периметр на entranceCount частей

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
    const placeEntrance = (index: number): T_EntranceCandidate => {
        const entrance = candidates.splice(index, 1)[0]
        const { edge, segment, width, at, along } = entrance
        portals[edge.room][edge.edge] = { width, at, type: 'portal00' }
        segment.holes.push([along - width / 2, along + width / 2])
        return entrance
    }

    // сначала входы к заданным точкам: середина дыры на наружной петле, ближайшая к точке
    const nearestOuterCandidate = (x: number, z: number): number => {
        let best = -1, bestDistance = Infinity
        candidates.forEach((candidate, index) => {
            if (!candidate.outer) return
            const [centerX, centerZ] = pointAlong(candidate.segment, candidate.along)
            const distance = Math.hypot(centerX - x, centerZ - z)
            if (distance < bestDistance) { best = index; bestDistance = distance }
        })
        return best
    }
    for (const { x, z } of o.entranceTargets) {
        const best = nearestOuterCandidate(x, z)
        if (best >= 0) placeEntrance(best)
    }
    // входы под пристройки к заданным точкам
    const targetAnnexEntrances: T_EntranceCandidate[] = []
    for (const { x, z } of o.annexTargets) {
        const best = nearestOuterCandidate(x, z)
        if (best >= 0) targetAnnexEntrances.push(placeEntrance(best))
    }

    const entranceCount = Math.max(0, Math.floor(o.entranceCount))
    // входы по entranceCount — из них выбираются места пристроек
    const spreadEntrances: T_EntranceCandidate[] = []
    for (let i = 0; i < entranceCount && candidates.length > 0; ++i) {
        const target = (i + .5) / entranceCount * perimeter
        let best = 0
        candidates.forEach((candidate, index) => {
            if (Math.abs(candidate.perimeterAt - target) < Math.abs(candidates[best].perimeterAt - target)) best = index
        })
        spreadEntrances.push(placeEntrance(best))
    }
    for (const segments of facadeLoops) for (const segment of segments) segment.holes.sort((a, b) => a[0] - b[0])

    // ---- пристройки у входов: группа малых комнат room02 в прямоугольнике по центру входа, от наружного лица стены наружу

    // запас прямоугольника по бокам от проёма и до соседней дыры
    const ANNEX_SIDE_MARGIN = .2
    // комнаты пристроек в плане, относительно pos
    const annexes: { contour: T_PlanPoint[], portals: T_Room02Portal[], height: number }[] = []
    const annexPolygons: A2[][] = []
    const roomPlans = plans.filter((_, room) => isValid[room])
    const annexCount = Math.max(0, Math.floor(o.annexCount))
    const annexDepth = Math.max(1, o.annexDepth)
    // главная комната — не выше комплекса и выше проёма
    const annexHeight = Math.min(Math.max(0, o.height), Math.max(o.annexHeight, portalHeight + .3))
    // свободно ли место под комнату: от оси плана наружное лицо стены отстоит на толщину стены — ближе комната
    // залезла бы в крыло; от комнат других пристроек — зазор
    const isClear = (polygon: A2[], others: A2[][]) =>
        roomPlans.every(plan => polygonsDistance(polygon, plan) > wallThickness - 1e-3)
        && others.every(other => polygonsDistance(polygon, other) > .5)
    // сначала заданные точки, потом входы по entranceCount — до annexCount пристроек
    let spreadAnnexes = 0
    const annexEntrances = [
        ...targetAnnexEntrances.map(entrance => ({ entrance, isTarget: true })),
        ...spreadEntrances.map(entrance => ({ entrance, isTarget: false })),
    ]
    for (const { entrance, isTarget } of annexEntrances) {
        if (!isTarget && spreadAnnexes >= annexCount) break
        const { edge, segment, width, along } = entrance
        // вход к заданной точке без пристройки убирается: дыра никуда не вела бы
        const dropEntrance = () => {
            if (!isTarget) return
            portals[edge.room][edge.edge] = { width: 0, at: .5, type: 'portal00' }
            segment.holes = segment.holes.filter(([from, to]) => Math.abs((from + to) / 2 - along) > 1e-6)
        }
        if (portalHeight <= 0) { dropEntrance(); continue }
        // не шире отрезка наружного контура и не заходит на соседние дыры
        let halfWidth = Math.min(Math.max(o.annexWidth, width + ANNEX_SIDE_MARGIN * 2) / 2, along, segment.length - along)
        for (const [from, to] of segment.holes) {
            if (Math.abs((from + to) / 2 - along) < 1e-6) continue
            halfWidth = Math.min(halfWidth, to <= along ? along - to - ANNEX_SIDE_MARGIN : from - along - ANNEX_SIDE_MARGIN)
        }
        if (halfWidth * 2 < width + ANNEX_SIDE_MARGIN * 2) { dropEntrance(); continue }

        // оси входа в план: u — по ходу отрезка наружного контура, v — наружу
        const entranceMiddle = pointAlong(segment, along)
        const toPlan = ([u, v]: A2): A2 => [
            entranceMiddle[0] + segment.direction[0] * u + segment.normal[0] * v,
            entranceMiddle[1] + segment.direction[1] * u + segment.normal[1] * v,
        ]
        // зерно — от места входа: на пересборке группа та же
        const random = _GM.seededRandom(Math.floor(_GM.hash2(Math.round(entranceMiddle[0] * 100), Math.round(entranceMiddle[1] * 100)) * 2147483647))
        const { main, children } = layoutAnnex(random, halfWidth, annexDepth, width, wallThickness, annexHeight, portalHeight)
        const mainPolygon = main.contour.map(toPlan)
        if (!isClear(mainPolygon, annexPolygons)) { dropEntrance(); continue }
        if (!isTarget) ++spreadAnnexes

        const groupPolygons = [mainPolygon]
        const placedRooms: T_AnnexRoom[] = []
        for (const { room, mainPortal } of children) {
            const polygon = room.contour.map(toPlan)
            if (!isClear(polygon, annexPolygons)) continue
            groupPolygons.push(polygon)
            placedRooms.push(room)
            main.portals.push(mainPortal)
        }
        placedRooms.unshift(main)
        annexPolygons.push(...groupPolygons)
        for (const room of placedRooms) {
            annexes.push({ contour: room.contour.map(toPlan).map(([x, z]) => ({ x, z })), portals: room.portals, height: room.height })
        }
        portals[edge.room][edge.edge].type = 'hole'
    }

    return { wallThickness, plans, isValid, links, innerPaths, portals, pilaster, annexes }
}

export const complex00 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }
    const { wallThickness, plans, isValid, links, innerPaths, portals, pilaster, annexes } = layoutComplex(o)
    const floorTop = Math.max(0, o.floorThickness)

    // ---- комнаты

    plans.forEach((_, room) => {
        if (!isValid[room]) return
        const path: T_PerimeterPoint[] = innerPaths[room].map(([x, z], edge) => ({
            x, z,
            portalWidth: portals[room][edge].width,
            portalAt: portals[room][edge].at,
            portalType: portals[room][edge].type,
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

    // ---- пристройки: room02 с полом на верху пола комплекса. Порталы главной комнаты уходят за её стены на толщину
    // стены — в дыру стены комплекса и через зазор к малым комнатам. Кладка — в тон комнат room00 изнутри

    for (const { contour, portals: roomPortals, height } of annexes) {
        _GM.mergeIndexedArrays(result, room02({
            pos: [o.pos[0], o.pos[1] + floorTop, o.pos[2]],
            contour,
            height,
            masonryTileSize: o.masonryTileSize,
            aoLength: o.aoLength,
            colorWall: [...ROOM_DEFAULT_OPTS.colorMasonry],
            portals: roomPortals,
            portalDepth: wallThickness,
            portalThickness: Math.max(.01, o.floorThickness),
        }))
    }

    // ---- оттенок всего комплекса: множитель цвета каждой вершины
    const tint = o.tint.map(channel => Math.min(1, Math.max(0, channel)))
    for (let i = 0; i < result.c.length; ++i) result.c[i] *= tint[i % 3]

    return result
}
