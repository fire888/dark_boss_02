import * as THREE from 'three'
import { tunnel00 } from 'geometry/04_tunnel00/tunnel00'
import { _M, IArraysGeom } from '_CORE/_M/_m'
import { Root } from '../../../index'
import { Scheme, T_StartInitDataPoint, SchemeTest, I_Scheme } from './Scheme'
import { Node } from './Node'
import { Edge } from './Edge'

export type TNodes = { 
    [key: string]: Node 
}

export class InnerLab {
    _root: Root
    mesh: THREE.Mesh | null = null
    meshCollision: THREE.Mesh | null = null

    nodes: TNodes = {}

    constructor(root: Root) {
        this._root = root
    }

    async build() {
        const { studio, materials, phisics } = this._root

        const startPoints = await this.#calcLevel()

        const D = -150

        
        const v: number[] = []

        {
            const _v = _M.createPolygonV(
                new THREE.Vector3(-1, 2, D),
                new THREE.Vector3(1, 2, D),
                startPoints.rP,
                startPoints.lP,
            )
            _M.fill(_v, v)
        }
        {
            const _v = _M.createPolygonV(
                new THREE.Vector3(-1, 2, D),
                startPoints.lP,
                startPoints.lP.clone().add(new THREE.Vector3(0, 2.5, 0)),
                new THREE.Vector3(-1, 6, D),
            )
            _M.fill(_v, v)
        }

        {
            const _v = _M.createPolygonV(
                new THREE.Vector3(-1, 2, D),
                startPoints.lP,
                startPoints.lP.clone().add(new THREE.Vector3(0, 2.5, 0)),
                new THREE.Vector3(-1, 6, D),
            )
            _M.fill(_v, v)
        }

        {
            const _v = _M.createPolygonV(

                startPoints.rP,
                new THREE.Vector3(1, 2, D),
                new THREE.Vector3(1, 6, D),
                startPoints.rP.clone().add(new THREE.Vector3(0, 2.5, 0)),
            )
            _M.fill(_v, v)
        }

        {
            const _v = _M.createPolygonV(
                startPoints.lP.clone().add(new THREE.Vector3(0, 2.5, 0)),
                startPoints.rP.clone().add(new THREE.Vector3(0, 2.5, 0)),
                new THREE.Vector3(1, 6, D),
                new THREE.Vector3(-1, 6, D),
            )
            _M.fill(_v, v)
        }


        
        this.mesh = _M.createMesh({ v, material: materials.levelMatNorm })
        this.mesh.geometry.computeVertexNormals()
        studio.add(this.mesh)

        const collG1 = this.mesh.geometry.clone().toNonIndexed()
        this.meshCollision = new THREE.Mesh(collG1, materials.collision)
        phisics.addMeshToCollision(this.meshCollision, true)
    }

    async #calcLevel() {
        const { studio, phisics } = this._root


        const POS = new THREE.Vector3(0, -7, -195)

        
        const startPointsData: T_StartInitDataPoint[] = [
            { id: 's_p0', pos: new THREE.Vector3(0, 9, 30), visible: false },
            { id: 's_p1', pos: new THREE.Vector3(0, 9, 15), visible: true },
            { id: 's_p3', pos: new THREE.Vector3(0, 0, 0), visible: true },
        ] 

        //const sch = new Scheme(this._root, startPointsData)
        //await sch.create()

        const sch = new SchemeTest()
        await sch.create()
        
        console.log('sh !!!!', sch)

        const v: number[] = []
        const c: number[] = []
        const index: number[] = []

        for (let key in sch.points) {
            const node = new Node(key, sch, this._root)
            const attr = node.getAttr()
            _M.mergeIndexedArrays({ v, c, index }, attr)

            this.nodes[key] = node
        }

        console.log('this.nodes', this.nodes)

        for (let key in sch.lines) {
            const edge = new Edge(key, sch, this.nodes, this._root)
            const attr = edge.getAttr()
            _M.mergeIndexedArrays({ v, c, index }, attr)
        }

        const m = _M.createMesh({ 
            v, c, index,
            material: new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true }) 
        })
        m.position.copy(POS)

        studio.add(m)
        phisics.addMeshToCollision(m, true)

        let enterPoints = {
            lP: new THREE.Vector3(),
            rP: new THREE.Vector3(),            
        }

        if (this.nodes['s_p1']) {
            enterPoints = {
                rP: this.nodes['s_p1'].neighbors['s_p0'].leftPLocal.clone().add(this.nodes['s_p1'].pos).add(POS),
                lP: this.nodes['s_p1'].neighbors['s_p0'].rightPLocal.clone().add(this.nodes['s_p1'].pos).add(POS),
            }
        }

        return enterPoints
    }

}
