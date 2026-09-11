import * as THREE from 'three'
import { _M } from '_CORE/_M/_m'
import type { Root } from '../../../index'
import { Scheme, type T_StartInitDataPoint, type I_Scheme } from './Scheme'
import { Node, H_ROOM } from './Node'
import { Edge } from './Edge'
import { tunnel01 } from 'geometry/04_tunnel01/tunnel01'

export type TNodes = {
    [key: string]: Node
}

type T_Geom = { v: number[], c: number[], uv: number[], index: number[], vCollide: number[] }

// смещение всего подземелья в мировые координаты
const POS = new THREE.Vector3(0, -7, -195)

// стык с внешним уровнем: проём в стене на z = Z_GATE, x от -1 до 1, y от 2 до 6
const Z_GATE = -150
const GATE_HALF_W = 1
const GATE_Y0 = 2
const GATE_Y1 = 6
// узел, в который заходит вход, и сосед, задающий направление проёма
const GATE_NODE = 's_p1'
const GATE_DIR_NODE = 's_p0'

const COL_GATE: [number, number, number] = [.42, .40, .38]

export class InnerLab {
    _root: Root
    mesh: THREE.Mesh | null = null
    meshCollision: THREE.Mesh | null = null
    meshGate: THREE.Mesh | null = null

    nodes: TNodes = {}

    constructor(root: Root) {
        this._root = root
    }

    async build() {
        const sch = await this.#createScheme()

        this.#createNodes(sch)
        const geom = this.#collectGeometry(sch)

        this.#addToScene(geom)
        this.#addGate()
    }

    async #createScheme(): Promise<I_Scheme> {
        const startPointsData: T_StartInitDataPoint[] = [
            { id: GATE_DIR_NODE, pos: new THREE.Vector3(0, 9, 30), visible: false },
            { id: GATE_NODE, pos: new THREE.Vector3(0, 9, 15), visible: true },
            { id: 's_p3', pos: new THREE.Vector3(0, 0, 0), visible: true },
        ]

        const sch = new Scheme(this._root, startPointsData)
        await sch.create()

        return sch
    }

    // Узлы строятся раньше рёбер: ребро пристыковывается к уже посчитанным проёмам,
    // а Node мог отбросить слишком тесный проём — тогда коридор помечается broken и не рисуется.
    #createNodes(sch: I_Scheme) {
        this.nodes = {}
        for (const key in sch.points) {
            this.nodes[key] = new Node(key, sch, this._root)
        }
    }

    #collectGeometry(sch: I_Scheme): T_Geom {
        const geom: T_Geom = { v: [], c: [], uv: [], index: [], vCollide: [] }

        // vCollide не индексируется и mergeIndexedArrays его не знает, поэтому
        // просто дописывается следом: смещать в нём нечего
        const add = (part: { v: number[], c?: number[], uv?: number[], index?: number[], vCollide?: number[] }) => {
            _M.mergeIndexedArrays(geom, part)
            if (part.vCollide) _M.fill(part.vCollide, geom.vCollide)
        }

        for (const key in this.nodes) {
            add(this.nodes[key].getAttr())
        }

        for (const key in sch.lines) {
            const edge = new Edge(key, sch, this.nodes, this._root)
            add(edge.getAttr())
        }

        return geom
    }

    #addToScene({ v, c, uv, index, vCollide }: T_Geom) {
        const { studio, materials, phisics } = this._root

        this.mesh = _M.createMesh({ v, c, uv, index, material: materials.levelMatNorm })
        this.mesh.position.copy(POS)
        studio.add(this.mesh)

        // коллизия идёт по собственному прокси фабрик, а не по клону рендер-меша
        this.meshCollision = _M.createMesh({ v: vCollide, material: materials.collision })
        this.meshCollision.position.copy(POS)
        phisics.addMeshToCollision(this.meshCollision, true)
    }

    // Короб между проёмом внешнего уровня и проёмом узла GATE_NODE. Это тот же tunnel01,
    // что и на рёбрах: концы у него разного роста — снаружи дыра в стене высотой
    // GATE_Y1 - GATE_Y0, внутри проём высотой H_ROOM, — и это ровно тот случай, под который
    // у фабрики есть h1.
    #addGate() {
        const { studio, materials, phisics } = this._root

        const node = this.nodes[GATE_NODE]
        const portal = node && node.neighbors[GATE_DIR_NODE]
        if (!portal) return

        // смотрим на узел снаружи, поэтому левый край проёма становится правым краем входа
        const inR = portal.leftPLocal.clone().add(node.pos).add(POS)
        const inL = portal.rightPLocal.clone().add(node.pos).add(POS)

        const outL = new THREE.Vector3(-GATE_HALF_W, GATE_Y0, Z_GATE)
        const outR = new THREE.Vector3(GATE_HALF_W, GATE_Y0, Z_GATE)

        // p0 -> p1 -> p2 -> p3 обходит пол по кругу: сначала наружная пара, потом внутренняя,
        // поэтому ближний конец короба — дыра в стене, дальний — проём узла
        const gate = tunnel01({
            p0: outL.toArray(), p1: outR.toArray(),
            p2: inR.toArray(), p3: inL.toArray(),
            h: GATE_Y1 - GATE_Y0,
            h1: H_ROOM,
            colFloor: COL_GATE, colWall: COL_GATE, colCeil: COL_GATE,
        })

        // POS уже учтён в inL/inR, а outL/outR заданы в мировых координатах,
        // поэтому меш входа, в отличие от основного, никуда не сдвигается
        this.meshGate = _M.createMesh({ ...gate, material: materials.levelMatNorm })
        studio.add(this.meshGate)

        // коллизия по прокси фабрики, а не по клону рендер-меша: короб нарезан на секции
        // под текстуру, физике эта нарезка не нужна
        const collision = _M.createMesh({ v: gate.vCollide || [], material: materials.collision })
        phisics.addMeshToCollision(collision, true)
    }
}
