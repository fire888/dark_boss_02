import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import { DEFAULT_PROFILE as PILASTER_DEFAULT_PROFILE, type T_PilasterProfile } from "geometry/01_pilaster00/pilaster00"
import { portalHeightFor, portalMarginFor, MIN_PORTAL_WIDTH, DEFAULT_OPTS as ROOM_DEFAULT_OPTS } from "geometry/05_room00/room00"
import {
    complex00, randomOpts as randomComplexOpts, DEFAULT_OPTS as COMPLEX_DEFAULT_OPTS,
} from "geometry/06_complex00/complex00"
import { tunnelBetweenHoles } from "geometry/05_room01/room01"

// Уровень из групп комнат, соединённых прямыми туннелями room01, — сначала главный путь вперёд, потом отростки вбок.
//
// Группа — complex00 без оболочки (shell: false): несколько смежных комнат, между соседями — порталы. Комнаты
// пристраиваются к свободным стенам уже стоящих комнат как попало, поэтому группа нелинейная: ветвится, у неё
// много наружных стен. Внутри группы пол на одном уровне; перепады — только в туннелях между группами.
//
// Главный путь. Первая группа входит наружной стеной в точку pos: середина дыры входа на наружном лице стены, игрок
// идёт в направлении heading. Из каждой группы главного пути выход — через наружную стену, лицо которой смотрит
// вперёд: не дальше headingSpread от forwardHeading (если таких нет — любая, что хоть как-то смотрит вперёд).
// Так путь поворачивает, но всегда идёт вперёд.
//
// Туннель всегда перпендикулярен обеим стенам: дыра выхода — по центру наружной стены (так ставит входы complex00,
// entranceTargets), туннель идёт по нормали стены, следующая группа ставится так, что одна из её наружных стен стоит
// ровно напротив, лицом назад, с дырой тоже по центру. Наружные стены с дырами берутся с запасом длины, чтобы
// complex00 не сужал проём: ширина дыры — ровно portalWidth. Длина туннеля — от tunnelLengthMin до tunnelLengthMax,
// перепад пола — от levelStepMin до levelStepMax вверх или вниз; если пандус круче tunnelSlopeMax, туннель длиннее.
//
// Отростки. Потом на свободных наружных стенах групп с вероятностью branchChance начинается отросток — туннель
// и группа поменьше, и так до branchDepth групп вглубь. Отростки тупиковые и выглядят как главный путь. Если задан
// выход (exitTunnel), отростки не заходят вперёд дальше выхода — место впереди остаётся следующему куску уровня.
//
// Ничто не пересекается в плане: комнаты (по наружному лицу стен), туннели и obstacles отстоят друг от друга
// хотя бы на clearance. Группа или туннель, которые не встают, пробуются заново в другой форме, на другой стене,
// другой длины. Раскладка сочиняется генератором от seed: одни и те же опции — одна и та же раскладка.
// layoutLevel00 отдаёт её без геометрии.
//
// Высота — своя у каждой группы, от height до height + heightSpread (внутри группы одна: так требует complex00);
// порталы у всех групп одной высоты — какая помещается при height, к ним подходят туннели. Размер комнат в плане —
// свой у каждой комнаты, масштаб от roomScaleMin до roomScaleMax. Пилястры у стен — у доли pilasterChance групп,
// у остальных стены гладкие (пилоны порталов есть везде). Стены, профиль пилястр, карниз — общие для всех.
// Оттенок tint — множитель цвета вершин всего после сборки.

