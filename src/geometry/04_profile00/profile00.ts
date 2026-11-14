import { _GM, type IBuffersGeom, type A2, type A3, type T_SweepProfilePoint } from "_CORE/_M/_gm"
import { RECT_WHITE } from "atlases/atlas00/atlas00"
import { RECT_AO_NONE, RECT_AO_TOP } from "atlases/atlasAo00/atlasAo00"

// Профиль: полоса стены с карнизом, протянутая вдоль пути в плане (см. ref.jpg).
//
// Сечение снизу вверх, точками (вынос от пути наружу, высота) — доли полной высоты, сняты с рисунка:
//   стена — по самому пути;
//   поясок — полочка, выступающая из стены, её лицо и верх, возвращающийся почти к стене;
//   скат — от пояска наружу и вверх, нависает;
//   карниз — софит (низ выноса), лицо карниза, верх карниза обратно к стене;
//   стена над карнизом — по самому пути.
// Весь профиль масштабируется по высоте height. Верх и низ открыты: полоса стыкуется с продолжением стены,
// крышек нет. Концы незамкнутого пути тоже открыты — срез поперёк крайнего ребра.
//
// Система координат. Точки пути — { x, z } относительно pos, pos[1] — низ полосы. Профиль всегда выступает
// вправо от хода пути, если смотреть сверху (x вправо, +z к зрителю), — по нормали ребра (−dz, dx).
// Направление пути задаёт сторону, фабрика его не разворачивает (правило скилла, «Геометрия вдоль пути»):
//   путь против часовой стрелки — профиль наружу (фасад здания, по умолчанию);
//   путь по часовой стрелке — профиль внутрь (карниз по периметру комнаты).
// Замкнутый путь (closed) — обход контура целиком.
//
// Атласы. uv — atlas00, белый тайл под цвет colorWall / colorMolding, растянут на каждый отрезок профиля.
// uv2 — atlasAo00: тень во внутренних углах профиля острее 120° (стена под пояском, верх пояска у ската,
// стена над карнизом) полосой aoLength по обе стороны угла; тупой угол ската к софиту — без тени.

type T_PathPoint = {
    x: number,
    z: number,
}

type T = {
    pos?: A3,             // начало координат пути; pos[1] — низ полосы
    path?: T_PathPoint[], // линия стены в плане; профиль выступает от неё наружу
    closed?: boolean,     // путь замкнут: последняя точка соединяется с первой
    height?: number,      // полная высота полосы; профиль масштабируется по ней целиком
    // длина, на которую растягивается тайл тени у внутреннего угла; видимая тень — примерно её четверть
    aoLength?: number,
    // базовые цвета до запечённого освещения; умножаются на тайл атласа
    colorWall?: A3,    // отрезки по самому пути — стена под и над карнизом
    colorMolding?: A3, // поясок, скат, карниз
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // стена вдоль x с выступом-эркером посередине, профиль смотрит в +z
    path: [{ x: -2, z: 0 }, { x: -.6, z: 0 }, { x: -.6, z: .8 }, { x: .6, z: .8 }, { x: .6, z: 0 }, { x: 2, z: 0 }],
    closed: false,
    height: 3,
    aoLength: .3,
    colorWall: [.85, .83, .78],
    colorMolding: [.75, .73, .7],
}

// Сечение в долях высоты: [вынос, высота]. Рисунок — 660 px по высоте, стена на x = 975 px
const PROFILE_FRACTIONS: { projection: number, y: number, isWall: boolean }[] = [
    { projection: 0, y: 0, isWall: true },               // низ стены
    { projection: 0, y: 310 / 660, isWall: false },      // стена до низа пояска
    { projection: 40 / 660, y: 310 / 660, isWall: false },  // низ пояска
    { projection: 40 / 660, y: 370 / 660, isWall: false },  // лицо пояска
    { projection: 10 / 660, y: 370 / 660, isWall: false },  // верх пояска, почти до стены; дальше скат
    { projection: 85 / 660, y: 450 / 660, isWall: false },  // верх ската; дальше софит
    { projection: 125 / 660, y: 450 / 660, isWall: false }, // край софита; дальше лицо карниза
    { projection: 125 / 660, y: 545 / 660, isWall: false }, // верх лица карниза; дальше верх карниза к стене
    { projection: 0, y: 545 / 660, isWall: true },       // стена над карнизом
    { projection: 0, y: 1, isWall: true },               // верх полосы
]
// наибольший вынос профиля в долях высоты
const MAX_PROJECTION_FRACTION = Math.max(...PROFILE_FRACTIONS.map(point => point.projection))

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)

    const height = rand(1, 5)
    // На вогнутом изломе пути профиль укорачивает ребро на вынос с каждой стороны — ребро не короче minEdge,
    // иначе грани вывернутся
    const minEdge = 2 * MAX_PROJECTION_FRACTION * height + .1
    const edge = () => rand(minEdge, minEdge + 2)

    let path: T_PathPoint[]
    let closed = false
    const shapeRoll = Math.random()
    if (shapeRoll < .25) {
        // прямая стена
        const length = edge()
        path = [{ x: -length / 2, z: 0 }, { x: length / 2, z: 0 }]
    } else if (shapeRoll < .5) {
        // угол: внешний (профиль снаружи)
        path = [{ x: -edge(), z: 0 }, { x: 0, z: 0 }, { x: 0, z: -edge() }]
    } else if (shapeRoll < .75) {
        // стена с эркером — вогнутые и выпуклые изломы
        const bayWidth = edge(), bayDepth = edge(), side = edge()
        path = [
            { x: -bayWidth / 2 - side, z: 0 }, { x: -bayWidth / 2, z: 0 }, { x: -bayWidth / 2, z: bayDepth },
            { x: bayWidth / 2, z: bayDepth }, { x: bayWidth / 2, z: 0 }, { x: bayWidth / 2 + side, z: 0 },
        ]
    } else {
        // обход здания: прямоугольник, иногда со срезанным углом
        const width = edge() + 1, depth = edge() + 1
        path = [{ x: -width / 2, z: depth / 2 }, { x: width / 2, z: depth / 2 }, { x: width / 2, z: -depth / 2 }, { x: -width / 2, z: -depth / 2 }]
        if (Math.random() < .5) {
            const cut = Math.min(width, depth) * .3
            path.splice(2, 1, { x: width / 2, z: -depth / 2 + cut }, { x: width / 2 - cut, z: -depth / 2 })
        }
        closed = true
    }
    // иногда — путь по часовой стрелке: профиль внутрь (карниз комнаты); вогнутые и выпуклые изломы меняются местами
    if (Math.random() < .3) path.reverse()

    return { path, closed, height, aoLength: rand(.15, .4) }
}

