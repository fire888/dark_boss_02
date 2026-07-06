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

    #calcLevel() {
        const sh = new Scheme()
        //console.log(sh.scheme)


        const v: number[] = []

        const H = 60

        const geomBox = new THREE.BoxGeometry(1, 1, 1)
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: 2
        }) 


        for (let key in sh.scheme.lines) {
            const { p0, p1, dist } = sh.scheme.lines[key]

            const vPrev = sh.scheme.points[p0]
            const vCurr = sh.scheme.points[p1]

            if (!vPrev || !vCurr) {
                console.warn('Invalid line:', key, sh.scheme.lines[key])
                continue
            }

            const l = _M.createLabel(p1, [1, 0, 0], 10)
            l.position.copy(vCurr.pos).add(new THREE.Vector3(0, H, 0))
            this._root.studio.add(l)

            
            const dir = new THREE.Vector3().copy(vCurr.pos).sub(vPrev.pos).normalize()
            const w = .1
            const vp0 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * .5).multiplyScalar(w).add(vPrev.pos) 
            const vp1 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5).multiplyScalar(w).add(vPrev.pos) 
            const vp2 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5).multiplyScalar(w).add(vCurr.pos) 
            const vp3 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * .5).multiplyScalar(w).add(vCurr.pos)

            const _v = _M.createPolygonV(vp0, vp1, vp2, vp3)
            _M.fill(_v, v)
        }

        const mesh = _M.createMesh({ v, material: mat })
        mesh.position.set(0, H, 0)
        this._root.studio.add(mesh)



    }
}