type T = {
    pos?: A3,              // середина дыры входа первой группы на наружном лице стены; pos[1] — земля под её полом
    heading?: number,      // куда игрок входит в первую группу, радианы в плане: направление [cos, −sin] в [x, z]
    forwardHeading?: number, // направление главного пути — в ту же сторону смотрят стены выходов, радианы
    headingSpread?: number,  // на сколько лицо стены выхода может отклониться от forwardHeading, радианы
    seed?: number,           // зерно раскладки
    mainClusterCount?: number, // сколько групп комнат на главном пути
    mainRoomsMin?: number,     // комнат в группе главного пути — от и до
    mainRoomsMax?: number,
    branchRoomsMin?: number,   // комнат в группе отростка — от и до
    branchRoomsMax?: number,
    branchChance?: number,   // вероятность отростка на свободной наружной стене группы, от 0 до 1
    branchDepth?: number,    // сколько групп вглубь может уйти отросток
    entryHole?: boolean,     // дыра входа в первой группе — туда приходит туннель предыдущего куска
    exitTunnel?: boolean,    // выход из последней группы главного пути — дыра и туннель до точки layout.end
    obstacles?: A2[][],      // занятые места плана [x, z] относительно pos — выпуклые многоугольники
    clearance?: number,      // наименьший зазор в плане между комнатами разных групп, туннелями и obstacles
    tunnelLengthMin?: number, // длина туннеля между наружными лицами стен
    tunnelLengthMax?: number,
    levelStepMin?: number,    // перепад пола между группами на концах туннеля, вверх или вниз
    levelStepMax?: number,
    tunnelSlopeMax?: number,  // самый крутой пандус — подъём на метр пандуса
    tunnelFlatLength?: number, // горизонтальный участок туннеля у каждого конца, до пандуса
    tunnelCeilingRise?: number, // на сколько потолок туннеля выше дыры портала
    portalWidth?: number,    // ширина проёма портала — и между комнатами, и у туннелей
    height?: number,         // высота комнат в свету — самая низкая; у каждой группы своя, от height до height + heightSpread
    heightSpread?: number,   // разброс высоты групп вверх от height; порталы у всех групп одной высоты — по height
    roomScaleMin?: number,   // масштаб комнаты в плане — у каждой комнаты свой, от и до (1 — обычная, 2 — зал)
    roomScaleMax?: number,
    wallThickness?: number,  // толщина стен комнат
    floorThickness?: number, // толщина плиты пола — и в комнатах, и в туннелях
    ceilingThickness?: number, // толщина плиты потолка
    profileHeight?: number,  // высота полосы стены с карнизом под потолком; 0 — без неё
    portalHeight?: number,   // высота пилястр портала от пола до низа перемычки
    pilaster?: T_PilasterProfile, // тип пилястр — профиль pilaster00
    pilasterSpacing?: number,     // шаг пилястр вдоль стен; 0 — без пилястр у стен
    pilasterChance?: number,      // доля групп с пилястрами у стен, от 0 до 1; у остальных стены гладкие
    pilasterWidth?: number,       // ширина ствола пилястры у стены
    pilasterProtrusion?: number,  // на сколько ствол выступает из стены в комнату
    aoLength?: number,            // длина, на которую растягивается тайл тени у угла стены с полом и потолком
    colorWall?: A3,               // базовый цвет стен комнат до запечённого освещения
    colorTunnel?: A3,             // базовый цвет кладки туннелей до запечённого освещения
    tint?: A3,                    // множитель цвета вершин всего, компоненты от 0 до 1
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    heading: 0,
    forwardHeading: 0,
    headingSpread: .9,
    seed: 1,
    mainClusterCount: 3,
    mainRoomsMin: 3,
    mainRoomsMax: 5,
    branchRoomsMin: 1,
    branchRoomsMax: 3,
    branchChance: .3,
    branchDepth: 1,
    entryHole: false,
    exitTunnel: false,
    obstacles: [],
    clearance: 1.5,
    tunnelLengthMin: 8,
    tunnelLengthMax: 14,
    levelStepMin: 3,
    levelStepMax: 8,
    tunnelSlopeMax: .7,
    tunnelFlatLength: 1,
    tunnelCeilingRise: 1,
    portalWidth: COMPLEX_DEFAULT_OPTS.portalWidth,
    height: COMPLEX_DEFAULT_OPTS.height,
    heightSpread: 4,
    roomScaleMin: .6,
    roomScaleMax: 1.8,
    wallThickness: COMPLEX_DEFAULT_OPTS.wallThickness,
    floorThickness: COMPLEX_DEFAULT_OPTS.floorThickness,
    ceilingThickness: COMPLEX_DEFAULT_OPTS.ceilingThickness,
    profileHeight: COMPLEX_DEFAULT_OPTS.profileHeight,
    portalHeight: COMPLEX_DEFAULT_OPTS.portalHeight,
    pilaster: { ...PILASTER_DEFAULT_PROFILE },
    pilasterSpacing: COMPLEX_DEFAULT_OPTS.pilasterSpacing,
    pilasterChance: .5,
    pilasterWidth: COMPLEX_DEFAULT_OPTS.pilasterWidth,
    pilasterProtrusion: COMPLEX_DEFAULT_OPTS.pilasterProtrusion,
    aoLength: COMPLEX_DEFAULT_OPTS.aoLength,
    colorWall: [...COMPLEX_DEFAULT_OPTS.colorWall],
    colorTunnel: [...ROOM_DEFAULT_OPTS.colorMasonry],
    tint: [...COMPLEX_DEFAULT_OPTS.tint],
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    // общие высоты, стены и пилястры — из случайного комплекса
    const base = randomComplexOpts()
    const levelStepMin = rand(0, 4)
    const mainRoomsMin = 1 + Math.floor(Math.random() * 3)
    const branchRoomsMin = 1 + Math.floor(Math.random() * 2)
    const roomScaleMin = rand(.5, 1)
    return {
        heightSpread: Math.random() < .2 ? 0 : rand(0, 6),
        roomScaleMin,
        roomScaleMax: roomScaleMin + rand(0, 1.5),
        pilasterChance: Math.random(),
        heading: rand(-.5, .5),
        forwardHeading: rand(-.3, .3),
        headingSpread: rand(.4, 1.1),
        seed: Math.floor(Math.random() * 1e9),
        mainClusterCount: 1 + Math.floor(Math.random() * 4),
        mainRoomsMin,
        mainRoomsMax: mainRoomsMin + Math.floor(Math.random() * 3),
        branchRoomsMin,
        branchRoomsMax: branchRoomsMin + Math.floor(Math.random() * 2),
        branchChance: rand(0, .5),
        branchDepth: Math.floor(Math.random() * 3),
        entryHole: Math.random() < .5,
        exitTunnel: Math.random() < .5,
        clearance: rand(.5, 3),
        tunnelLengthMin: rand(4, 10),
        tunnelLengthMax: rand(10, 20),
        levelStepMin,
        levelStepMax: levelStepMin + rand(0, 6),
        tunnelSlopeMax: rand(.3, .8),
        tunnelFlatLength: rand(0, 3),
        tunnelCeilingRise: Math.random() < .3 ? 0 : rand(0, 1.5),
        portalWidth: base.portalWidth,
        height: base.height,
        wallThickness: base.wallThickness,
        floorThickness: base.floorThickness,
        ceilingThickness: base.ceilingThickness,
        profileHeight: base.profileHeight,
        portalHeight: base.portalHeight,
        pilaster: base.pilaster,
        pilasterSpacing: base.pilasterSpacing,
        pilasterWidth: base.pilasterWidth,
        pilasterProtrusion: base.pilasterProtrusion,
        aoLength: base.aoLength,
        colorWall: base.colorWall,
        colorTunnel: [rand(.2, .85), rand(.2, .8), rand(.3, .85)],
        tint: base.tint,
    }
}

