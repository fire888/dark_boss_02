import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import { floor01 } from "geometry/00_floor01/floor01"
import { wall00 } from "geometry/08_wall00/wall00"
import { portal00 } from "geometry/02_portal00/portal00"
import { portalFrameFor, portalHeightFor, portalMarginFor, MIN_PORTAL_WIDTH } from "geometry/05_room00/room00"
import { stairs00 } from "geometry/07_stairs00/stairs00"
import {
    pilaster00, DEFAULT_PROFILE as PILASTER_DEFAULT_PROFILE, randomProfile as randomPilasterProfile, type T_PilasterProfile,
} from "geometry/01_pilaster00/pilaster00"
import { profile00 } from "geometry/04_profile00/profile00"

// Комната в два уровня: нижняя зона и верхняя зона с полом выше на levelStep, над обеими — один плоский потолок.
// Из нижней зоны в верхнюю ведёт полукруглое крыльцо stairs00. В стенах нижней зоны — входы, в стенах верхней —
// выходы (или тоже входы); по смыслу это переход между комплексами с перепадом высот, как туннель room01.
//
// План — прямоугольник width по x, середина по x на pos[0]. Граница зон — линия z = pos[2]: нижняя зона перед ней,
// в +z, к зрителю, глубиной lowerLength; верхняя за ней, в −z, глубиной upperLength.
//
// Крыльцо stairs00 стоит центром дуги на середине границы: линия его «здания» совпадает с границей, полукруг
// выпирает в нижнюю зону, площадка крыльца — на уровне верхнего пола и продолжает его. Лестницы спускаются
// с площадки в нижнюю зону. По границе вне крыльца — уступ: вертикальная кладка от нижнего пола до верхнего,
// без парапета.
//
// Пол каждой зоны и потолок — floor01 без выдавливания (только лицо). Стены — кладка wall00 лицом внутрь:
// у нижней зоны от её пола до низа профиля, у верхней — от верхнего пола; сетка кладки общая у всей комнаты, поэтому
// куски одной боковой стены продолжают друг друга. Порталы — portal00, как у room00: пилоны-пилястры по откосам
// и перемычка сверху, в полу проёма — порог floor01. Стена тонкая, поэтому дыре дана толщина portalDepth. Проём
// bare — голая дыра, её закрывает портал соседней комнаты. Перемычка с карнизом — под профилем, как у room00.
//
// Профиль под потолком — profile00 высотой profileHeight, как у room00. Потолок над обеими зонами один, поэтому
// профиль идёт замкнутым прямоугольником по всему периметру комнаты и выступает внутрь; над уступом его нет.
// Пилястры — pilaster00 вдоль каждой стены от пола своей зоны до низа профиля, с шагом около pilasterSpacing:
// на обоих концах свободного куска стены (у углов и по бокам проёмов) и равномерно между ними. У уступа
// пилястр нет — он ниже.
//
// Свет запечён в осях комнаты: комната не поворачивается, её стены — по осям x и z.

// Стены комнаты: front — передняя стена нижней зоны, back — задняя стена верхней, lowerLeft / lowerRight и
// upperLeft / upperRight — боковые стены нижней и верхней зоны; лево и право — если смотреть от передней стены
// на заднюю (в −z)
export type T_Room03Wall = 'front' | 'lowerLeft' | 'lowerRight' | 'back' | 'upperLeft' | 'upperRight'

export type T_Room03Portal = {
    wall: T_Room03Wall,
    // где по стене середина проёма: доля длины стены слева направо, если смотреть на стену изнутри комнаты
    offset: number,
    width: number,  // ширина проёма в свету, между стволами пилонов; не уже 1.2 (MIN_PORTAL_WIDTH room00)
    height: number, // высота пилонов от пола своей зоны до низа перемычки; перемычка не влезает под профиль — ниже
    bare?: boolean, // голая дыра без portal00 и порога: проём закрывает портал соседней комнаты
}

// пролёт лестницы крыльца — как у stairs00: угол центра пролёта (0 — вправо, +x; PI / 2 — к передней стене, +z;
// PI — влево) и ширина по дуге внешнего радиуса
type T_Stair = {
    angle: number,
    width: number,
}

