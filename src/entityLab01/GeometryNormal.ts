import { _M } from "../geometry/_m"
import * as THREE from "three"
import { createWaySystem } from "geometry/waySystem/waySystem"
import { pause } from "helpers/htmlHelpers"

import { VERT_COUNT, UV_COUNT } from './Way'


export class GeometryNormal {
    geometry: THREE.BufferGeometry
    geomCollision: THREE.BufferGeometry

    constructor() {
        console.log('[MESSAGE:] USE NORMAL (NOT WORKER)')

        this.geometry = new THREE.BufferGeometry()

        const posF32 = new Float32Array(VERT_COUNT)
        const normalsF32 = new Float32Array(VERT_COUNT)
        const colorF32 = new Float32Array(VERT_COUNT)
        const uvF32 = new Float32Array(UV_COUNT)

        this.geometry.setAttribute('position', new THREE.BufferAttribute(posF32, 3))
        this.geometry.setAttribute('normal', new THREE.BufferAttribute(normalsF32, 3))
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colorF32, 3))
        this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvF32, 2))

        //////////////////////////

        this.geomCollision = new THREE.BufferGeometry()
        const posF32Collide = new Float32Array(6000 * 3)
        this.geomCollision.setAttribute('position', new THREE.BufferAttribute(posF32Collide, 3))
    }

    async rebuild() {
        const { geomData: { v, c, uv, vCollide }, segments } = createWaySystem()

        await pause(1)
        
        console.log('[MESSAGE:] verticies level n:', v.length / 3)
        console.log('[MESSAGE:] verticies collision n:', vCollide.length / 3)

        const centerSeg = segments[Math.floor(segments.length / 2)]
        const centerPoint = centerSeg.axisP1.clone() 
        const lastSeg = segments[segments.length - 1]
        const endPoint = lastSeg.axisP1.clone()

        const geom = this.geometry        
        _M.fillStart(v, geom.attributes.position.array)
        _M.fillStart(c, geom.attributes.color.array)
        _M.fillStart(uv, geom.attributes.uv.array)
        const n = _M.computeNormalsV(v)
        _M.fillStart(n, geom.attributes.normal.array)

        const geomCollide = this.geomCollision
        _M.fillStartAndThousandLast(vCollide, geomCollide.attributes.position.array)

        return { centerPoint, endPoint }
    } 
}