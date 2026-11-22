import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import { DEFAULT_PROFILE as PILASTER_DEFAULT_PROFILE, type T_PilasterProfile } from "geometry/01_pilaster00/pilaster00"
import { portalHeightFor, DEFAULT_OPTS as ROOM_DEFAULT_OPTS } from "geometry/05_room00/room00"
import { room01 } from "geometry/05_room01/room01"
import { wall00 } from "geometry/08_wall00/wall00"
import {
    complex00, complexEntrances, randomOpts as randomComplexOpts, DEFAULT_OPTS as COMPLEX_DEFAULT_OPTS,
    type T_ComplexRoom, type T_Entrance,
} from "geometry/06_complex00/complex00"

// Группа комплексов на разных уровнях, соединённых туннелями.
//
// Каждый комплекс — complex00 без оболочки (shell: false): только комнаты, без фасада, пилястр фасада и крыши.
// У комплекса своё положение pos (относительно общего pos) — pos[1] задаёт его уровень, земля под полом; план комнат —
// в координатах относительно pos комплекса, по правилам complex00.
//
// Туннель links[i] — room01 от входа одного комплекса до входа другого. Вход в наружной стене комплекс ставит сам:
// complex01 просит у complex00 вход на наружном ребре, ближайшем к центру комплекса на другом конце туннеля
// (entranceTargets), и узнаёт, где встала дыра (complexEntrances). Края дыры на наружном лице стены — концы туннеля,
// по ширине ровно дыра, высота в свету — высота дыры портала (до низа перемычки), пол — на уровне пола комплекса.
// Концы туннеля пара к паре — так, чтобы бока не перекрещивались.
// tunnelCeilingRise — потолок туннеля выше дыры на столько; полосу над дырой на каждом конце закрывает кладка wall00
// лицом в туннель (концы room01 открыты, а наружного лица у стен комплекса нет).
//
// Туннель идёт по прямой и ничего не обходит: план комплексов и связи подбираются так, чтобы он не проходил сквозь
// комнаты и другие туннели.
//
// Высоты, стены, пилястры, порталы — общие для всех комплексов. Оттенок tint — множитель цвета вершин всего,
// включая туннели, после сборки.
//
// Скрытый комплекс (hidden) не строится, но его входы считаются как у видимого; скрытый туннель — тоже: входы
// у его концов есть, самого туннеля нет. Так бесконечный уровень собирается кусками: соседний комплекс в куске
// скрыт, с теми же туннелями в том же порядке, и входы у него встают там же, где в его собственном куске.

type T_Complex = {
    pos: A3,               // положение комплекса относительно общего pos; pos[1] — земля под его полом
    rooms: T_ComplexRoom[], // комнаты complex00, точки плана — относительно pos комплекса
    hidden?: boolean,       // не строить: только входы — для туннелей к нему
}

type T_Link = {
    from: number, // номер комплекса у входа в туннель
    to: number,   // номер комплекса у выхода
    hidden?: boolean, // не строить туннель: только входы у его концов
}

