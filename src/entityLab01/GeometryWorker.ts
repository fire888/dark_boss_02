import { _M } from "../geometry/_m"
import * as THREE from "three"

import { VERT_COUNT, UV_COUNT, COLLIDE_VERT_COUNT } from './Way'

export class GeometryWorker {
    _flagComplete: Int32Array
    _coordsLongWayParts: Float32Array
    _worker: Worker

    geometry: THREE.BufferGeometry
    geomCollision: THREE.BufferGeometry

    constructor() {
        console.log('[MESSAGE:] USE WORKER')
        
        const flagCompleteSAB = new SharedArrayBuffer(4)
        this._flagComplete = new Int32Array(flagCompleteSAB)

        const coordsLongWayPartsSAB = new SharedArrayBuffer(4 * 9)
        this._coordsLongWayParts = new Float32Array(coordsLongWayPartsSAB)

        ////////////////////////////////////////
        
        const sabVertex = new SharedArrayBuffer(VERT_COUNT)
        const posF32 = new Float32Array(sabVertex)

        const sabNormals = new SharedArrayBuffer(VERT_COUNT)
        const normalsF32 = new Float32Array(sabNormals)

        const sabColor = new SharedArrayBuffer(VERT_COUNT)
        const colorF32 = new Float32Array(sabColor)

        const sabUv = new SharedArrayBuffer(UV_COUNT)
        const uvF32 = new Float32Array(sabUv)

        this.geometry = new THREE.BufferGeometry()
        this.geometry.setAttribute('position', new THREE.BufferAttribute(posF32, 3))
        this.geometry.setAttribute('normal', new THREE.BufferAttribute(normalsF32, 3))
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colorF32, 3))
        this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvF32, 2))

        /////////////////////////////////////////


        const sabVertexCollide = new SharedArrayBuffer(COLLIDE_VERT_COUNT)
        const posF32Collide = new Float32Array(sabVertexCollide)
        
        this.geomCollision = new THREE.BufferGeometry()
        this.geomCollision.setAttribute('position', new THREE.BufferAttribute(posF32Collide, 3))

        ////////////////////////////////////////

        this._worker = new Worker(new URL('./geomWorkerFile.ts', import.meta.url))
        this._worker.postMessage({ 
            keyMessage: 'init', 
            sabVertex, sabColor, sabNormals, VERT_COUNT,
            sabUv, UV_COUNT,
            sabVertexCollide, COLLIDE_VERT_COUNT,
            coordsLongWayPartsSAB,
            flagCompleteSAB
        })
    }   

    async rebuild() {
        return new Promise<{ centerPoint: THREE.Vector3, endPoint: THREE.Vector3 }>((resolve, reject) => {
            const tick = () => {
                if (Atomics.load(this._flagComplete, 0) === 1) {
                    Atomics.store(this._flagComplete, 0, 0)
                    
                    const centerPoint = new THREE.Vector3().set(this._coordsLongWayParts[3], this._coordsLongWayParts[4], this._coordsLongWayParts[5])
                    const endPoint = new THREE.Vector3().set(this._coordsLongWayParts[6], this._coordsLongWayParts[7], this._coordsLongWayParts[8])
                    
                    resolve({ centerPoint, endPoint })
                } else {
                    setTimeout(tick, 10)
                }
            }
            tick()

            this._worker.postMessage({ keyMessage: 'update' })
        })
    }

}