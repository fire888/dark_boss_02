import { Root } from "../index"
import { _M } from "../geometry/_m"
import * as THREE from "three"
import { T_ROOM } from "types/GeomTypes"
import { IS_USE_WORKER } from '../constants/CONSTANTS'
import { GeometryWorker } from "./GeometryWorker"
import { GeometryNormal } from "./GeometryNormal"
import * as TWEEN from '@tweenjs/tween.js'

export const VERT_COUNT = 700000 * 3 * 4
export const UV_COUNT = 700000 * 2 * 4
export const COLLIDE_VERT_COUNT = 6000 * 3 * 4

export class Way {
    name: string
    startPoint: THREE.Vector3
    endPoint: THREE.Vector3
    centerPoint: THREE.Vector3
    segments: T_ROOM[]
    
    _root: Root
    _m: THREE.Mesh
    _mCollision: THREE.Mesh
    
    _worker: Worker
    _flagComplete: Int32Array
    _coordsLongWayParts: Float32Array

    _builderGeometries: GeometryWorker | GeometryNormal 

    constructor(name: string, root: Root) {
        this._root = root
        
        this.name = name
        this.endPoint = new THREE.Vector3()
        this.startPoint = new THREE.Vector3()
        this.centerPoint = new THREE.Vector3()

        if (IS_USE_WORKER && window.Worker && window.SharedArrayBuffer) {
            try {
                this._builderGeometries = new GeometryWorker()
            } catch (e) {
                console.log('NO WORKER !!!', e)
                this._builderGeometries = new GeometryNormal()
            }
        } else {
            this._builderGeometries = new GeometryNormal()
        }

        this._m = new THREE.Mesh(this._builderGeometries.geometry, this._root.materials.materialLab)
        this._m.frustumCulled = false
        this._root.studio.add(this._m)

        this._mCollision = new THREE.Mesh(this._builderGeometries.geomCollision, this._root.materials.collision)
        this._mCollision.name = 'Col|' + this.name
    }

    async build (startPoint: THREE.Vector3, mode = 'normal') {
        this._m.scale.set(1, 0, 1)

        const { centerPoint, endPoint } = await this._builderGeometries.rebuild()

        this.startPoint = startPoint.clone()
        this.centerPoint.copy(centerPoint).add(this.startPoint)
        this.endPoint.copy(endPoint).add(this.startPoint)
        
        this._m.geometry.attributes.position.needsUpdate = true
        this._m.geometry.attributes.color.needsUpdate = true
        this._m.geometry.attributes.uv.needsUpdate = true
        this._m.geometry.attributes.normal.needsUpdate = true
        this._m.position.copy(this.startPoint)

        this._root.phisics.removeMeshFromCollision(this._mCollision.name)
        this._mCollision.name += '|_'
        this._mCollision.geometry.attributes.position.needsUpdate = true
        this._mCollision.position.copy(this.startPoint)
        this._root.phisics.addMeshToCollision(this._mCollision)

        const obj = { v: 0 }
        new TWEEN.Tween(obj)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .to({ v: 1 }, mode === 'fast' ? 2500 : 12000)
            .onUpdate(() => {
                this._m.scale.set(1, obj.v, 1)
            })
            .start()
    }
}
