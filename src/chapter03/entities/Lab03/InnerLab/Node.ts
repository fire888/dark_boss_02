import * as THREE from 'three'
import type { I_Scheme } from './Scheme'
import { _M } from '_CORE/_M/_m'
import type { Root } from '../../../index'

export type Neighbor = {
    id: string
    dir: THREE.Vector3
    angle: number
    halfAngle: number
    leftPLocal: THREE.Vector3, angleLeft: number
    rightPLocal: THREE.Vector3, angleRight: number
}

const RADIUS_NODE = 4
const W_SIDE = 1.3
export const H_ROOM = 2.5

// Коридор — короб шириной 2*W_SIDE и высотой H_ROOM, натянутый вдоль ребра схемы.
// Если оси двух рёбер расходятся дальше диагонали сечения, короба пересечься не могут:
// хотя бы один из зазоров — горизонтальный или вертикальный — заведомо больше своего габарита.
export const CORRIDOR_CLEARANCE = Math.hypot(2 * W_SIDE, H_ROOM)

const ARC_STEP = .5
// минимальная стена между соседними проёмами, чтобы они не смыкались вплотную
const MIN_WALL_ANGLE = .05
// проём уже этого угла считаем нежизнеспособным и не создаём
const MIN_HALF_ANGLE = .12

const COL_FLOOR: [number, number, number] = [.50, .46, .42]
const COL_WALL: [number, number, number] = [.72, .69, .63]
const COL_CEIL: [number, number, number] = [.16, .15, .14]

const TAU = Math.PI * 2
const norm = (a: number) => ((a % TAU) + TAU) % TAU

// точка на ободе узла под углом a — соглашение _M.angleFromCoords2: atan2(-z, x)
const rimPoint = (a: number, r: number = RADIUS_NODE) =>
    new THREE.Vector3(Math.cos(a) * r, 0, -Math.sin(a) * r)

export class Node {
    id: string
    pos: THREE.Vector3
    visible: boolean
    neighbors: {
        [key: string]: Neighbor
    } = {}
    _root: Root

    constructor(key: string, sh: I_Scheme, root: Root) {
        this._root = root

        this.id = key
        this.pos = sh.points[key].pos
        this.visible = sh.points[key].visible

        const candidates = sh.points[key].neighbors
            .filter(nId => !!sh.points[nId])
            .map(nId => {
                const dir = sh.points[nId].pos.clone().sub(this.pos).setY(0).normalize()
                return { nId, dir, angle: _M.angleFromCoords2(dir.x, dir.z) }
            })
            .sort((a, b) => a.angle - b.angle)

        // Проём занимает сектор ±halfAngle вокруг направления на соседа. Если два соседа
        // расходятся меньше суммы их полуширин, секторы перекрываются: стена между ними
        // получает отрицательную длину и разворачивается почти на полный круг.
        // Поэтому каждый следующий проём ужимается по уже принятым, а не влезающий отбрасывается.
        const halfWanted = Math.asin(Math.min(1, W_SIDE / RADIUS_NODE))
        const accepted: { nId: string, dir: THREE.Vector3, angle: number, half: number }[] = []

        for (const cand of candidates) {
            let half = halfWanted

            for (const a of accepted) {
                const gap = Math.min(norm(cand.angle - a.angle), norm(a.angle - cand.angle))
                half = Math.min(half, gap - a.half - MIN_WALL_ANGLE)
            }

            if (half >= MIN_HALF_ANGLE) {
                accepted.push({ ...cand, half })
            }
        }

        for (const { nId, dir, angle, half } of accepted) {
            const angleLeft = norm(angle + half)
            const angleRight = norm(angle - half)

            this.neighbors[nId] = {
                id: nId,
                dir,
                angle,
                halfAngle: half,
                leftPLocal: rimPoint(angleLeft), angleLeft,
                rightPLocal: rimPoint(angleRight), angleRight,
            }
        }
    }

    getAttr() {
        const v: number[] = []
        const c: number[] = []
        const index: number[] = []

        if (!this.visible) return { v, c, index }

        let ind = 0

        const pushTri = (a: THREE.Vector3, b: THREE.Vector3, d: THREE.Vector3, col: number[]) => {
            v.push(...a.toArray(), ...b.toArray(), ...d.toArray())
            c.push(...col, ...col, ...col)
            index.push(ind, ind + 1, ind + 2)
            ind += 3
        }

        const pushQuad = (
            a: THREE.Vector3, b: THREE.Vector3, d: THREE.Vector3, e: THREE.Vector3,
            col: [number, number, number]
        ) => {
            _M.fill(_M.createPolygonV(a, b, d, e), v)
            _M.fill(_M.fillColorFace(col), c)
            for (let k = 0; k < 6; ++k) index.push(ind + k)
            ind += 6
        }

        const center = this.pos.clone()
        const centerTop = center.clone().setY(center.y + H_ROOM)
        const P = (a: number) => rimPoint(a).add(this.pos)
        const PT = (a: number) => P(a).setY(this.pos.y + H_ROOM)

        const walk = (from: number, sweep: number, cb: (t0: number, t1: number) => void) => {
            if (sweep <= 1e-6) return
            const steps = Math.max(1, Math.ceil(sweep / ARC_STEP))
            const d = sweep / steps
            for (let s = 0; s < steps; ++s) cb(from + s * d, from + (s + 1) * d)
        }

        // пол и потолок сплошные, в том числе под проёмами
        const floorAndCeil = (from: number, sweep: number) => walk(from, sweep, (t0, t1) => {
            pushTri(center, P(t0), P(t1), COL_FLOOR)
            pushTri(centerTop, PT(t1), PT(t0), COL_CEIL)
        })

        const wall = (from: number, sweep: number) => walk(from, sweep, (t0, t1) => {
            pushQuad(P(t1), P(t0), PT(t0), PT(t1), COL_WALL)
        })

        const list = Object.values(this.neighbors).sort((a, b) => a.angle - b.angle)

        if (list.length === 0) {
            floorAndCeil(0, TAU)
            wall(0, TAU)
            return { v, c, index }
        }

        for (let i = 0; i < list.length; ++i) {
            const curr = list[i]
            const next = list[(i + 1) % list.length]

            // проём: пол и потолок есть, стены нет — сюда пристыковывается коридор
            floorAndCeil(curr.angleRight, curr.halfAngle * 2)

            // глухой участок от левого края текущего проёма до правого края следующего;
            // при одном соседе формула сама даёт TAU - 2*half, то есть кольцо с одним разрывом
            const sweep = norm(next.angleRight - curr.angleLeft)
            floorAndCeil(curr.angleLeft, sweep)
            wall(curr.angleLeft, sweep)
        }

        return { v, c, index }
    }
}
