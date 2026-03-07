import { IArrayForBuffers } from "chapter10/types/GeomTypes"
import { _M } from "_CORE/_M/_m"
import { COL_RED, UV_POINTS } from "../tileMapWall"
import * as THREE from "three"

export const createPlatform01Round = (R2: number = .6): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const vCollide: number[] = []

    const R = R2 - .3
    let appendZ = 0

    const DIR_MAX = Math.PI * .9
    const currDir = new THREE.Vector3(0, 0, 1)
    
    const MaxN = 10
    let n = 0
    const step = DIR_MAX / MaxN

    const vH = new THREE.Vector3(0, -.3, 0)

    while (n < MaxN) {
        ++n 
        
        const newDir = currDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), step)
        
        const p0 = currDir.clone().multiplyScalar(R2)
        const p1 = newDir.clone().multiplyScalar(R2)
        const p2 = newDir.clone().multiplyScalar(R)
        const p3 = currDir.clone().multiplyScalar(R)

        if (n === 1) {
            p0.z = p1.z
            p3.z = p2.z
            appendZ = p0.z           
        }

        const p0_0 = p0.clone().add(vH)
        const p1_0 = p1.clone().add(vH)
        const p2_0 = p2.clone().add(vH)
        const p3_0 = p3.clone().add(vH)

        currDir.copy(newDir)

        { // top
            const _v = _M.createPolygonV(p0, p1, p2, p3)
            _M.fill([..._v], v)
            _M.fill(COL_RED, c)
            _M.fill(UV_POINTS, uv)

            _M.fill([..._v], vCollide)
        }
        { // right
            const _v = _M.createPolygonV(p0_0, p1_0, p1, p0)
            _M.fill(_v, v)
            _M.fill(COL_RED, c)
            _M.fill(UV_POINTS, uv)
        }
        { // left
            const _v = _M.createPolygonV(p2_0, p3_0, p3, p2)
            _M.fill(_v, v)
            _M.fill(COL_RED, c)
            _M.fill(UV_POINTS, uv)
        }
        { // bottom
            const _v = _M.createPolygonV(p3_0, p2_0, p1_0, p0_0)
            _M.fill(_v, v)
            _M.fill(COL_RED, c)
            _M.fill(UV_POINTS, uv)
        }
        if (n + 1 >= MaxN) { // side last
            const _v = _M.createPolygonV(p1, p1_0, p2_0, p2)
            _M.fill(_v, v)
            _M.fill(COL_RED, c)
            _M.fill(UV_POINTS, uv)
        }
    }

    const _v: number[] = []
    _M.fill(v, _v)
    const _c: number[] = []
    _M.fill(c, _c)
    const _uv: number[] = []
    _M.fill(uv, _uv)
    _M.appendMirrorX(_v, _c, _uv)
    _M.fill(_v, v)
    _M.fill(_c, c)
    _M.fill(_uv, uv)

    const _vCol: number[] = []
    _M.fill(vCollide, _vCol)
    _M.appendMirrorX(_vCol, vCollide)
    _M.fill(_vCol, vCollide)

    _M.translateVertices(v, 0, 0, -appendZ)
    _M.translateVertices(vCollide, 0, 0, -appendZ)

    
    return { v, c, uv, vCollide }
}