type T = {
    pos?: A3,                // общее начало координат
    complexes?: T_Complex[], // комплексы
    links?: T_Link[],        // туннели между комплексами
    entranceCount?: number,  // сколько ещё входов в наружных стенах каждого комплекса, кроме туннельных — дыры наружу
    tunnelFlatLength?: number, // длина горизонтального участка туннеля у каждого конца, до пандуса
    tunnelCeilingRise?: number, // на сколько потолок туннеля выше дыры портала; 0 — вровень с дырой
    colorTunnel?: A3,          // базовый цвет кладки туннелей до запечённого освещения
    portalWidth?: number,    // ширина проёма портала — между комнатами и у входов туннелей
    height?: number,         // высота комнат в свету
    wallThickness?: number,  // толщина стен комнат
    floorThickness?: number, // толщина плиты пола — и в комнатах, и в туннелях
    ceilingThickness?: number, // толщина плиты потолка
    profileHeight?: number,  // высота полосы стены с карнизом под потолком; 0 — без неё
    portalHeight?: number,   // высота пилястр портала от пола до низа перемычки
    pilaster?: T_PilasterProfile, // тип пилястр — профиль pilaster00
    pilasterSpacing?: number,     // шаг пилястр вдоль стен; 0 — без пилястр у стен
    pilasterWidth?: number,       // ширина ствола пилястры у стены
    pilasterProtrusion?: number,  // на сколько ствол выступает из стены в комнату
    aoLength?: number,            // длина, на которую растягивается тайл тени у угла стены с полом и потолком
    colorWall?: A3,               // базовый цвет стен комнат до запечённого освещения
    tint?: A3,                    // множитель цвета вершин всего, компоненты от 0 до 1
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // Три комплекса по две комнаты: A — на земле, B — справа на 4 выше, C — позади (в −z) на 8 выше.
    // Туннели A → B, A → C, B → C
    complexes: [
        {
            pos: [0, 0, 0],
            rooms: [
                { points: [{ x: -6, z: 5 }, { x: 6, z: 5 }, { x: 6, z: -5 }, { x: -6, z: -5 }] },
                { points: [{ x: 6, z: 5 }, { x: 14, z: 4 }, { x: 14, z: -4 }, { x: 6, z: -5 }] },
            ],
        },
        {
            pos: [34, 4, -4],
            rooms: [
                { points: [{ x: -5, z: 6 }, { x: 5, z: 6 }, { x: 5, z: -6 }, { x: -5, z: -6 }] },
                { points: [{ x: -5, z: -6 }, { x: 5, z: -6 }, { x: 4, z: -14 }, { x: -4, z: -14 }] },
            ],
        },
        {
            pos: [6, 8, -36],
            rooms: [
                { points: [{ x: -7, z: 5 }, { x: 3, z: 5 }, { x: 3, z: -5 }, { x: -7, z: -5 }] },
                { points: [{ x: 3, z: 5 }, { x: 9, z: 3 }, { x: 11, z: -2 }, { x: 3, z: -5 }] },
            ],
        },
    ],
    links: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 1, to: 2 }],
    entranceCount: 0,
    tunnelFlatLength: 2,
    tunnelCeilingRise: 0,
    colorTunnel: [...ROOM_DEFAULT_OPTS.colorMasonry],
    portalWidth: COMPLEX_DEFAULT_OPTS.portalWidth,
    height: COMPLEX_DEFAULT_OPTS.height,
    wallThickness: COMPLEX_DEFAULT_OPTS.wallThickness,
    floorThickness: COMPLEX_DEFAULT_OPTS.floorThickness,
    ceilingThickness: COMPLEX_DEFAULT_OPTS.ceilingThickness,
    profileHeight: COMPLEX_DEFAULT_OPTS.profileHeight,
    portalHeight: COMPLEX_DEFAULT_OPTS.portalHeight,
    pilaster: { ...PILASTER_DEFAULT_PROFILE },
    pilasterSpacing: COMPLEX_DEFAULT_OPTS.pilasterSpacing,
    pilasterWidth: COMPLEX_DEFAULT_OPTS.pilasterWidth,
    pilasterProtrusion: COMPLEX_DEFAULT_OPTS.pilasterProtrusion,
    aoLength: COMPLEX_DEFAULT_OPTS.aoLength,
    colorWall: [...COMPLEX_DEFAULT_OPTS.colorWall],
    tint: [...COMPLEX_DEFAULT_OPTS.tint],
}

// на сколько туннель шире дыры портала с каждой стороны
const TUNNEL_SIDE_WIDEN = .1

