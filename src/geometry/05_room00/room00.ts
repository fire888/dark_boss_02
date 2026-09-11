import type { IArrayForBuffers } from "geometry/GeomTypes"
import { uvQuad, uvPoint, TILE_FLOOR_FINE, TILE_WALL, TILE_CEIL_ROUND } from "geometry/atlasUv"

// Круглый зал: пол, потолок и стена по ободу радиуса r, с разрывами стены под проёмы.
// Проём задаётся парой углов — правым и левым краем сектора; в нём стены нет, а пол
// и потолок обрываются по хорде между краями, потому что к этой хорде пристыковывается
// коридор (tunnel01), и дуга обода выпирала бы в него язычком.
// Угол отсчитывается по соглашению _M.angleFromCoords2, то есть atan2(-z, x).

type A3 = number[]

export type T_Portal = {
    angleRight: number,
    angleLeft: number,
}

type T = {
    pos?: A3,
    r?: number,
    h?: number,
    // проёмы, отсортированные по возрастанию центрального угла; пустой список даёт
    // сплошное кольцо стены
    portals?: T_Portal[],
    // шаг разбиения дуги: чем меньше, тем глаже обод
    arcStep?: number,
    colFloor?: A3, colWall?: A3, colCeil?: A3,
    // тайлы атласа (geometry/atlasUv).
    // Пол и потолок развёрнуты полярно: u — угол, v — радиус, поэтому прямоугольная
    // текстура ложится на круг кольцами, вертикальная полоса на ней становится радиальной
    // балкой, а нижняя полоса — элементом в самом центре (см. maps/map03 и map04).
    // Стена берёт по экземпляру тайла на сегмент дуги: повторить тайл через wrapS нельзя,
    // uv за его границей залезет в соседний тайл.
    tileFloor?: number, tileWall?: number, tileCeil?: number,
    // сколько копий тайла укладывается на полный оборот; рисунки map03 и map04 нарисованы
    // под это же число. Период у пола и потолка общий: по его границам режется дуга,
    // и два разных периода потребовали бы двух наборов разрезов
    turns?: number,
    // секторов развёртки на копию тайла. Ставится равным числу балок на тайле потолка
    // (map04.BEAMS): тогда осевая линия балки ложится на ребро веера, а ребро веера —
    // это отрезок из центра зала, то есть настоящий радиус. Внутри треугольника uv
    // интерполируется линейно, и любая другая линия развёртки станет хордой, а не лучом,
    // отчего балки на потолке расходятся веером вместо схождения в центр
    uvSectors?: number,
}

const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    r: 4,
    h: 3.5,
    portals: [],
    arcStep: .5,
    colFloor: [.50, .46, .42],
    colWall: [.72, .69, .63],
    // colCeil: [.16, .15, .14],
    colCeil: [.75, .73, .72],
    tileFloor: TILE_FLOOR_FINE,
    tileWall: TILE_WALL,
    tileCeil: TILE_CEIL_ROUND,
    turns: 4,
    uvSectors: 3,
}

const TAU = Math.PI * 2
const norm = (a: number) => ((a % TAU) + TAU) % TAU