type T = {
    pos?: A3,              // середина границы зон на уровне нижнего пола
    width?: number,        // ширина комнаты по x
    lowerLength?: number,  // глубина нижней зоны: от границы до передней стены, в +z
    upperLength?: number,  // глубина верхней зоны: от границы до задней стены, в −z
    levelStep?: number,    // на сколько пол верхней зоны выше пола нижней
    height?: number,       // высота потолка над полом верхней зоны; над нижней — на levelStep больше
    // крыльцо stairs00: внешний радиус полукруга; ужимается, чтобы не задевать боковые стены
    // и оставлять проход у передней стены
    stairsRadius?: number,
    stairs?: T_Stair[],    // пролёты лестниц крыльца
    stairsParapet?: boolean,     // подпорная стенка крыльца с парапетом над площадкой
    stairsParapetHeight?: number, // высота парапета над площадкой
    stairsWallThickness?: number, // толщина стенки крыльца
    stepHeight?: number,   // желаемая высота ступени; подгоняется, чтобы целое число ступеней дало levelStep
    stepDepth?: number,    // желаемая глубина ступени; на высоком крыльце малого радиуса ужимается
    profileHeight?: number,       // высота полосы стены с карнизом (profile00) под потолком; 0 — без неё
    pilaster?: T_PilasterProfile, // тип пилястр у стен — профиль pilaster00
    pilasterSpacing?: number,     // шаг пилястр вдоль стен, между центрами; 0 — без пилястр
    pilasterWidth?: number,       // ширина ствола пилястры вдоль стены
    pilasterProtrusion?: number,  // на сколько ствол выступает из стены в комнату
    portals?: T_Room03Portal[], // порталы в стенах; не влезающий в стену или наложенный на соседний — пропускается
    portalDepth?: number,       // толщина стены в проёме — насколько дыра с пилонами уходит за лицо стены
    groundTileSize?: number,    // сторона клетки сетки тайла земли у пола и потолка
    groundColorJitter?: number, // разброс яркости земли по клеткам, доля
    masonryTileSize?: number,   // сторона тайла кладки стен в метрах
    // длина, на которую растягивается тайл тени стен от угла с полом и потолком; видимая тень — примерно четверть
    aoLength?: number,
    // базовые цвета до запечённого освещения; умножаются на тайл атласа
    colorFloor?: A3,
    colorCeiling?: A3,
    colorWall?: A3,        // кладка стен и уступа
    colorStairsWall?: A3,  // стенка и щёки крыльца
    colorStairsTop?: A3,   // площадка крыльца, проступи и подступенки
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    width: 14,
    lowerLength: 11,
    upperLength: 9,
    levelStep: 1.6,
    height: 5,
    stairsRadius: 4,
    // одна лестница прямо к передней стене
    stairs: [{ angle: Math.PI / 2, width: 3.6 }],
    stairsParapet: true,
    stairsParapetHeight: 1,
    stairsWallThickness: .4,
    stepHeight: .2,
    stepDepth: .35,
    profileHeight: 1.2,
    pilaster: { ...PILASTER_DEFAULT_PROFILE },
    pilasterSpacing: 3,
    pilasterWidth: .6,
    pilasterProtrusion: .15,
    // вход в передней стене и сбоку внизу, выходы в задней стене и сбоку наверху
    portals: [
        { wall: 'front', offset: .5, width: 1.8, height: 2.8 },
        { wall: 'lowerLeft', offset: .4, width: 1.4, height: 2.4 },
        { wall: 'back', offset: .5, width: 1.8, height: 2.6 },
        { wall: 'upperRight', offset: .5, width: 1.4, height: 2.4 },
    ],
    portalDepth: .8,
    groundTileSize: 1.5,
    groundColorJitter: .3,
    masonryTileSize: 1.2,
    aoLength: .5,
    colorFloor: [1, 1, 1],
    colorCeiling: [.8, .8, .82],
    colorWall: [.8, .73, .74],
    colorStairsWall: [.64, .67, .7],
    colorStairsTop: [1, 1, 1],
}

