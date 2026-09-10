import * as THREE from 'three'
import type { I_Scheme } from './Scheme'
import { _M } from '_CORE/_M/_m'
import type { Root } from '../../../index'
import { room00 } from 'geometry/05_room00/room00'

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
export const H_ROOM = 3.5

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
        if (!this.visible) return { v: [], c: [], index: [], vCollide: [] }

        return room00({
            pos: this.pos.toArray(),
            r: RADIUS_NODE,
            h: H_ROOM,
            arcStep: ARC_STEP,
            portals: Object.values(this.neighbors)
                .sort((a, b) => a.angle - b.angle)
                .map(({ angleRight, angleLeft }) => ({ angleRight, angleLeft })),
            colFloor: COL_FLOOR,
            colWall: COL_WALL,
            colCeil: COL_CEIL,
        })
    }
}
