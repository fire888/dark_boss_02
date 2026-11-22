import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import { floor01 } from "geometry/00_floor01/floor01"
import { wall00 } from "geometry/08_wall00/wall00"

// Туннель с перепадом высот: вход и выход на разных уровнях, между ними — пандус.
//
// Вход — две точки на одном уровне (entryLeft, entryRight), выход — две точки на другом (exitLeft, exitRight).
// Левая и правая — если идти по туннелю от входа к выходу. Бока туннеля в плане — прямые entryLeft → exitLeft
// и entryRight → exitRight, концы открыты (на входе и выходе стоят порталы или проёмы соседних комнат).
// y точек — уровень пола у входа и у выхода; если у пары точек y разный, берётся среднее.
//
// Пол — три плоских участка: у входа горизонтальный, потом пандус, у выхода снова горизонтальный. Чтобы на изломах
// пол оставался плоским, обе линии излома горизонтальны и параллельны друг другу: пандус — одна плоскость,
// проходящая через две горизонтальные прямые. Их направление — среднее между направлением входа и выхода
// (от левой точки к правой), поэтому вход и выход срезаны под углом к изломам, когда туннель поворачивает.
// Длина горизонтальных участков — entryFlatLength и exitFlatLength, по нормали к линиям излома; от линии входа
// и выхода отсчёт ведётся от дальней от излома точки. Если туннель для них короток, участки сжимаются.
//
// Как строится: весь туннель собирается горизонтальным на уровне входа, из трёх участков по линиям излома,
// а потом каждая вершина поднимается на высоту пола над ней — функцию, линейную поперёк линий излома на пандусе
// и постоянную на горизонтальных участках. Сдвиг по y, линейный в плане, плоскость оставляет плоскостью,
// вертикальную стену — вертикальной: стена над пандусом становится параллелограммом, кладка идёт по уклону.
// Запечённый свет пандуса — как у горизонтального пола; на пологом уклоне разница не видна.
//
// Пол — floor01 плитой floorThickness под уровнем пола, потолок — floor01 по развёрнутому контуру (верх вниз) плитой
// ceilingThickness над потолком. Потолок идёт параллельно полу на высоте height в свету. Стены — кладка wall00
// изнутри, от пола до потолка, с тенью у пола и у потолка; наружного лица и торцов нет.

type T = {
    pos?: A3,              // начало координат точек входа и выхода
    entryLeft?: A3,        // левая точка входа на уровне пола
    entryRight?: A3,       // правая точка входа; y — тот же, что у левой
    exitLeft?: A3,         // левая точка выхода на уровне пола
    exitRight?: A3,        // правая точка выхода; y — тот же, что у левой
    height?: number,       // высота потолка над полом, в свету
    entryFlatLength?: number, // длина горизонтального участка у входа, до начала пандуса
    exitFlatLength?: number,  // длина горизонтального участка у выхода, после конца пандуса
    floorThickness?: number,   // толщина плиты пола
    ceilingThickness?: number, // толщина плиты потолка
    masonryTileSize?: number,  // сторона тайла кладки стен, в метрах
    // длина, на которую растягивается тайл тени у угла стены с полом и потолком; видимая тень — примерно её четверть
    aoLength?: number,
    colorMasonry?: A3,     // базовый цвет кладки до запечённого освещения
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // вход у зрителя шириной 4, выход дальше по −z на 3 выше, чуть повёрнут и сдвинут вправо
    entryLeft: [-2, 0, 6],
    entryRight: [2, 0, 6],
    exitLeft: [-1, 3, -9],
    exitRight: [2.8, 3, -7.8],
    height: 4,
    entryFlatLength: 3,
    exitFlatLength: 3,
    floorThickness: .15,
    ceilingThickness: .2,
    masonryTileSize: 1.2,
    aoLength: .5,
    colorMasonry: [.22, .2, .36],
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    // вход поперёк x на z = 0, туннель уходит в −z; выход повёрнут вокруг своего центра
    const entryWidth = rand(2.5, 6), exitWidth = rand(2.5, 6)
    const length = rand(10, 28)
    const exitCenter: A3 = [rand(-4, 4), rand(-5, 5), -length]
    const exitAngle = rand(-.5, .5)
    const exitHalf: A2 = [Math.cos(exitAngle) * exitWidth / 2, Math.sin(exitAngle) * exitWidth / 2]
    return {
        entryLeft: [-entryWidth / 2, 0, 0],
        entryRight: [entryWidth / 2, 0, 0],
        exitLeft: [exitCenter[0] - exitHalf[0], exitCenter[1], exitCenter[2] - exitHalf[1]],
        exitRight: [exitCenter[0] + exitHalf[0], exitCenter[1], exitCenter[2] + exitHalf[1]],
        height: rand(2.5, 6),
        entryFlatLength: rand(0, 5),
        exitFlatLength: rand(0, 5),
        floorThickness: rand(.05, .3),
        ceilingThickness: rand(.05, .4),
        masonryTileSize: rand(.8, 1.8),
        aoLength: rand(.3, .7),
        colorMasonry: [rand(.2, .85), rand(.2, .8), rand(.3, .85)],
    }
}