export const profile00 = (opts: T = {}): IBuffersGeom => {
    const { pos, path, closed, height, aoLength, colorWall, colorMolding }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const builder = _GM.createGeomBuilder()

    // ---- путь: без повторяющихся соседних точек; обход не меняется — он задаёт сторону профиля

    // точки пути в плане [x, z]
    const pathPoints: A2[] = []
    for (const { x, z } of path) {
        const last = pathPoints[pathPoints.length - 1]
        if (!last || Math.hypot(x - last[0], z - last[1]) > 1e-6) pathPoints.push([x, z])
    }
    // у замкнутого пути повтор первой точки в конце не нужен — замыкающее ребро добавляется само
    if (closed && pathPoints.length > 2) {
        const [firstX, firstZ] = pathPoints[0]
        const [lastX, lastZ] = pathPoints[pathPoints.length - 1]
        if (Math.hypot(firstX - lastX, firstZ - lastZ) < 1e-6) pathPoints.pop()
    }
    const isClosed = closed && pathPoints.length >= 3
    if (pathPoints.length < 2 || height <= 0) return builder.g
    const pointCount = pathPoints.length
    const edgeCount = isClosed ? pointCount : pointCount - 1
    const pointAt = (pointIndex: number): A2 => pathPoints[pointIndex % pointCount]

    // нормаль ребра в плане — вправо от хода: наружу у пути против часовой стрелки, внутрь — у пути по часовой
    const edgeNormals: A2[] = []
    for (let i = 0; i < edgeCount; ++i) {
        const [startX, startZ] = pointAt(i)
        const [endX, endZ] = pointAt(i + 1)
        const length = Math.hypot(endX - startX, endZ - startZ)
        edgeNormals.push([-(endZ - startZ) / length, (endX - startX) / length])
    }

    // Точка пути pointIndex, вынесенная наружу на distance. На изломе — по биссектрисе (ус), с такой длиной,
    // чтобы обе соседние грани отстояли от пути ровно на distance. На концах незамкнутого пути — по нормали
    // крайнего ребра: срез поперёк ребра
    const offsetPoint = (pointIndex: number, distance: number): A2 => {
        const [x, z] = pointAt(pointIndex)
        if (!isClosed && (pointIndex === 0 || pointIndex === pointCount - 1)) {
            const [normalX, normalZ] = edgeNormals[pointIndex === 0 ? 0 : edgeCount - 1]
            return [x + normalX * distance, z + normalZ * distance]
        }
        const index = pointIndex % pointCount
        const [normal1X, normal1Z] = edgeNormals[(index - 1 + edgeCount) % edgeCount]
        const [normal2X, normal2Z] = edgeNormals[index % edgeCount]
        // знаменатель — 1 + cos угла между нормалями; ограничен, чтобы на очень остром изломе ус не улетал
        const miterScale = distance / Math.max(.2, 1 + normal1X * normal2X + normal1Z * normal2Z)
        return [x + (normal1X + normal2X) * miterScale, z + (normal1Z + normal2Z) * miterScale]
    }

    // ---- профиль в метрах; цвет точки — у отрезка, который с неё начинается

    const profile: T_SweepProfilePoint[] = PROFILE_FRACTIONS.map(({ projection, y, isWall }) => ({
        projection: projection * height,
        y: y * height,
        color: isWall ? colorWall : colorMolding,
    }))

    // ---- грани: каждый отрезок профиля вдоль каждого ребра пути. Низ полосы не на земле — без тени у низа

    _GM.sweepProfile(builder, {
        profile, edgeCount, edgeNormals, offsetPoint,
        origin: pos, aoLength, shadowAtStart: false,
        uvRect: RECT_WHITE, aoRectNone: RECT_AO_NONE, aoRectShadow: RECT_AO_TOP,
    })

    // vCollide пустой: физика стены — у самой стены, профиль декоративный
    return builder.g
}
