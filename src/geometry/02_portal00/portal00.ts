import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import {
    pilaster00, DEFAULT_PROFILE as PILASTER_DEFAULT_PROFILE, randomProfile as randomPilasterProfile,
    type T_PilasterProfile,
} from "geometry/01_pilaster00/pilaster00"
import {
    lintel00, DEFAULT_PROFILE as LINTEL_DEFAULT_PROFILE, randomProfile as randomLintelProfile,
    type T_LintelProfile,
} from "geometry/03_lintel00/lintel00"

// Портал: обрамление проёма в толстой стене (см. ref.jpg) — по пилону-пилястре на каждом откосе и перемычка сверху.
//
// Проём задаётся четырьмя точками в плане (как на рефе):
//   1 — 2  передняя плоскость стены (1 слева, 2 справа),
//   4 — 3  задняя плоскость стены,
//   1 — 4  левый откос, 2 — 3 — правый. Четырёхугольник может быть косым: стены и откосы не обязаны быть
//   перпендикулярны. Точки — лицо стволов пилястр, то есть чистый проём между ними.
//
// Пилон — pilaster00, у которого путь обходит откос: выходит из передней плоскости стены на pierWidth от проёма,
// выступает из неё на pierProtrusion, идёт к проёму, вдоль откоса насквозь, выступает из задней плоскости
// и уходит обратно в стену. База и капитель обходят пилон с трёх сторон; профиль у стены срезан по её плоскости.
//
// Перемычка — lintel00 на высоте height (верх абаки), меньше абак: край карниза отступает от края абаки
// на lintelInset с обеих сторон стены и по бокам пилонов, над проёмом — софит.
//
// Система координат: точки — { x, z } относительно pos, pos[1] — земля. Стену портал не строит.

type T_PlanPoint = {
    x: number,
    z: number,
}

type T = {
    pos?: A3,               // начало координат точек; pos[1] — уровень земли
    points?: T_PlanPoint[], // углы проёма в плане: 1, 2 — передняя плоскость стены, 3, 4 — задняя (см. выше)
    height?: number,        // высота пилястр от земли до верха абаки — низ перемычки
    pierWidth?: number,      // ширина пилона вдоль стены: на сколько ствол заходит в стену от откоса
    pierProtrusion?: number, // на сколько ствол пилона выступает из каждой плоскости стены
    // на сколько перемычка целиком, вместе с карнизом, отступает внутрь от края абаки: верх капители виден по контуру
    lintelInset?: number,
    pilaster?: T_PilasterProfile, // тип пилястры — профиль pilaster00
    lintel?: T_LintelProfile,     // профиль перемычки — lintel00
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // проём 1.6 в стене толщиной 0.6; передняя плоскость стены — в +z, к зрителю
    points: [{ x: -.8, z: .3 }, { x: .8, z: .3 }, { x: .8, z: -.3 }, { x: -.8, z: -.3 }],
    height: 2.8,
    pierWidth: .45,
    pierProtrusion: .12,
    lintelInset: .05,
    pilaster: { ...PILASTER_DEFAULT_PROFILE },
    lintel: { ...LINTEL_DEFAULT_PROFILE },
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)

    const halfOpening = rand(.5, 1.6)
    const halfThickness = rand(.15, .6)
    // косой проём: задние точки сдвинуты вдоль стены, правый откос повёрнут независимо от левого
    const skew = rand(-.3, .3)
    const rightTurn = rand(-.2, .2)
    const raw: A2[] = [
        [-halfOpening, halfThickness],
        [halfOpening, halfThickness],
        [halfOpening + skew + rightTurn, -halfThickness],
        [-halfOpening + skew, -halfThickness],
    ]
    // и весь портал повёрнут в плане на случайный угол
    const angle = rand(0, Math.PI * 2)
    const cos = Math.cos(angle), sin = Math.sin(angle)
    const points = raw.map(([x, z]) => ({ x: x * cos - z * sin, z: x * sin + z * cos }))

    return {
        points,
        height: rand(2, 4.5),
        pierWidth: rand(.25, .8),
        pierProtrusion: rand(.04, .25),
        lintelInset: rand(.02, .1),
        pilaster: randomPilasterProfile(),
        lintel: randomLintelProfile(),
    }
}

// прямая в плане: точка, единичное направление и единичная нормаль наружу от проёма
type T_Line = { point: A2, direction: A2, normal: A2 }