// ---- раскладка

// наружная стена группы: ребро edge комнаты room плана, без соседа
export type T_Level00Wall = {
    room: number, edge: number,
    length: number,  // длина ребра плана (оси стены)
    direction: A2,   // единичное направление ребра
    normal: A2,      // наружу — вправо от хода ребра
    middle: A2,      // середина ребра плана
}

export type T_Level00Cluster = {
    plans: A2[][],   // комнаты — оси стен [x, z] относительно pos, выпуклые, против часовой стрелки сверху; как rooms complex00
    level: number,   // земля под полом относительно pos[1]
    height: number,  // высота комнат группы в свету
    hasPilasters: boolean, // пилястры у стен (у порталов — всегда)
    walls: T_Level00Wall[],     // наружные стены
    holes: T_Level00Wall[],     // наружные стены с дырой портала по центру
    outlines: A2[][],             // комнаты по наружному лицу стен — место группы в плане
    roomCenters: A2[],            // середины комнат в плане
    entryRoom: number,            // комната, в которую входит туннель, ведущий к группе
    isMain: boolean,              // на главном пути
}

export type T_Level00Tunnel = {
    entryStart: A3, entryEnd: A3, // края дыры у начала; y — верх пола, относительно pos
    exitStart: A3, exitEnd: A3,   // края дыры у конца — или края выхода, если туннель ведёт из куска
    outline: A2[],                // место туннеля в плане
}

export type T_Level00Layout = {
    clusters: T_Level00Cluster[],
    tunnels: T_Level00Tunnel[],
    // куда ведёт выход (exitTunnel): середина конца туннеля, земля под полом и направление дальше.
    // Следующий кусок ставится сюда: pos = point, heading = heading
    end: { point: A3, heading: number } | null,
    outlines: A2[][],  // всё, что занято в плане: комнаты и туннели — obstacles для следующих кусков
}

// направление в плане по углу и обратно
const directionOf = (heading: number): A2 => [Math.cos(heading), -Math.sin(heading)]
const headingOf = ([x, z]: A2): number => Math.atan2(-z, x)

// Расстояние между выпуклыми многоугольниками: 0, если пересекаются (нет разделяющей оси среди нормалей рёбер),
// иначе наименьшее расстояние от вершины одного до ребра другого
const convexDistance = (polygonA: A2[], polygonB: A2[]): number => {
    const separated = (first: A2[], second: A2[]) => {
        for (let i = 0; i < first.length; ++i) {
            const [startX, startZ] = first[i], [endX, endZ] = first[(i + 1) % first.length]
            const axisX = -(endZ - startZ), axisZ = endX - startX
            let minFirst = Infinity, maxFirst = -Infinity, minSecond = Infinity, maxSecond = -Infinity
            for (const [x, z] of first) { const p = x * axisX + z * axisZ; minFirst = Math.min(minFirst, p); maxFirst = Math.max(maxFirst, p) }
            for (const [x, z] of second) { const p = x * axisX + z * axisZ; minSecond = Math.min(minSecond, p); maxSecond = Math.max(maxSecond, p) }
            if (maxFirst < minSecond || maxSecond < minFirst) return true
        }
        return false
    }
    if (!separated(polygonA, polygonB) && !separated(polygonB, polygonA)) return 0
    const pointSegment = ([x, z]: A2, [startX, startZ]: A2, [endX, endZ]: A2) => {
        const dx = endX - startX, dz = endZ - startZ
        const lengthSquared = dx * dx + dz * dz
        const t = lengthSquared > 0 ? Math.max(0, Math.min(1, ((x - startX) * dx + (z - startZ) * dz) / lengthSquared)) : 0
        return Math.hypot(x - startX - dx * t, z - startZ - dz * t)
    }
    let distance = Infinity
    for (const [points, others] of [[polygonA, polygonB], [polygonB, polygonA]]) {
        for (const point of points) for (let i = 0; i < others.length; ++i) {
            distance = Math.min(distance, pointSegment(point, others[i], others[(i + 1) % others.length]))
        }
    }
    return distance
}

