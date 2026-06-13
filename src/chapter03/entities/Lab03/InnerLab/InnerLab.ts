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
        // _M.translateVertices(r.v, 0, 4, 0)
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

    #calcLevel() {
       const sh = new Scheme()
       console.log(sh.scheme)


       const v: number[] = []

       const H = 15


       const geomBox = new THREE.BoxGeometry(1, 1, 1)
       const mat = new THREE.MeshBasicMaterial({
           color: 0xffffff,
           side: 2
       }) 
       for (let i = 0; i < sh.scheme.length; i++) {
            const branch = sh.scheme[i]
            for (let j = 1; j < branch.length; j++) {
                const vPrev = branch[j - 1]
                const vCurr = branch[j]
                const dir = new THREE.Vector3().copy(vCurr).sub(vPrev).normalize()
                const p0 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * .5).add(vPrev) 
                const p1 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5).add(vPrev) 
                const p2 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5).add(vCurr) 
                const p3 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * .5).add(vCurr)
                
                const _v = _M.createPolygonV(p0, p1, p2, p3)
                //console.log(_v)
                _M.fill(_v, v)

                const l = _M.createLabel('' + i, [1, 0, 0], 10)
                l.position.copy(vCurr).add(new THREE.Vector3(0, H, 0))
                this._root.studio.add(l)
            }





           //const mesh = new THREE.Mesh(geomBox, mat)
           //mesh.position.copy(v3)
           //this._root.studio.add(mesh)
       }

       const mesh = _M.createMesh({ v, material: mat })
       mesh.position.set(0, H, 0)
       this._root.studio.add(mesh)


    }
}