// наименьший зазор между крыльцом и боковой стеной — с запасом на пилястру с базой — и проход между крыльцом
// и передней стеной
const STAIRS_SIDE_GAP = .8
const STAIRS_FRONT_GAP = 1

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    const pick = <V>(items: V[]): V => items[Math.floor(Math.random() * items.length)]
    // приглушённый оттенок: серый яркости brightness, сдвинутый к случайному тону
    const tint = (brightnessMin: number, brightnessMax: number, saturationMax: number): A3 => {
        const brightness = rand(brightnessMin, brightnessMax)
        const saturation = rand(0, saturationMax)
        const hue = rand(0, Math.PI * 2)
        return [0, 1, 2].map(channel =>
            Math.min(1, Math.max(0, brightness + saturation * Math.cos(hue - channel * Math.PI * 2 / 3)))) as A3
    }

    const width = rand(10, 20)
    const lowerLength = rand(8, 16)
    const upperLength = rand(6, 14)
    const levelStep = rand(.8, 2.2)
    // крыльцо: чем выше подъём, тем больше радиус — иначе ступени слишком мелкие; не больше 6 — на просторе
    // крыльцо во всю ширину заняло бы нижнюю зону
    const radiusMax = Math.min(width / 2 - STAIRS_SIDE_GAP, lowerLength - STAIRS_FRONT_GAP)
    const stairsRadius = Math.min(radiusMax, rand(Math.max(2.5, levelStep * 1.8), 6))

    // лестницы: одна прямо (чуть повёрнутая), две по бокам или три
    const stairs: T_Stair[] = []
    const layoutRoll = Math.random()
    if (layoutRoll < .5) {
        stairs.push({ angle: Math.PI / 2 + rand(-.4, .4), width: stairsRadius * rand(.6, 1.1) })
    } else if (layoutRoll < .8) {
        const sideOffsetAngle = Math.PI * rand(.2, .3)
        const stairWidth = stairsRadius * rand(.5, .8)
        stairs.push({ angle: Math.PI / 2 - sideOffsetAngle, width: stairWidth }, { angle: Math.PI / 2 + sideOffsetAngle, width: stairWidth })
    } else {
        const sideOffsetAngle = Math.PI * rand(.3, .38)
        stairs.push(
            { angle: Math.PI / 2, width: stairsRadius * rand(.4, .7) },
            { angle: Math.PI / 2 - sideOffsetAngle, width: stairsRadius * rand(.3, .5) },
            { angle: Math.PI / 2 + sideOffsetAngle, width: stairsRadius * rand(.3, .5) },
        )
    }

    // по одному-два портала в каждой зоне; иногда голые дыры
    const portals: T_Room03Portal[] = []
    const addPortals = (walls: T_Room03Wall[], heightMax: number) => {
        const count = 1 + Math.floor(Math.random() * 2)
        for (let i = 0; i < count; ++i) {
            portals.push({
                wall: pick(walls),
                offset: rand(.2, .8),
                width: rand(1, 2.2),
                height: Math.min(heightMax, rand(2, 3)),
                bare: Math.random() < .25,
            })
        }
    }
    const height = rand(4, 7)
    addPortals(['front', 'front', 'lowerLeft', 'lowerRight'], levelStep + height)
    addPortals(['back', 'back', 'upperLeft', 'upperRight'], height)

    return {
        width, lowerLength, upperLength, levelStep, height,
        stairsRadius,
        stairs,
        stairsParapet: Math.random() < .75,
        stairsParapetHeight: rand(.7, 1.2),
        stairsWallThickness: rand(.3, .5),
        stepHeight: rand(.16, .24),
        stepDepth: rand(.28, .42),
        profileHeight: Math.random() < .1 ? 0 : rand(.8, 1.8),
        pilaster: randomPilasterProfile(),
        pilasterSpacing: Math.random() < .15 ? 0 : rand(2.5, 6),
        pilasterWidth: rand(.4, .9),
        pilasterProtrusion: rand(.08, .25),
        portals,
        portalDepth: rand(.2, 1.5),
        groundTileSize: rand(.8, 2),
        groundColorJitter: rand(.15, .4),
        masonryTileSize: rand(.6, 2),
        aoLength: rand(.3, .7),
        colorFloor: tint(.75, .95, .15),
        colorCeiling: tint(.7, .9, .1),
        colorWall: [rand(.72, .88), rand(.66, .8), rand(.66, .82)],
        colorStairsWall: tint(.5, .8, .12),
        colorStairsTop: tint(.75, .95, .15),
    }
}