// контур выпуклого многоугольника, раздвинутый на offset, — ус по биссектрисе, как у наружного лица room00
const offsetOutline = (path: A2[], offset: number): A2[] => {
    const count = path.length
    const normals: A2[] = path.map((start, i) => {
        const end = path[(i + 1) % count]
        const length = Math.hypot(end[0] - start[0], end[1] - start[1]) || 1
        return [-(end[1] - start[1]) / length, (end[0] - start[0]) / length]
    })
    return path.map(([x, z], i) => {
        const [normal1X, normal1Z] = normals[(i - 1 + count) % count]
        const [normal2X, normal2Z] = normals[i]
        const miterScale = offset / Math.max(.2, 1 + normal1X * normal2X + normal1Z * normal2Z)
        return [x + (normal1X + normal2X) * miterScale, z + (normal1Z + normal2Z) * miterScale]
    })
}

const centerOf = (path: A2[]): A2 => {
    let x = 0, z = 0
    for (const point of path) { x += point[0]; z += point[1] }
    return [x / path.length, z / path.length]
}

// наружные стены плана группы: рёбра, которые не повторяет навстречу другая комната
const exteriorWalls = (plans: A2[][]): T_Level00Wall[] => {
    const SAME_POINT = 1e-6
    const same = (p: A2, q: A2) => Math.abs(p[0] - q[0]) <= SAME_POINT && Math.abs(p[1] - q[1]) <= SAME_POINT
    const walls: T_Level00Wall[] = []
    plans.forEach((plan, room) => plan.forEach((start, edge) => {
        const end = plan[(edge + 1) % plan.length]
        const isShared = plans.some((other, otherRoom) => otherRoom !== room &&
            other.some((otherStart, k) => same(otherStart, end) && same(other[(k + 1) % other.length], start)))
        if (isShared) return
        const length = Math.hypot(end[0] - start[0], end[1] - start[1])
        const direction: A2 = [(end[0] - start[0]) / length, (end[1] - start[1]) / length]
        walls.push({
            room, edge, length, direction,
            normal: [-direction[1], direction[0]],
            middle: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
        })
    }))
    return walls
}