export const room01 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const { pos, aoLength, colorMasonry } = o
    const result: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }

    const height = Math.max(.1, o.height)
    const floorThickness = Math.max(0, o.floorThickness)
    const ceilingThickness = Math.max(0, o.ceilingThickness)
    const masonryTileSize = Math.max(.1, o.masonryTileSize)
    // уровни пола у входа и выхода
    const entryY = (o.entryLeft[1] + o.entryRight[1]) / 2
    const exitY = (o.exitLeft[1] + o.exitRight[1]) / 2
    const rise = exitY - entryY

    const plan = (point: A3): A2 => [point[0], point[2]]
    const entryLeft = plan(o.entryLeft), entryRight = plan(o.entryRight)
    const exitLeft = plan(o.exitLeft), exitRight = plan(o.exitRight)
    const dot = (a: A2, b: A2) => a[0] * b[0] + a[1] * b[1]
    const unit = (a: A2): A2 => {
        const length = Math.hypot(a[0], a[1])
        return length > 1e-9 ? [a[0] / length, a[1] / length] : [0, 0]
    }

    // ---- линии излома: направление — среднее между входом и выходом, across — нормаль к ним по ходу туннеля

    const entryDirection = unit([entryRight[0] - entryLeft[0], entryRight[1] - entryLeft[1]])
    const exitDirection = unit([exitRight[0] - exitLeft[0], exitRight[1] - exitLeft[1]])
    const breakDirection = unit([entryDirection[0] + exitDirection[0], entryDirection[1] + exitDirection[1]])
    if (breakDirection[0] === 0 && breakDirection[1] === 0) return result
    let across: A2 = [-breakDirection[1], breakDirection[0]]
    const forward: A2 = [(exitLeft[0] + exitRight[0] - entryLeft[0] - entryRight[0]) / 2, (exitLeft[1] + exitRight[1] - entryLeft[1] - entryRight[1]) / 2]
    if (dot(across, forward) < 0) across = [-across[0], -across[1]]

    // Положение поперёк линий излома: вход целиком до первого излома, выход — после второго
    const entryEnd = Math.max(dot(entryLeft, across), dot(entryRight, across))
    const exitStart = Math.min(dot(exitLeft, across), dot(exitRight, across))
    const available = exitStart - entryEnd
    // туннель вывернут или вход с выходом перекрываются поперёк изломов
    if (available < .1) return result
    // горизонтальные участки сжимаются, если не оставляют места пандусу
    let entryFlat = Math.max(0, o.entryFlatLength), exitFlat = Math.max(0, o.exitFlatLength)
    const flatLimit = available * .8
    if (entryFlat + exitFlat > flatLimit) {
        const scale = flatLimit / (entryFlat + exitFlat)
        entryFlat *= scale
        exitFlat *= scale
    }
    const rampStart = entryEnd + entryFlat, rampEnd = exitStart - exitFlat

    // высота пола над уровнем входа в точке плана
    const riseAt = (x: number, z: number) => {
        const position = x * across[0] + z * across[1]
        return rise * Math.min(1, Math.max(0, (position - rampStart) / (rampEnd - rampStart)))
    }
    // кусок собран горизонтальным — каждая вершина поднимается на высоту пола над ней (pos вычитается: функция
    // задана в координатах точек)
    const lift = (piece: IBuffersGeom): IBuffersGeom => {
        for (const array of [piece.v, piece.vCollide]) {
            for (let i = 0; i < array.length; i += 3) array[i + 1] += riseAt(array[i] - pos[0], array[i + 2] - pos[2])
        }
        return piece
    }

    // ---- бока туннеля, разрезанные линиями излома: доля длины бока, где он пересекает линию position

    const sideCuts = (start: A2, end: A2): number[] => {
        const startAt = dot(start, across), endAt = dot(end, across)
        const fraction = (position: number) => Math.min(1, Math.max(0, (position - startAt) / (endAt - startAt)))
        return [0, fraction(rampStart), fraction(rampEnd), 1]
    }
    const leftCuts = sideCuts(entryLeft, exitLeft), rightCuts = sideCuts(entryRight, exitRight)
    const lerp = (start: A2, end: A2, fraction: number): A2 =>
        [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction]

    // ---- участки: вход, пандус, выход — пол, потолок и обе стены каждого

    for (let section = 0; section < 3; ++section) {
        const leftFrom = lerp(entryLeft, exitLeft, leftCuts[section]), leftTo = lerp(entryLeft, exitLeft, leftCuts[section + 1])
        const rightFrom = lerp(entryRight, exitRight, rightCuts[section]), rightTo = lerp(entryRight, exitRight, rightCuts[section + 1])

        // Контур участка; floor01 ждёт обход против часовой стрелки сверху — положительную площадь в осях [x, −z]
        const contour: A2[] = [leftFrom, rightFrom, rightTo, leftTo]
        if (Math.abs(_GM.polygonArea2(contour)) < 1e-6) continue
        if (_GM.polygonArea2(contour.map(([x, z]): A2 => [x, -z])) < 0) contour.reverse()
        const contourPoints = contour.map(([x, z]) => ({ x, z }))

        // пол: верх плиты — на уровне пола
        _GM.mergeIndexedArrays(result, lift(floor01({
            pos: [pos[0], pos[1] + entryY - floorThickness, pos[2]], contour: contourPoints, height: floorThickness,
        })))
        // потолок: контур по часовой стрелке — верх смотрит вниз; плита свисает от верха до низа потолка
        _GM.mergeIndexedArrays(result, lift(floor01({
            pos: [pos[0], pos[1] + entryY + height + ceilingThickness, pos[2]],
            contour: [...contourPoints].reverse(), height: -ceilingThickness,
        })))

        // Стены: лицо wall00 — вправо от хода start → end. Левая стена идёт по ходу туннеля, правая — навстречу,
        // но направление «вправо» в осях проверяется явно: лицо должно смотреть к другому боку туннеля
        const wallPiece = (start: A2, end: A2, towardInside: A2) => {
            const length = Math.hypot(end[0] - start[0], end[1] - start[1])
            if (length < 1e-6) return
            const facesInside = -(end[1] - start[1]) * towardInside[0] + (end[0] - start[0]) * towardInside[1] > 0
            const [wallStart, wallEnd] = facesInside ? [start, end] : [end, start]
            const wallDirection: A2 = [(wallEnd[0] - wallStart[0]) / length, (wallEnd[1] - wallStart[1]) / length]
            _GM.mergeIndexedArrays(result, lift(wall00({
                pos: [pos[0], pos[1] + entryY, pos[2]],
                start: wallStart, end: wallEnd,
                height,
                tileSize: masonryTileSize,
                // сетка кладки — от проекции на направление стены: участки одной стены продолжают одну кладку
                tileOffsetX: dot(wallStart, wallDirection),
                tileOffsetY: 0,
                shadowBottom: true, shadowTop: true, aoLength,
                colorWall: colorMasonry,
            })))
        }
        const leftMiddle = lerp(leftFrom, leftTo, .5), rightMiddle = lerp(rightFrom, rightTo, .5)
        wallPiece(leftFrom, leftTo, [rightMiddle[0] - leftMiddle[0], rightMiddle[1] - leftMiddle[1]])
        wallPiece(rightFrom, rightTo, [leftMiddle[0] - rightMiddle[0], leftMiddle[1] - rightMiddle[1]])
    }

    return result
}
