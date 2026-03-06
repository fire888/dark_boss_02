import { _M } from "_CORE/_M/_m"
import { IArrayForBuffers } from "chapter10/types/GeomTypes"
import * as THREE from "three" 
import { COL_WHITE, UV_EMPTY } from "../tileMapWall"

export const createHelix01  = (H = 8, R: number = 1): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const vCollide: number[] = [] 

    const vR = new THREE.Vector3(R, 1, R)

    const vDir = new THREE.Vector3(0, 0, 1)
    const heightSeg = new THREE.Vector3(0, .1, 0)
    const addY = new THREE.Vector3(0, .3, 0)
    const addAngle = Math.PI * .02

    while (vDir.y < H) {
        const vDirNext = vDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), addAngle).add(addY)

        const vPos0 = vDir.clone().multiply(vR)
        const vPos1 = vDirNext.clone().multiply(vR)
        const vPos2 = vPos1.clone().add(heightSeg)
        const vPos3 = vPos0.clone().add(heightSeg)

        // back
        { 
            const _v = _M.createPolygonV(vPos3, vPos2, vPos1, vPos0)
            v.push(..._v)
            c.push(...COL_WHITE)
            uv.push(...UV_EMPTY)
        }

        vDir.copy(vDirNext)
    }

    return { v, uv, c, vCollide }
}