export const layoutLevel00 = (opts: T = {}): T_Level00Layout => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const random = _GM.seededRandom(o.seed)
    const rand = (min: number, max: number) => min + random() * (max - min)
    const randomInt = (min: number, max: number) => Math.round(min) + Math.floor(random() * (Math.max(0, Math.round(max) - Math.round(min)) + 1))
    const shuffled = <V>(values: V[]): V[] => {
        const copy = [...values]
        for (let i = copy.length - 1; i > 0; --i) {
            const k = Math.floor(random() * (i + 1));
            [copy[i], copy[k]] = [copy[k], copy[i]]
        }
        return copy
    }

    const pilaster: T_PilasterProfile = { ...PILASTER_DEFAULT_PROFILE, ...o.pilaster }
    const wallThickness = Math.max(.05, o.wallThickness)
    const clearance = Math.max(0, o.clearance)
    // туннель и соседняя комната той же группы у стены с дырой — только бы не пересекались
    const TOUCH = .05
    const holeWidth = Math.max(o.portalWidth, MIN_PORTAL_WIDTH)
    // Стена с дырой по центру: дыра и по пилону с выносом с каждой стороны (тот же расчёт, что в complex00) и запас
    // на сдвиг концов внутреннего лица у общих стен соседних комнат — тогда complex00 не сужает проём
    const minWallForHole = holeWidth + (portalMarginFor(pilaster) + .01) * 2 + wallThickness * 2 + .1
    const forward = directionOf(o.forwardHeading)
    const cosSpread = Math.cos(Math.max(0, o.headingSpread))
    const tunnelLengthMin = Math.max(.5, Math.min(o.tunnelLengthMin, o.tunnelLengthMax))
    const tunnelLengthMax = Math.max(tunnelLengthMin, o.tunnelLengthMax)
    const levelStepMin = Math.max(0, Math.min(o.levelStepMin, o.levelStepMax))
    const levelStepMax = Math.max(levelStepMin, o.levelStepMax)
    const flatLength = Math.max(0, o.tunnelFlatLength)
    const slopeMax = Math.max(.05, o.tunnelSlopeMax)
    const floorTop = Math.max(0, o.floorThickness)

    const clusters: T_Level00Cluster[] = []
    const tunnels: T_Level00Tunnel[] = []
    // всё занятое в плане: чьё (группа и комната, null — туннель или obstacles) и где
    type T_Occupied = { polygon: A2[], cluster: T_Level00Cluster | null, room: number }
    const occupied: T_Occupied[] = o.obstacles.filter(polygon => polygon.length >= 3)
        .map(polygon => ({ polygon, cluster: null, room: -1 }))
    // свободно ли место: skip — что не проверять, touch — что проверять только на пересечение
    const fits = (polygon: A2[], skip: (other: T_Occupied) => boolean = () => false,
        touch: (other: T_Occupied) => boolean = () => false) =>
        occupied.every(other => skip(other) || convexDistance(polygon, other.polygon) >= (touch(other) ? TOUCH : clearance))

    // ---- форма группы — по правилам complex00: первая комната — прямоугольник или выпуклый многоугольник,
    // остальные пристраиваются к свободному ребру стоящей комнаты (общее ребро — те же точки навстречу),
    // боковые стороны под прямым углом или сходятся внутрь, дальняя сторона — прямая или щипец. От всех комнат,
    // кроме той, к которой пристроена, — запас на две стены: точек на три комнаты нет

    // у каждой комнаты свой масштаб: от каморки до зала
    const roomScaleMin = Math.max(.3, Math.min(o.roomScaleMin, o.roomScaleMax))
    const roomScaleMax = Math.max(roomScaleMin, o.roomScaleMax)
    const roomScale = () => rand(roomScaleMin, roomScaleMax)
    const randomPlans = (roomCount: number): A2[][] => {
        const plans: A2[][] = []
        const firstScale = roomScale()
        if (random() < .5) {
            // прямоугольник — то вытянутый, то почти квадратный
            const width = rand(8, 18) * firstScale, depth = rand(7, 14) * firstScale
            plans.push([[-width / 2, depth / 2], [width / 2, depth / 2], [width / 2, -depth / 2], [-width / 2, -depth / 2]])
        } else {
            const pointCount = 5 + Math.floor(random() * 2)
            const radius = rand(6.5, 10) * firstScale
            const first: A2[] = []
            // против часовой стрелки сверху: в осях [x, −z] угол растёт
            for (let i = 0; i < pointCount; ++i) {
                const angle = (i + rand(-.12, .12)) / pointCount * Math.PI * 2
                first.push([Math.cos(angle) * radius, -Math.sin(angle) * radius])
            }
            plans.push(first)
        }
        const MIN_SHARED_EDGE = 6
        const usedEdges = new Set<string>()
        for (let attempt = 0; attempt < 200 && plans.length < roomCount; ++attempt) {
            const parentIndex = Math.floor(random() * plans.length)
            const parent = plans[parentIndex]
            const edge = Math.floor(random() * parent.length)
            const key = `${parentIndex}:${edge}`
            if (usedEdges.has(key)) continue
            const start = parent[edge], end = parent[(edge + 1) % parent.length]
            const length = Math.hypot(end[0] - start[0], end[1] - start[1])
            if (length < MIN_SHARED_EDGE) continue
            const direction: A2 = [(end[0] - start[0]) / length, (end[1] - start[1]) / length]
            const normal: A2 = [-direction[1], direction[0]]
            const depth = rand(6, 14) * roomScale()
            const taperStart = random() < .5 ? 0 : rand(0, length * .2)
            const taperEnd = random() < .5 ? 0 : rand(0, length * .2)
            const at = (from: A2, alongNormal: number, alongEdge: number): A2 =>
                [from[0] + normal[0] * alongNormal + direction[0] * alongEdge, from[1] + normal[1] * alongNormal + direction[1] * alongEdge]
            const farStart = at(start, depth, taperStart)
            const farEnd = at(end, depth, -taperEnd)
            const plan: A2[] = [end, start, farStart]
            if (random() < .3) {
                const middle: A2 = [(farStart[0] + farEnd[0]) / 2, (farStart[1] + farEnd[1]) / 2]
                plan.push(at(middle, rand(2, 5), 0))
            }
            plan.push(farEnd)
            const tooClose = plans.some((other, index) =>
                index !== parentIndex && convexDistance(plan, other) < wallThickness * 2 + 1.5)
            if (tooClose) continue
            usedEdges.add(key)
            usedEdges.add(`${plans.length}:0`)
            plans.push(plan)
        }
        return plans
    }
    // запасная группа — одна квадратная комната, в каждую стену которой помещается дыра
    const fallbackPlans = (): A2[][] => {
        const half = Math.max(5, minWallForHole / 2 + .5)
        return [[[-half, half], [half, half], [half, -half], [-half, -half]]]
    }

    // высота группы — от height до height + heightSpread
    const clusterHeight = () => o.height + rand(0, Math.max(0, o.heightSpread))
    // пилястры у стен — у части групп
    const pilasterChance = Math.max(0, Math.min(1, o.pilasterChance))

    // Группа, которая встаёт наружной стеной на точку anchor (середина дыры на наружном лице), лицом против
    // direction. leadTunnel — туннель, что к ней ведёт: его касается комната входа, с остальными он не пересекается
    // allowShrink — с неудачами группа становится меньше, последняя попытка — запасная комната; иначе только roomCount
    const placeCluster = (anchor: A2, direction: A2, level: number, roomCount: number, leadTunnel: A2[] | null,
        isMain: boolean, mustFit: (outline: A2[]) => boolean, allowShrink: boolean, force = false): T_Level00Cluster | null => {
        const ATTEMPTS = allowShrink ? 12 : 6
        for (let attempt = 0; attempt <= ATTEMPTS; ++attempt) {
            const isLast = attempt === ATTEMPTS
            if (isLast && !allowShrink) break
            const shapePlans = isLast ? fallbackPlans()
                : randomPlans(allowShrink ? Math.max(1, roomCount - Math.floor(attempt / 4)) : roomCount)
            const entries = exteriorWalls(shapePlans).filter(wall => wall.length >= minWallForHole)
            if (!entries.length) continue
            const entry = entries[Math.floor(random() * entries.length)]
            // поворот: нормаль стены входа — против direction; сдвиг: середина дыры на наружном лице — в anchor
            const angle = Math.atan2(-direction[1], -direction[0]) - Math.atan2(entry.normal[1], entry.normal[0])
            const cos = Math.cos(angle), sin = Math.sin(angle)
            const place = ([x, z]: A2): A2 => {
                const dx = x - entry.middle[0], dz = z - entry.middle[1]
                return [anchor[0] + dx * cos - dz * sin + direction[0] * wallThickness, anchor[1] + dx * sin + dz * cos + direction[1] * wallThickness]
            }
            const plans = shapePlans.map(plan => plan.map(place))
            const outlines = plans.map(plan => offsetOutline(plan, wallThickness))
            const isFree = outlines.every((outline, room) =>
                fits(outline, other => other.polygon === leadTunnel) &&
                (!leadTunnel || room === entry.room || convexDistance(outline, leadTunnel) >= TOUCH) &&
                mustFit(outline))
            if (!isFree && !(force && isLast)) continue
            const walls = exteriorWalls(plans)
            const entryWall = walls.find(wall => wall.room === entry.room && wall.edge === entry.edge)!
            return {
                plans, level, height: clusterHeight(), hasPilasters: random() < pilasterChance, walls, holes: [entryWall], outlines,
                roomCenters: plans.map(centerOf), entryRoom: entry.room, isMain,
            }
        }
        return null
    }

    // Туннель из наружной стены wall группы cluster и группа на его конце (или только туннель — выход куска).
    // Дыра — по центру стены, туннель — по её нормали
    const growFrom = (cluster: T_Level00Cluster, wall: T_Level00Wall, roomCount: number, isMain: boolean,
        withCluster: boolean, mustFit: (outline: A2[]) => boolean, allowShrink: boolean, force = false) => {
        const { direction, normal, middle } = wall
        const holeMiddle: A2 = [middle[0] + normal[0] * wallThickness, middle[1] + normal[1] * wallThickness]
        const halfHole: A2 = [direction[0] * holeWidth / 2, direction[1] * holeWidth / 2]
        const holeStart: A2 = [holeMiddle[0] - halfHole[0], holeMiddle[1] - halfHole[1]]
        const holeEnd: A2 = [holeMiddle[0] + halfHole[0], holeMiddle[1] + halfHole[1]]
        const TRIES = 4
        for (let attempt = 0; attempt < TRIES; ++attempt) {
            const isLast = attempt === TRIES - 1
            const levelStep = rand(levelStepMin, levelStepMax) * (random() < .5 ? -1 : 1)
            const length = Math.max(rand(tunnelLengthMin, tunnelLengthMax), Math.abs(levelStep) / slopeMax + flatLength * 2)
            const along: A2 = [normal[0] * length, normal[1] * length]
            const tunnelOutline: A2[] = [holeStart, holeEnd, [holeEnd[0] + along[0], holeEnd[1] + along[1]], [holeStart[0] + along[0], holeStart[1] + along[1]]]
            // стену с дырой туннель касается, соседние комнаты той же группы — не задевает
            const tunnelFits = fits(tunnelOutline,
                other => other.cluster === cluster && other.room === wall.room,
                other => other.cluster === cluster) && mustFit(tunnelOutline)
            if (!tunnelFits && !(force && isLast)) continue
            const end: A2 = [holeMiddle[0] + along[0], holeMiddle[1] + along[1]]
            const level = cluster.level + levelStep
            let next: T_Level00Cluster | null = null
            if (withCluster) {
                next = placeCluster(end, normal, level, roomCount, tunnelOutline, isMain, mustFit, allowShrink)
                if (!next) continue
            }
            // встало — занимаем
            cluster.holes.push(wall)
            occupied.push({ polygon: tunnelOutline, cluster: null, room: -1 })
            tunnels.push({
                entryStart: [holeStart[0], cluster.level + floorTop, holeStart[1]],
                entryEnd: [holeEnd[0], cluster.level + floorTop, holeEnd[1]],
                exitStart: [end[0] - halfHole[0], level + floorTop, end[1] - halfHole[1]],
                exitEnd: [end[0] + halfHole[0], level + floorTop, end[1] + halfHole[1]],
                outline: tunnelOutline,
            })
            if (next) addCluster(next)
            return { cluster: next, end, level }
        }
        return null
    }

    const addCluster = (cluster: T_Level00Cluster) => {
        clusters.push(cluster)
        cluster.outlines.forEach((polygon, room) => occupied.push({ polygon, cluster, room }))
    }

    // стены, в которые ещё можно врезать дыру; у первой группы без дыры входа стена входа тоже занята —
    // у входа пусто
    const blockedWalls = new Set<T_Level00Wall>()
    const freeWalls = (cluster: T_Level00Cluster) => cluster.walls.filter(wall =>
        wall.length >= minWallForHole && !cluster.holes.includes(wall) && !blockedWalls.has(wall))
    const forwardness = (wall: T_Level00Wall) => wall.normal[0] * forward[0] + wall.normal[1] * forward[1]
    // Стены для выхода главного пути: в пределах headingSpread — вперемешку; потом остальные, что хоть как-то
    // смотрят вперёд, лучшие сначала
    const forwardWalls = (walls: T_Level00Wall[]) => [
        ...shuffled(walls.filter(wall => forwardness(wall) >= cosSpread)),
        ...walls.filter(wall => forwardness(wall) < cosSpread && forwardness(wall) > .05)
            .sort((a, b) => forwardness(b) - forwardness(a)),
    ]
    const mainRooms = () => randomInt(Math.max(1, o.mainRoomsMin), Math.max(1, o.mainRoomsMin, o.mainRoomsMax))
    const branchRooms = () => randomInt(Math.max(1, o.branchRoomsMin), Math.max(1, o.branchRoomsMin, o.branchRoomsMax))

    // ---- главный путь

    // Туннель предыдущего куска приходит в точку входа и лежит в obstacles: его касается комната входа — он ведущий
    const NEAR_ENTRY = .01
    const entryMark: A2[] = [[-NEAR_ENTRY, -NEAR_ENTRY], [NEAR_ENTRY, -NEAR_ENTRY], [NEAR_ENTRY, NEAR_ENTRY], [-NEAR_ENTRY, NEAR_ENTRY]]
    const entryTunnel = o.entryHole
        ? occupied.find(other => convexDistance(entryMark, other.polygon) < NEAR_ENTRY * 2)?.polygon ?? null
        : null
    const first = placeCluster([0, 0], directionOf(o.heading), 0, mainRooms(), entryTunnel, true, () => true, true, true)
    if (!first) return { clusters, tunnels, end: null, outlines: [] }
    addCluster(first)
    if (!o.entryHole) {
        blockedWalls.add(first.holes[0])
        first.holes = []
    }

    let last = first
    const clusterCount = Math.max(1, Math.round(o.mainClusterCount))
    for (let i = 1; i < clusterCount; ++i) {
        // сначала группа во весь размер у любой из стен, и только потом — меньше
        let grown: T_Level00Cluster | null = null
        const roomCount = mainRooms()
        for (const allowShrink of [false, true]) {
            for (const wall of forwardWalls(freeWalls(last))) {
                grown = growFrom(last, wall, roomCount, true, true, () => true, allowShrink)?.cluster ?? null
                if (grown) break
            }
            if (grown) break
        }
        if (!grown) break
        last = grown
    }

    // ---- выход: туннель из последней группы, впереди — свободное место под первую группу следующего куска

    let end: T_Level00Layout['end'] = null
    const RESERVE = 30
    const reserveAhead = (point: A2, direction: A2): A2[] => {
        const side: A2 = [-direction[1] * RESERVE / 2, direction[0] * RESERVE / 2]
        const far: A2 = [point[0] + direction[0] * RESERVE, point[1] + direction[1] * RESERVE]
        return [[point[0] - side[0], point[1] - side[1]], [point[0] + side[0], point[1] + side[1]],
            [far[0] + side[0], far[1] + side[1]], [far[0] - side[0], far[1] - side[1]]]
    }
    if (o.exitTunnel) {
        const forwardExits = forwardWalls(freeWalls(last))
        const exits = forwardExits.length ? forwardExits : freeWalls(last)
        for (let k = 0; k < exits.length && !end; ++k) {
            const wall = exits[k]
            const isLastChance = k === exits.length - 1
            const grown = growFrom(last, wall, 0, true, false, outline => {
                // туннель выхода и место впереди него не должны задевать ничего
                const ahead = reserveAhead([(outline[2][0] + outline[3][0]) / 2, (outline[2][1] + outline[3][1]) / 2], wall.normal)
                return isLastChance || fits(ahead, other => other.polygon === outline)
            }, false, isLastChance)
            if (grown) {
                end = { point: [grown.end[0], grown.level, grown.end[1]], heading: headingOf(wall.normal) }
                occupied.push({ polygon: reserveAhead(grown.end, wall.normal), cluster: null, room: -1 })
            }
        }
    }

    // ---- отростки: только позади выхода, если он есть

    const endProjection = end ? end.point[0] * forward[0] + end.point[2] * forward[1] : Infinity
    const behindExit = (outline: A2[]) => outline.every(([x, z]) => x * forward[0] + z * forward[1] <= endProjection)
    const branchDepth = Math.max(0, Math.round(o.branchDepth))
    const branchChance = Math.max(0, Math.min(1, o.branchChance))
    const growBranches = (cluster: T_Level00Cluster, depth: number) => {
        if (depth >= branchDepth) return
        for (const wall of shuffled(freeWalls(cluster))) {
            if (random() >= branchChance) continue
            const grown = growFrom(cluster, wall, branchRooms(), false, true, behindExit, true)?.cluster
            if (grown) growBranches(grown, depth + 1)
        }
    }
    for (const cluster of clusters.filter(cluster => cluster.isMain)) growBranches(cluster, 0)

    const outlines = [...clusters.flatMap(cluster => cluster.outlines), ...tunnels.map(tunnel => tunnel.outline)]
    return { clusters, tunnels, end, outlines }
}