export const room00 = (opts: T = {}): IArrayForBuffers => {
    const {
        pos, r, h, portals, arcStep,
        colFloor, colWall, colCeil,
        tileFloor, tileWall, tileCeil, turns, uvSectors,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const index: number[] = []
    // прокси для физики: та же форма, но развёрнутая в triangle soup, потому что
    // createTrimesh читает только position и не смотрит на index. Пока повторяет v
    // один в один; когда v обрастёт деталями, vCollide останется грубым залом.
    const vCollide: number[] = []

    let ind = 0

    // uvTri — 6 чисел, по паре на вершину, в порядке a, b, d
    const pushTri = (a: A3, b: A3, d: A3, col: A3, uvTri: number[]) => {
        v.push(...a, ...b, ...d)
        c.push(...col, ...col, ...col)
        uv.push(...uvTri)
        index.push(ind, ind + 1, ind + 2)
        ind += 3
    }

    // прокси для физики пишется отдельно и своим, более грубым шагом: дробление,
    // которое нужно развёртке, физике не нужно и менять её не должно
    const collideTri = (a: A3, b: A3, d: A3) => {
        vCollide.push(...a, ...b, ...d)
    }

    // квад — 4 вершины и 6 индексов; вершины не переиспользуются между гранями,
    // иначе computeVertexNormals сгладит стык стены с полом
    const pushQuad = (a: A3, b: A3, d: A3, e: A3, col: A3, tile: number) => {
        v.push(...a, ...b, ...d, ...e)
        c.push(...col, ...col, ...col, ...col)
        uv.push(...uvQuad(tile))
        index.push(ind, ind + 1, ind + 2, ind, ind + 2, ind + 3)
        ind += 4
    }

    const collideQuad = (a: A3, b: A3, d: A3, e: A3) => {
        vCollide.push(...a, ...b, ...d, ...a, ...d, ...e)
    }

    const center: A3 = [pos[0], pos[1], pos[2]]
    const centerTop: A3 = [pos[0], pos[1] + h, pos[2]]

    // точка на ободе под углом a
    const P = (a: number): A3 => [pos[0] + Math.cos(a) * r, pos[1], pos[2] - Math.sin(a) * r]
    const PT = (a: number): A3 => [pos[0] + Math.cos(a) * r, pos[1] + h, pos[2] - Math.sin(a) * r]
    const up = (p: A3): A3 => [p[0], p[1] + h, p[2]]

    // период полярной развёртки: на него приходится одна копия тайла
    const TURN = TAU / Math.max(1, Math.round(turns))
    const clamp01 = (x: number) => x < 0 ? 0 : x > 1 ? 1 : x
    // угол в долю тайла по горизонтали
    const uOf = (a: number) => (((a % TURN) + TURN) % TURN) / TURN

    // сектор пола и потолка разом: вершина в центре зала (v = 0), две другие — на радиусах
    // vX и vY. u обеих краевых вершин обязан лежать в одном периоде, иначе развёртка
    // протянет текстуру назад через весь тайл; за это отвечают разрезы в walk и в проёме.
    // Потолок обходится в обратную сторону — снизу он виден с другой стороны
    const fanTri = (x: A3, y: A3, uX: number, uY: number, vX: number, vY: number) => {
        const uM = clamp01((uX + uY) * .5)
        const uA = clamp01(uX)
        const uB = clamp01(uY)

        pushTri(center, x, y, colFloor, [
            ...uvPoint(tileFloor, uM, 0),
            ...uvPoint(tileFloor, uA, vX),
            ...uvPoint(tileFloor, uB, vY),
        ])
        pushTri(centerTop, up(y), up(x), colCeil, [
            ...uvPoint(tileCeil, uM, 0),
            ...uvPoint(tileCeil, uB, vY),
            ...uvPoint(tileCeil, uA, vX),
        ])
    }

    // точка пересечения хорды проёма с лучом из центра под углом e; радиус нужен для v
    const chordAt = (a: A3, b: A3, e: number): { p: A3, vRad: number } => {
        const dx = Math.cos(e)
        const dz = -Math.sin(e)
        const cross = (px: number, pz: number) => dx * pz - dz * px

        const ax = a[0] - pos[0], az = a[2] - pos[2]
        const den = cross(b[0] - a[0], b[2] - a[2])
        const t = Math.abs(den) < 1e-9 ? .5 : -cross(ax, az) / den

        const p: A3 = [a[0] + (b[0] - a[0]) * t, a[1], a[2] + (b[2] - a[2]) * t]
        return { p, vRad: clamp01(Math.hypot(p[0] - pos[0], p[2] - pos[2]) / r) }
    }

    // сектор развёртки: его границы обязаны быть рёбрами веера, иначе балка потолка
    // размажется по треугольнику. Внутри сектора дробим ещё, если arcStep требует
    // более гладкого обода. Границы периода TURN сами попадают в эту сетку
    const SUB = TURN / Math.max(1, Math.round(uvSectors))
    // дробим сектор на чётное число частей: тогда его середина — тоже узел сетки,
    // а осевая линия балки проходит ровно по ребру веера, а не внутри треугольника
    const SUB_PARTS = 2 * Math.max(1, Math.ceil(SUB / (2 * arcStep)))
    const STEP = SUB / SUB_PARTS

    // обход дуги по сетке развёртки: куски режутся по её узлам, концы дуги обрезают
    // крайние куски. Так ни один треугольник не пересекает ни границу сектора,
    // ни границу периода, где u скачет с 1 на 0
    const walk = (from: number, sweep: number, cb: (t0: number, t1: number) => void) => {
        if (sweep <= 1e-6) return
        const to = from + sweep
        let t0 = from
        while (t0 < to - 1e-9) {
            const next = Math.min(to, Math.floor(t0 / STEP + 1e-9) * STEP + STEP)
            cb(t0, next)
            t0 = next
        }
    }

    // обход для прокси: равномерный шаг по arcStep и ничего не знает про развёртку
    const coarseWalk = (from: number, sweep: number, cb: (t0: number, t1: number) => void) => {
        if (sweep <= 1e-6) return
        const steps = Math.max(1, Math.ceil(sweep / arcStep))
        const d = sweep / steps
        for (let s = 0; s < steps; ++s) cb(from + s * d, from + (s + 1) * d)
    }

    // прокси: пол, потолок и стена тем же контуром, но без разрезов под текстуру
    const collideArc = (from: number, sweep: number) => coarseWalk(from, sweep, (t0, t1) => {
        collideTri(center, P(t0), P(t1))
        collideTri(centerTop, PT(t1), PT(t0))
        collideQuad(P(t1), P(t0), PT(t0), PT(t1))
    })

    const collidePortal = (p: T_Portal) => {
        collideTri(center, P(p.angleRight), P(p.angleLeft))
        collideTri(centerTop, PT(p.angleLeft), PT(p.angleRight))
    }

    // пол и потолок сплошные, в том числе под проёмами
    const floorAndCeil = (from: number, sweep: number) => walk(from, sweep, (t0, t1) => {
        const u0 = uOf(t0)
        fanTri(P(t0), P(t1), u0, u0 + (t1 - t0) / TURN, 1, 1)
    })

    const portalFloorAndCeil = (p: T_Portal) => {
        const aR = p.angleRight
        // проём может лежать верхом на нуле, тогда левый край меньше правого
        const aL = p.angleLeft < aR ? p.angleLeft + TAU : p.angleLeft
        const A = P(aR)
        const B = P(aL)

        // Хорда проёма режется по тем же узлам сетки развёртки, что и дуга. Узлы нужны
        // по двум причинам: на границе периода u скачет с 1 на 0, а на середине сектора
        // проходит ось балки потолка, и если она окажется внутри треугольника, то станет
        // хордой вместо радиуса. Точки разреза лежат не на ободе, а на самой хорде,
        // поэтому у них свой радиус, а не 1
        let e0 = aR
        let from = A
        let vFrom = 1
        let uFrom = uOf(aR)

        for (;;) {
            const next = Math.floor(e0 / STEP + 1e-9) * STEP + STEP
            if (next >= aL - 1e-9) break

            const { p: m, vRad } = chordAt(A, B, next)
            fanTri(from, m, uFrom, uFrom + (next - e0) / TURN, vFrom, vRad)

            e0 = next
            from = m
            vFrom = vRad
            uFrom = uOf(next)
        }

        fanTri(from, B, uFrom, uFrom + (aL - e0) / TURN, vFrom, 1)
    }

    const wall = (from: number, sweep: number) => walk(from, sweep, (t0, t1) => {
        pushQuad(P(t1), P(t0), PT(t0), PT(t1), colWall, tileWall)
    })

    if (portals.length === 0) {
        floorAndCeil(0, TAU)
        wall(0, TAU)
        collideArc(0, TAU)
        return { index, v, uv, c, vCollide }
    }

    for (let i = 0; i < portals.length; ++i) {
        const curr = portals[i]
        const next = portals[(i + 1) % portals.length]

        // проём: пол и потолок есть, стены нет — сюда пристыковывается коридор
        portalFloorAndCeil(curr)

        // глухой участок от левого края текущего проёма до правого края следующего;
        // при одном проёме формула сама даёт кольцо с единственным разрывом
        const sweep = norm(next.angleRight - curr.angleLeft)
        floorAndCeil(curr.angleLeft, sweep)
        wall(curr.angleLeft, sweep)

        collidePortal(curr)
        collideArc(curr.angleLeft, sweep)
    }

    return { index, v, uv, c, vCollide }
}