export const portal00 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const { pos, height } = o
    const pilaster: Required<T_PilasterProfile> = { ...PILASTER_DEFAULT_PROFILE, ...o.pilaster }
    const lintel: Required<T_LintelProfile> = { ...LINTEL_DEFAULT_PROFILE, ...o.lintel }

    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }
    if (o.points.length < 4 || height <= 0) return result
    const [point1, point2, point3, point4] = o.points.slice(0, 4).map(({ x, z }): A2 => [x, z])
    const center: A2 = [
        (point1[0] + point2[0] + point3[0] + point4[0]) / 4,
        (point1[1] + point2[1] + point3[1] + point4[1]) / 4,
    ]

    // прямая через from и to; нормаль смотрит от центра проёма. null — точки совпали
    const lineThrough = (from: A2, to: A2): T_Line | null => {
        const dx = to[0] - from[0], dz = to[1] - from[1]
        const length = Math.hypot(dx, dz)
        if (length < 1e-6) return null
        const direction: A2 = [dx / length, dz / length]
        let normal: A2 = [-direction[1], direction[0]]
        if (normal[0] * (from[0] - center[0]) + normal[1] * (from[1] - center[1]) < 0) normal = [-normal[0], -normal[1]]
        return { point: from, direction, normal }
    }
    // та же прямая, сдвинутая от проёма на distance
    const shifted = (line: T_Line, distance: number): T_Line => ({
        ...line,
        point: [line.point[0] + line.normal[0] * distance, line.point[1] + line.normal[1] * distance],
    })
    // пересечение двух прямых; почти параллельные — точка первой прямой
    const intersect = (a: T_Line, b: T_Line): A2 => {
        const denominator = a.direction[0] * b.direction[1] - a.direction[1] * b.direction[0]
        if (Math.abs(denominator) < 1e-6) return a.point
        const dx = b.point[0] - a.point[0], dz = b.point[1] - a.point[1]
        const t = (dx * b.direction[1] - dz * b.direction[0]) / denominator
        return [a.point[0] + a.direction[0] * t, a.point[1] + a.direction[1] * t]
    }

    const frontWall = lineThrough(point1, point2)
    const backWall = lineThrough(point4, point3)
    const leftJamb = lineThrough(point1, point4)
    const rightJamb = lineThrough(point2, point3)
    if (!frontWall || !backWall || !leftJamb || !rightJamb) return result

    const pierWidth = Math.max(.01, o.pierWidth)
    const pierProtrusion = Math.max(0, o.pierProtrusion)
    const toPoint = ([x, z]: A2): T_PlanPoint => ({ x, z })

    // ---- пилоны: путь от передней плоскости стены, вокруг откоса, к задней

    for (const jamb of [leftJamb, rightJamb]) {
        const pierBack = shifted(jamb, pierWidth)
        const frontFace = shifted(frontWall, pierProtrusion)
        const backFace = shifted(backWall, pierProtrusion)
        const path = [
            intersect(frontWall, pierBack), // в передней плоскости стены
            intersect(frontFace, pierBack), // выступ из стены
            intersect(frontFace, jamb),     // угол у проёма спереди
            intersect(backFace, jamb),      // угол у проёма сзади
            intersect(backFace, pierBack),
            intersect(backWall, pierBack),  // в задней плоскости стены
        ].map(toPoint)
        _GM.mergeIndexedArrays(result, pilaster00({
            ...pilaster,
            pos, path, height,
            startWallDirection: frontWall.direction,
            endWallDirection: backWall.direction,
        }))
    }

    // ---- перемычка: внутри верха абак — край карниза на lintelInset от края абаки, архитрав ещё на вынос карниза глубже

    // край карниза — от лица ствола пилона наружу (на абаке)
    const corniceEdge = Math.max(0, pilaster.abacusProjection) - Math.max(0, o.lintelInset)
    // Карниз шире абаки утащил бы торцы архитрава внутрь пилона, а то и в проём — перемычка повисла бы.
    // Вынос карниза ограничен так, чтобы архитрав опирался хотя бы на половину ширины пилона
    const corniceProjection = Math.max(0, Math.min(lintel.corniceProjection, corniceEdge + pierWidth / 2))
    // от лица ствола пилона (плоскости выступа и боковой грани) до лица архитрава; меньше нуля — архитрав
    // утоплен в стену, снаружи остаётся только карниз
    const lintelSetback = corniceEdge - corniceProjection
    const lintelFront = shifted(frontWall, pierProtrusion + lintelSetback)
    const lintelBack = shifted(backWall, pierProtrusion + lintelSetback)
    const lintelLeft = shifted(leftJamb, pierWidth + lintelSetback)
    const lintelRight = shifted(rightJamb, pierWidth + lintelSetback)
    const outline = [
        intersect(lintelFront, lintelLeft),
        intersect(lintelFront, lintelRight),
        intersect(lintelBack, lintelRight),
        intersect(lintelBack, lintelLeft),
    ].map(toPoint)
    _GM.mergeIndexedArrays(result, lintel00({
        ...lintel,
        corniceProjection,
        pos: [pos[0], pos[1] + height, pos[2]],
        outline,
    }))

    return result
}
