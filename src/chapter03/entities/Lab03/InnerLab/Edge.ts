import * as THREE from 'three'
import type { I_Scheme } from './Scheme'
import { _M } from '_CORE/_M/_m'
import type { Root } from '../../../index'
import { H_ROOM } from './Node'
import type { TNodes } from './InnerLab'

const COL_FLOOR: [number, number, number] = [.46, .42, .38]
const COL_WALL: [number, number, number] = [.66, .63, .58]
const COL_CEIL: [number, number, number] = [.14, .13, .12]

export class Edge {
    id: string
    node0Id: string
    node1Id: string
    // p0/p1 — края проёма у node0, p2/p3 — у node1;
    // p0 и p3 лежат с одной стороны коридора, p1 и p2 — с другой
    p0: THREE.Vector3 = new THREE.Vector3()
    p1: THREE.Vector3 = new THREE.Vector3()
    p2: THREE.Vector3 = new THREE.Vector3()
    p3: THREE.Vector3 = new THREE.Vector3()
    visible: boolean = true
    isBroken: boolean = false

    _root: Root

    constructor(key: string, sh: I_Scheme, nodes: TNodes, root: Root) {
        this._root = root

        const line = sh.lines[key]

        this.id = key
        this.node0Id = line.p0
        this.node1Id = line.p1
        this.visible = line.visible

        const node0 = nodes[this.node0Id]
        const node1 = nodes[this.node1Id]

        // проём мог быть отброшен в Node как слишком узкий — тогда коридор некуда пристыковать
        const portal0 = node0 && node0.neighbors[this.node1Id]
        const portal1 = node1 && node1.neighbors[this.node0Id]

        if (!portal0 || !portal1) {
            this.isBroken = true
            return
        }

        this.p0 = portal0.leftPLocal.clone().add(node0.pos)
        this.p1 = portal0.rightPLocal.clone().add(node0.pos)
        this.p2 = portal1.leftPLocal.clone().add(node1.pos)
        this.p3 = portal1.rightPLocal.clone().add(node1.pos)
    }

    getAttr() {
        const v: number[] = []
        const c: number[] = []
        const index: number[] = []

        if (!this.visible || this.isBroken) return { v, c, index }

        let ind = 0
        const pushQuad = (
            a: THREE.Vector3, b: THREE.Vector3, d: THREE.Vector3, e: THREE.Vector3,
            col: [number, number, number]
        ) => {
            _M.fill(_M.createPolygonV(a, b, d, e), v)
            _M.fill(_M.fillColorFace(col), c)
            for (let k = 0; k < 6; ++k) index.push(ind + k)
            ind += 6
        }

        const up = new THREE.Vector3(0, H_ROOM, 0)
        const p0H = this.p0.clone().add(up)
        const p1H = this.p1.clone().add(up)
        const p2H = this.p2.clone().add(up)
        const p3H = this.p3.clone().add(up)

        pushQuad(this.p0, this.p1, this.p2, this.p3, COL_FLOOR)
        pushQuad(p3H, p2H, p1H, p0H, COL_CEIL)
        pushQuad(this.p0, this.p3, p3H, p0H, COL_WALL)
        pushQuad(this.p2, this.p1, p1H, p2H, COL_WALL)

        return { v, c, index }
    }
}
