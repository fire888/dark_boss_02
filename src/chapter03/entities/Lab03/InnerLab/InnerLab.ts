import * as THREE from 'three'
import { tunnel00 } from 'geometry/04_tunnel00/tunnel00'
import { room00 } from 'geometry/05_room00/room_00'
import { _M, IArraysGeom } from '_CORE/_M/_m'
import { Root } from '../../../index'
import { Scheme } from './Scheme'

const ZERO_Y = -2.5














export class InnerLab {
    _root: Root
    mesh: THREE.Mesh
    meshCollision: THREE.Mesh

    constructor(root: Root) {
        this._root = root
        const { studio, materials, phisics } = this._root

        /////////////////////////////////

        this.#calcLevel()

        ////////////////////////////////

        const W = 100, H = 100, D = -150
        
        const g: IArraysGeom = { v: [], c: [], index: [] } 

        const t = tunnel00({
            w0: 2, h0: 4, 
            w1: 2, h1: 4, 
            d: 30 
        })
        _M.translateVertices(t.v, 0, 4.5, D)
        _M.mergeIndexedArrays(g, t)

        const r = room00()
        _M.translateVertices(r.v, 0, 4, D - 30 - 15)
        _M.mergeIndexedArrays(g, r)

        this.mesh = _M.createMesh({ ...g, material: materials.levelMatNorm })
        this.mesh.position.set(0, ZERO_Y, 0)
        this.mesh.geometry.computeVertexNormals()
        studio.add(this.mesh)

        const collG1 = this.mesh.geometry.clone().toNonIndexed()
        this.meshCollision = new THREE.Mesh(collG1, materials.collision)
        this.meshCollision.position.set(0, ZERO_Y, 0)
        phisics.addMeshToCollision(this.meshCollision, true)
    }

    async #calcLevel() {
        const sh = new Scheme(this._root)
        await sh.create()
        
        console.log('sh', sh)

        //const viewScheme = sh.makeSchemeMesh()
        //this._root.studio.add(viewScheme)
    }
}