export const level00 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }
    const pilaster: T_PilasterProfile = { ...PILASTER_DEFAULT_PROFILE, ...o.pilaster }
    const wallThickness = Math.max(.05, o.wallThickness)
    const layout = layoutLevel00(o)
    // Портал — по самой низкой высоте height, одинаковый во всех группах: туннели подходят к дырам этой высоты.
    // Если по height портал не помещается — порталов нет нигде (и туннелей), группы получают то, что просили
    const portalHeight = portalHeightFor(pilaster, o.height, o.profileHeight, o.portalHeight)

    for (const cluster of layout.clusters) {
        _GM.mergeIndexedArrays(result, complex00({
            pos: [o.pos[0], o.pos[1] + cluster.level, o.pos[2]],
            rooms: cluster.plans.map(plan => ({ points: plan.map(([x, z]) => ({ x, z })) })),
            shell: false,
            // вход — к середине дыры на наружном лице: complex00 выберет эту же стену и поставит проём по её центру
            entranceTargets: cluster.holes.map(({ middle, normal }) => ({
                x: middle[0] + normal[0] * wallThickness, z: middle[1] + normal[1] * wallThickness,
            })),
            entranceCount: 0,
            portalWidth: o.portalWidth,
            height: cluster.height,
            wallThickness: o.wallThickness,
            floorThickness: o.floorThickness,
            ceilingThickness: o.ceilingThickness,
            profileHeight: o.profileHeight,
            portalHeight: portalHeight > 0 ? portalHeight : o.portalHeight,
            pilaster,
            pilasterSpacing: cluster.hasPilasters ? o.pilasterSpacing : 0,
            pilasterWidth: o.pilasterWidth,
            pilasterProtrusion: o.pilasterProtrusion,
            aoLength: o.aoLength,
            colorWall: o.colorWall,
            tint: [1, 1, 1],
        }))
    }

    if (portalHeight > 0) {
        for (const tunnel of layout.tunnels) {
            _GM.mergeIndexedArrays(result, tunnelBetweenHoles({
                pos: o.pos,
                entryStart: tunnel.entryStart, entryEnd: tunnel.entryEnd,
                exitStart: tunnel.exitStart, exitEnd: tunnel.exitEnd,
                portalHeight, ceilingRise: o.tunnelCeilingRise, flatLength: o.tunnelFlatLength,
                floorThickness: Math.max(0, o.floorThickness), ceilingThickness: o.ceilingThickness,
                aoLength: o.aoLength, colorTunnel: o.colorTunnel,
            }))
        }
    }

    // ---- оттенок всего: множитель цвета каждой вершины
    const tint = o.tint.map(channel => Math.min(1, Math.max(0, channel)))
    for (let i = 0; i < result.c.length; ++i) result.c[i] *= tint[i % 3]

    return result
}