// Туннель room01 между двумя дырами порталов на наружных лицах стен — его строят complex01 и complex02.
// Концы — края дыр в координатах относительно pos, y — верх пола у дыры. Концы пара к паре сами: бока не
// перекрещиваются. Высота в свету — дыра портала и ещё ceilingRise; полосу над дырой на каждом конце закрывает
// кладка wall00 лицом в туннель (концы room01 открыты, а наружного лица у стен комнат нет)
export const tunnelBetweenHoles = (options: {
    pos: A3, entryStart: A3, entryEnd: A3, exitStart: A3, exitEnd: A3,
    portalHeight: number, ceilingRise: number, flatLength: number,
    floorThickness: number, ceilingThickness: number, aoLength: number, colorTunnel: A3,
}): IBuffersGeom => {
    const { pos, portalHeight, aoLength, colorTunnel } = options
    // Туннель шире дыры на TUNNEL_SIDE_WIDEN с каждой стороны: пилоны портала выступают из наружного лица стены,
    // и их бока в плоскости стен туннеля мерцали бы (z-fighting); так стена туннеля уходит в толщу пилона
    const widen = (start: A3, end: A3): [A3, A3] => {
        const length = Math.hypot(end[0] - start[0], end[2] - start[2]) || 1
        const dx = (end[0] - start[0]) / length * TUNNEL_SIDE_WIDEN, dz = (end[2] - start[2]) / length * TUNNEL_SIDE_WIDEN
        return [[start[0] - dx, start[1], start[2] - dz], [end[0] + dx, end[1], end[2] + dz]]
    }
    const [entryStart, entryEnd] = widen(options.entryStart, options.entryEnd)
    let [exitStart, exitEnd] = widen(options.exitStart, options.exitEnd)
    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }
    const ceilingRise = Math.max(0, options.ceilingRise)
    // пара к паре — без перекрещенных боков: дыры напротив друг друга идут навстречу
    const planDistance = (a: A3, b: A3) => Math.hypot(a[0] - b[0], a[2] - b[2])
    if (planDistance(entryStart, exitStart) + planDistance(entryEnd, exitEnd) >
        planDistance(entryStart, exitEnd) + planDistance(entryEnd, exitStart)) {
        [exitStart, exitEnd] = [exitEnd, exitStart]
    }
    _GM.mergeIndexedArrays(result, room01({
        pos,
        entryLeft: entryStart, entryRight: entryEnd,
        exitLeft: exitStart, exitRight: exitEnd,
        height: portalHeight + ceilingRise,
        entryFlatLength: options.flatLength,
        exitFlatLength: options.flatLength,
        floorThickness: options.floorThickness,
        ceilingThickness: options.ceilingThickness,
        masonryTileSize: ROOM_DEFAULT_OPTS.masonryTileSize,
        aoLength,
        colorMasonry: colorTunnel,
    }))
    // кладка над дырой от её верха до потолка туннеля, лицом к точке inside внутри туннеля
    const headerOverHole = (start: A3, end: A3, inside: A3) => {
        const faceX = -(end[2] - start[2]), faceZ = end[0] - start[0]
        const facesInside = faceX * (inside[0] - start[0]) + faceZ * (inside[2] - start[2]) > 0
        const [from, to] = facesInside ? [start, end] : [end, start]
        _GM.mergeIndexedArrays(result, wall00({
            pos: [pos[0], pos[1] + (start[1] + end[1]) / 2 + portalHeight, pos[2]],
            start: [from[0], from[2]], end: [to[0], to[2]],
            height: ceilingRise,
            tileSize: ROOM_DEFAULT_OPTS.masonryTileSize,
            tileOffsetY: portalHeight,
            shadowBottom: false, shadowTop: true, aoLength,
            colorWall: colorTunnel,
        }))
    }
    if (ceilingRise > 0) {
        const middle = (a: A3, b: A3): A3 => [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2]
        headerOverHole(entryStart, entryEnd, middle(exitStart, exitEnd))
        headerOverHole(exitStart, exitEnd, middle(entryStart, entryEnd))
    }
    return result
}

// центр комплекса в плане относительно его pos — среднее всех точек всех комнат
const planCenter = (complex: T_Complex): A2 => {
    let x = 0, z = 0, count = 0
    for (const room of complex.rooms) for (const point of room.points) { x += point.x; z += point.z; ++count }
    return count > 0 ? [x / count, z / count] : [0, 0]
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    // общие высоты, стены и пилястры — из одного случайного комплекса
    const base = randomComplexOpts()
    // Комплексы по дуге с шагом с запасом на размах плана randomOpts complex00 (до ~40 от центра), уровни вразброс, не ниже 0 — пол не уходит под y = 0
    const complexCount = 2 + Math.floor(Math.random() * 3)
    const complexes: T_Complex[] = []
    for (let i = 0; i < complexCount; ++i) {
        const angle = i * rand(.9, 1.4)
        const distance = i === 0 ? 0 : 90
        const previous = complexes[i - 1]?.pos ?? [0, 0, 0]
        complexes.push({
            pos: [previous[0] + Math.cos(angle) * distance, rand(0, 8), previous[2] - Math.sin(angle) * distance],
            rooms: randomComplexOpts().rooms ?? [],
        })
    }
    // цепочка и иногда связь через одного
    const links: T_Link[] = []
    for (let i = 1; i < complexCount; ++i) links.push(Math.random() < .5 ? { from: i - 1, to: i } : { from: i, to: i - 1 })
    if (complexCount > 2 && Math.random() < .5) links.push({ from: 0, to: 2 })
    return {
        complexes,
        links,
        entranceCount: Math.floor(Math.random() * 3),
        tunnelFlatLength: rand(0, 4),
        tunnelCeilingRise: Math.random() < .5 ? 0 : rand(0, 1.5),
        colorTunnel: [rand(.2, .85), rand(.2, .8), rand(.3, .85)],
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
        tint: base.tint,
    }
}