export const room03 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const { pos, portals, groundTileSize, groundColorJitter, aoLength, colorWall } = o
    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }

    const width = Math.max(1, o.width)
    const lowerLength = Math.max(1, o.lowerLength)
    const upperLength = Math.max(1, o.upperLength)
    const levelStep = Math.max(.1, o.levelStep)
    const height = Math.max(1, o.height)
    const masonryTileSize = Math.max(.1, o.masonryTileSize)
    const portalDepth = Math.max(.05, o.portalDepth)
    const halfWidth = width / 2
    // потолок над нижним полом
    const ceilingY = levelStep + height
    // Крыльцо не задевает боковые стены и оставляет проход у передней. Меньше 1 — места под крыльцо нет:
    // stairs00 не уместит пролёт сквозь стенку, комната строится без лестницы
    const stairsRadius = Math.min(o.stairsRadius, halfWidth - STAIRS_SIDE_GAP, lowerLength - STAIRS_FRONT_GAP)
    const hasStairs = stairsRadius >= 1
    // Профиль под потолком не выше верхней зоны без запаса 1.5 м под проход; без профиля стены доходят до потолка
    const profileHeight = Math.min(Math.max(0, o.profileHeight), height - 1.5)
    const hasProfile = profileHeight > 1e-6
    const profileBottomY = ceilingY - (hasProfile ? profileHeight : 0)

    // пилястры у стен
    const pilaster: Required<T_PilasterProfile> = { ...PILASTER_DEFAULT_PROFILE, ...o.pilaster }
    const pilasterHalfWidth = Math.max(.05, o.pilasterWidth) / 2
    const pilasterProtrusion = Math.max(.02, o.pilasterProtrusion)
    // наибольший вынос базы или капители от ствола
    const pilasterProjection = Math.max(pilaster.plinthProjection, pilaster.abacusProjection, 0)
    // пилястра должна вместить базу и капитель и ещё немного ствола между ними
    const pilasterMinHeight = pilaster.plinthHeight + pilaster.baseSlopeHeight + pilaster.baseFilletHeight
        + pilaster.abacusHeight + pilaster.capitalSlopeHeight + pilaster.capitalFilletHeight + .3
    // центр пилястры не ближе к углу и к краю проёма: полширины ствола, вынос базы и выступ — база не залезет
    // в соседнюю стену и в откос
    const pilasterClearance = pilasterHalfWidth + pilasterProjection + pilasterProtrusion + .1

    // точка комнаты: x, z относительно pos, y — над нижним полом
    const pointAt = (x: number, y: number, z: number): A3 => [pos[0] + x, pos[1] + y, pos[2] + z]

    // ---- полы и потолок; контуры против часовой стрелки сверху — лицо вверх, обратный обход — лицо вниз

    const rectangle = (zNear: number, zFar: number) => [
        { x: -halfWidth, z: zNear }, { x: halfWidth, z: zNear }, { x: halfWidth, z: zFar }, { x: -halfWidth, z: zFar },
    ]
    const groundOpts = { height: 0, groundTileSize, groundColorJitter }
    // нижний пол целиком, и под крыльцом: его закрывают площадка и стенка крыльца
    _GM.mergeIndexedArrays(result, floor01({
        ...groundOpts, pos: pointAt(0, 0, 0), contour: rectangle(lowerLength, 0), colorGround: o.colorFloor,
    }))
    _GM.mergeIndexedArrays(result, floor01({
        ...groundOpts, pos: pointAt(0, levelStep, 0), contour: rectangle(0, -upperLength), colorGround: o.colorFloor,
    }))
    _GM.mergeIndexedArrays(result, floor01({
        ...groundOpts, pos: pointAt(0, ceilingY, 0), contour: rectangle(lowerLength, -upperLength).reverse(),
        colorGround: o.colorCeiling,
    }))

    // ---- стены. Стена — отрезок start → end в плане, лицо wall00 вправо от хода, (−dz, dx), — внутрь комнаты.
    // Изнутри ход стены идёт слева направо, поэтому offset портала отсчитывается от start

    // Порталы portal00: размеры пилонов и перемычки — как у room00. Стена тонкая (только лицо), поэтому дыре дана
    // толщина portalDepth: внутренние точки портала — на лице стены, наружные — на portalDepth за ним
    const { pierWidth, lintelInset, pierProtrusion } = portalFrameFor(pilaster)
    // от края дыры до угла или до соседней дыры — пилон с выносами базы, капители и карниза перемычки
    const portalMargin = portalMarginFor(pilaster)
    const collideBuilder = _GM.createGeomBuilder()

    // withPilasters — ставить пилястры вдоль стены от пола зоны до верха стены (низа профиля);
    // zoneHeight — высота от пола зоны до потолка, по ней портал с перемычкой встаёт под профиль
    const wallWithPortals = (wall: T_Room03Wall | null, start: A2, end: A2, floorY: number, wallHeight: number,
        shadowBottom: boolean, shadowTop: boolean, withPilasters: boolean, zoneHeight = 0) => {
        const length = Math.hypot(end[0] - start[0], end[1] - start[1])
        if (length < 1e-6 || wallHeight < 1e-6) return
        const direction: A2 = [(end[0] - start[0]) / length, (end[1] - start[1]) / length]
        const inward: A2 = [-direction[1], direction[0]]
        const pointAlong = (distance: number): A2 => [start[0] + direction[0] * distance, start[1] + direction[1] * distance]
        // сетка кладки — от проекции на направление стены: куски одной стены по обе стороны границы зон
        // продолжают одну кладку; по высоте — от нижнего пола
        const tileOffsetAlong = start[0] * direction[0] + start[1] * direction[1]

        // кусок стены от distanceFrom до distanceTo вдоль хода, по высоте от yFrom над полом зоны до верха стены
        const wallPiece = (distanceFrom: number, distanceTo: number, yFrom: number) => {
            if (distanceTo - distanceFrom < 1e-6 || wallHeight - yFrom < 1e-6) return
            _GM.mergeIndexedArrays(result, wall00({
                pos: pointAt(0, floorY + yFrom, 0),
                start: pointAlong(distanceFrom),
                end: pointAlong(distanceTo),
                height: wallHeight - yFrom,
                tileSize: masonryTileSize,
                tileOffsetX: tileOffsetAlong + distanceFrom,
                tileOffsetY: floorY + yFrom,
                // над проёмом низ куска — край софита, наружный угол, без тени
                shadowBottom: shadowBottom && yFrom < 1e-6,
                shadowTop,
                aoLength,
                colorWall,
            }))
        }

        // Проёмы этой стены: не уже MIN_PORTAL_WIDTH, от углов — не ближе portalMargin; высота — чтобы перемычка
        // с карнизом встала под профиль. Не влезающий — пропускается
        const openings = portals
            .filter(portal => wall !== null && portal.wall === wall)
            .map(portal => {
                const width = Math.max(portal.width, MIN_PORTAL_WIDTH)
                const from = Math.min(Math.max(portal.offset * length - width / 2, portalMargin), length - portalMargin - width)
                return {
                    from, to: from + width,
                    height: portalHeightFor(pilaster, zoneHeight, profileHeight, portal.height),
                    bare: portal.bare ?? false,
                }
            })
            .filter(opening => opening.from >= portalMargin - 1e-6 && opening.height > 0)
            .sort((a, b) => a.from - b.from)
        let walked = 0
        // свободные куски стены между углами и поставленными проёмами — там встают пилястры; у проёма кусок
        // начинается за пилоном портала
        const freeRanges: [number, number][] = []
        let freeFrom = 0
        for (const opening of openings) {
            // между соседними дырами — два пилона с выносами
            if (walked > 0 && opening.from < walked + 2 * portalMargin) continue
            freeRanges.push([freeFrom, opening.from - portalMargin])
            freeFrom = opening.to + portalMargin
            wallPiece(walked, opening.from, 0)
            wallPiece(opening.from, opening.to, opening.height)
            walked = opening.to
            if (opening.bare) continue

            // края дыры на лице стены и за ним, на глубине portalDepth
            const innerFrom = pointAlong(opening.from), innerTo = pointAlong(opening.to)
            const outerFrom: A2 = [innerFrom[0] - inward[0] * portalDepth, innerFrom[1] - inward[1] * portalDepth]
            const outerTo: A2 = [innerTo[0] - inward[0] * portalDepth, innerTo[1] - inward[1] * portalDepth]
            const toPoint = ([x, z]: A2) => ({ x, z })

            // Порог — пол в проёме на уровне пола зоны: верх floor01 без боков, сетка тайлов от того же pos,
            // что у пола, — клетки продолжают пол. floor01 ждёт обход против часовой стрелки сверху
            const thresholdPlan: A2[] = [innerFrom, outerFrom, outerTo, innerTo]
            if (_GM.polygonArea2(thresholdPlan.map(([x, z]): A2 => [x, -z])) < 0) thresholdPlan.reverse()
            const threshold = floor01({
                ...groundOpts, pos: pointAt(0, floorY, 0), contour: thresholdPlan.map(toPoint), colorGround: o.colorFloor,
            })
            threshold.vCollide = []
            _GM.mergeIndexedArrays(result, threshold)

            // портал: точки 1, 2 — лицо стены, 3, 4 — за ним; обход portal00 выбирает сам
            _GM.mergeIndexedArrays(result, portal00({
                pos: pointAt(0, floorY, 0),
                points: [innerFrom, innerTo, outerTo, outerFrom].map(toPoint),
                height: opening.height,
                pierWidth, pierProtrusion, lintelInset,
                pilaster,
            }))

            // Прокси: порог и откосы дыры сквозь толщу — у пилонов прокси нет, без откосов игрок зашёл бы в стену сбоку
            const worldAt = ([x, z]: A2, y: number) => pointAt(x, floorY + y, z)
            collideBuilder.collideQuad(worldAt(innerFrom, 0), worldAt(innerTo, 0), worldAt(outerTo, 0), worldAt(outerFrom, 0))
            collideBuilder.collideQuad(worldAt(innerFrom, 0), worldAt(outerFrom, 0), worldAt(outerFrom, opening.height), worldAt(innerFrom, opening.height))
            collideBuilder.collideQuad(worldAt(innerTo, 0), worldAt(outerTo, 0), worldAt(outerTo, opening.height), worldAt(innerTo, opening.height))
        }
        wallPiece(walked, length, 0)
        freeRanges.push([freeFrom, length])

        // ---- пилястры: на обоих концах каждого свободного куска и равномерно между ними, шаг не больше
        // pilasterSpacing; кусок короче шага — одна пилястра посередине
        if (!withPilasters || o.pilasterSpacing <= 0 || wallHeight < pilasterMinHeight) return
        const pointOut = (point: A2, distance: number): A2 => [point[0] + inward[0] * distance, point[1] + inward[1] * distance]
        for (const [freeFrom, freeTo] of freeRanges) {
            const rangeFrom = freeFrom + pilasterClearance, rangeTo = freeTo - pilasterClearance
            if (rangeTo < rangeFrom) continue
            const rangeLength = rangeTo - rangeFrom
            const count = rangeLength < o.pilasterSpacing ? 1 : Math.ceil(rangeLength / o.pilasterSpacing) + 1
            for (let k = 0; k < count; ++k) {
                const center = count === 1 ? (rangeFrom + rangeTo) / 2 : rangeFrom + rangeLength * k / (count - 1)
                const wallNear = pointAlong(center - pilasterHalfWidth), wallFar = pointAlong(center + pilasterHalfWidth)
                // П из стены в комнату. pilaster00 выносит профили вправо от хода пути, а вправо от хода стены —
                // внутрь комнаты: лицо ствола проходится по ходу стены
                const pilasterPath: A2[] = [wallNear, pointOut(wallNear, pilasterProtrusion), pointOut(wallFar, pilasterProtrusion), wallFar]
                const wallPilaster = pilaster00({
                    ...pilaster,
                    pos: pointAt(0, floorY, 0),
                    path: pilasterPath.map(([x, z]) => ({ x, z })),
                    height: wallHeight,
                    startWallDirection: direction, endWallDirection: direction,
                })
                // без прокси: пилястра выступает из стены на ладонь, её держит прокси стены — экономия тел физики
                wallPilaster.vCollide = []
                _GM.mergeIndexedArrays(result, wallPilaster)
            }
        }
    }

    // Стены до низа профиля; без профиля — до потолка, с тенью у потолка
    const shadowTop = !hasProfile
    // нижняя зона: от нижнего пола
    const lowerWallHeight = profileBottomY
    wallWithPortals('front', [halfWidth, lowerLength], [-halfWidth, lowerLength], 0, lowerWallHeight, true, shadowTop, true, ceilingY)
    wallWithPortals('lowerLeft', [-halfWidth, lowerLength], [-halfWidth, 0], 0, lowerWallHeight, true, shadowTop, true, ceilingY)
    wallWithPortals('lowerRight', [halfWidth, 0], [halfWidth, lowerLength], 0, lowerWallHeight, true, shadowTop, true, ceilingY)
    // верхняя зона: от верхнего пола
    const upperWallHeight = profileBottomY - levelStep
    wallWithPortals('back', [-halfWidth, -upperLength], [halfWidth, -upperLength], levelStep, upperWallHeight, true, shadowTop, true, height)
    wallWithPortals('upperLeft', [-halfWidth, 0], [-halfWidth, -upperLength], levelStep, upperWallHeight, true, shadowTop, true, height)
    wallWithPortals('upperRight', [halfWidth, -upperLength], [halfWidth, 0], levelStep, upperWallHeight, true, shadowTop, true, height)
    // уступ по границе вне крыльца, лицом в нижнюю зону: тень у нижнего пола, верх — наружное ребро без тени
    const ledgeGapX = hasStairs ? stairsRadius : 0
    wallWithPortals(null, [-halfWidth, 0], [-ledgeGapX, 0], 0, levelStep, true, false, false)
    wallWithPortals(null, [ledgeGapX, 0], [halfWidth, 0], 0, levelStep, true, false, false)

    // ---- профиль под потолком: замкнутый прямоугольник периметра по часовой стрелке сверху — профиль
    // выступает внутрь. Полоса сама продолжает лицо стен до потолка

    if (hasProfile) {
        _GM.mergeIndexedArrays(result, profile00({
            pos: pointAt(0, profileBottomY, 0),
            path: rectangle(lowerLength, -upperLength).reverse(),
            closed: true,
            height: profileHeight,
            colorWall,
        }))
    }

    _GM.mergeIndexedArrays(result, collideBuilder.g)

    // ---- крыльцо: линия «здания» stairs00 — граница зон, площадка на уровне верхнего пола

    if (hasStairs) {
        _GM.mergeIndexedArrays(result, stairs00({
            pos: pointAt(0, 0, 0),
            radius: stairsRadius,
            wallThickness: Math.min(Math.max(.05, o.stairsWallThickness), stairsRadius / 3),
            platformHeight: levelStep,
            parapetHeight: Math.max(.1, o.stairsParapetHeight),
            hasWall: o.stairsParapet,
            stepHeight: Math.max(.05, o.stepHeight),
            stepDepth: Math.max(.1, o.stepDepth),
            stairs: o.stairs,
            colorWall: o.colorStairsWall,
            colorRiser: o.colorStairsTop,
            colorTop: o.colorStairsTop,
        }))
    }

    return result
}