export const complex01 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }
    const { complexes } = o
    const pilaster: T_PilasterProfile = { ...PILASTER_DEFAULT_PROFILE, ...o.pilaster }
    const floorThickness = Math.max(0, o.floorThickness)

    // связи с существующими разными комплексами
    const links = o.links.filter(({ from, to }) =>
        from !== to && complexes[from] !== undefined && complexes[to] !== undefined)

    // ---- входы: у каждого комплекса — по точке на каждый его туннель, центр комплекса на другом конце,
    // в плане относительно pos этого комплекса
    const targets: { x: number, z: number }[][] = complexes.map(() => [])
    // где у туннеля вход в targets комплекса from и выход в targets комплекса to
    const linkSlots = links.map(({ from, to }) => {
        const slotOf = (here: number, there: number) => {
            const [centerX, centerZ] = planCenter(complexes[there])
            const x = complexes[there].pos[0] + centerX - complexes[here].pos[0]
            const z = complexes[there].pos[2] + centerZ - complexes[here].pos[2]
            return targets[here].push({ x, z }) - 1
        }
        return { from: slotOf(from, to), to: slotOf(to, from) }
    })

    // общие опции комплекса; оттенок — потом, на всё сразу
    const complexOptsAt = (index: number) => ({
        pos: [o.pos[0] + complexes[index].pos[0], o.pos[1] + complexes[index].pos[1], o.pos[2] + complexes[index].pos[2]] as A3,
        rooms: complexes[index].rooms,
        shell: false,
        entranceTargets: targets[index],
        entranceCount: o.entranceCount,
        portalWidth: o.portalWidth,
        height: o.height,
        wallThickness: o.wallThickness,
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
        tint: [1, 1, 1] as A3,
    })

    const entrances: (T_Entrance | null)[][] = complexes.map((_, index) => {
        const complexOpts = complexOptsAt(index)
        if (!complexes[index].hidden) _GM.mergeIndexedArrays(result, complex00(complexOpts))
        return complexEntrances(complexOpts)
    })

    // ---- туннели: room01 между краями дыр на наружном лице стены, высотой в дыру портала и выше на tunnelCeilingRise

    const portalHeight = portalHeightFor(pilaster, o.height, o.profileHeight, o.portalHeight)
    if (portalHeight > 0) {
        links.forEach(({ from, to, hidden }, index) => {
            if (hidden) return
            const entry = entrances[from][linkSlots[index].from]
            const exit = entrances[to][linkSlots[index].to]
            if (!entry || !exit) return
            // точка дыры в координатах, общих с pos: уровень — верх пола комплекса
            const worldAt = (complex: number, [x, z]: A2): A3 =>
                [complexes[complex].pos[0] + x, complexes[complex].pos[1] + floorThickness, complexes[complex].pos[2] + z]
            const entryStart = worldAt(from, entry.start), entryEnd = worldAt(from, entry.end)
            const exitStart = worldAt(to, exit.start), exitEnd = worldAt(to, exit.end)
            _GM.mergeIndexedArrays(result, tunnelBetweenHoles({
                pos: o.pos, entryStart, entryEnd, exitStart, exitEnd, portalHeight,
                ceilingRise: o.tunnelCeilingRise, flatLength: o.tunnelFlatLength,
                floorThickness, ceilingThickness: o.ceilingThickness, aoLength: o.aoLength, colorTunnel: o.colorTunnel,
            }))
        })
    }

    // ---- оттенок всего: множитель цвета каждой вершины
    const tint = o.tint.map(channel => Math.min(1, Math.max(0, channel)))
    for (let i = 0; i < result.c.length; ++i) result.c[i] *= tint[i % 3]

    return result
}
