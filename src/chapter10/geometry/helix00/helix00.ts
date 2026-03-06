import { _M, A2, A3 } from "_CORE/_M/_m"
import { IArrayForBuffers } from "chapter10/types/GeomTypes"
import * as THREE from "three" 
import { 
    COL_RED,
    COL_WHITE,
    UV_EMPTY
} from "../tileMapWall"

export type T_Floor = { 
    p0: THREE.Vector3 
    p1: THREE.Vector3
    p2: THREE.Vector3
    p3: THREE.Vector3
    d: number
    w: number
    isFillStart: boolean
    isFillEnd: boolean
}

export const createHelix00 = (H = 8, R: number = 1, R_MIN: number = .5): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const vCollide: number[] = []

    const clockDir: number = Math.random() < .5 ? 1 : -1 

    const rM = R
    const vR = new THREE.Vector3(rM, 1, rM)
    const vR_2 = new THREE.Vector3(rM - .3, 1, rM - .3)

    const vDir = new THREE.Vector3(0, 0, clockDir)
    const addY = new THREE.Vector3(0, .02, 0)
    const heightS = new THREE.Vector3(0, .1, 0)
    const addAngle = Math.PI * .04 * clockDir

    const isSpherize = Math.random() < .5

    const startPhase = Math.random()
    const H_PHASE = Math.random() * 8 + 2  

    while (vDir.y < H) {
        const vDirNext = vDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), addAngle).add(addY)

        let phase = Math.abs(Math.cos((vDir.y / H_PHASE + startPhase) * Math.PI))
        let phase2 = Math.abs(Math.cos((vDirNext.y / H_PHASE + startPhase) * Math.PI))
        //if (isConsole) console.log('phase', phase)
        if (isSpherize) {
            phase = Math.abs(Math.sin((vDir.y / H_PHASE + startPhase) * Math.PI))
            phase2 = Math.abs(Math.sin((vDirNext.y / H_PHASE + startPhase) * Math.PI))
        }

        phase = Math.max(R_MIN / R, phase)
        phase2 = Math.max(R_MIN / R, phase2)

        const _vR = vR.clone().multiplyScalar(phase).setY(1)
        const _vR_n = vR.clone().multiplyScalar(phase2).setY(1)
        const _vR_0 = vR_2.clone().multiplyScalar(phase).setY(1)
        const _vR_0_n = vR_2.clone().multiplyScalar(phase2).setY(1)

        const vPos0 = vDir.clone().multiply(_vR)
        const vPos1 = vDirNext.clone().multiply(_vR_n)
        const vPos2 = vPos1.clone().add(heightS)
        const vPos3 = vPos0.clone().add(heightS)

        const vPos0_0 = vDir.clone().multiply(_vR_0)
        const vPos1_0 = vDirNext.clone().multiply(_vR_0_n)
        const vPos2_0 = vPos1_0.clone().add(heightS)
        const vPos3_0 = vPos0_0.clone().add(heightS)

        if (vDir.y === 0) {
            const longDir = vDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * .5 * clockDir)
            const p0 = vDir.clone().multiply(_vR)
            const p1 = longDir.clone().multiplyScalar(.3).add(p0)
            const p2 = p1.clone().add(heightS)
            const p3 = p0.clone().add(heightS)

            const p0_0 = vDir.clone().multiply(_vR_0)
            const p1_0 = longDir.clone().multiplyScalar(.3).add(p0_0)
            const p2_0 = p1_0.clone().add(heightS)
            const p3_0 = p0_0.clone().add(heightS)
            
            { // outer
                const _v = clockDir > 0 ? _M.createPolygonV(p1, p0, p3, p2) : _M.createPolygonV(p2, p3, p0, p1)
                v.push(..._v)
                c.push(...COL_WHITE)
                uv.push(...UV_EMPTY)
            }
            { // inner
                const _v = clockDir > 0 ? _M.createPolygonV(p0_0, p1_0, p2_0, p3_0) : _M.createPolygonV(p3_0, p2_0, p1_0, p0_0)
                v.push(..._v)
                c.push(...COL_RED)
                uv.push(...UV_EMPTY)
            }
            { // top
                const _v = clockDir > 0 ? _M.createPolygonV(p3_0, p2_0, p2, p3) : _M.createPolygonV(p3, p2, p2_0, p3_0)
                v.push(..._v)
                c.push(...COL_WHITE)
                uv.push(...UV_EMPTY)
            }
            { // back
                const _v = clockDir > 0 ? _M.createPolygonV(p2, p2_0, p1_0, p1) : _M.createPolygonV(p1, p1_0, p2_0, p2)
                v.push(..._v)
                c.push(...COL_WHITE)
                uv.push(...UV_EMPTY)
            }
        }

        { // front

            const _v = clockDir > 0 
                ? _M.createPolygonV(vPos0, vPos1, vPos2, vPos3) 
                : _M.createPolygonV(vPos3, vPos2, vPos1, vPos0)
            v.push(..._v)
            c.push(...COL_WHITE)
            uv.push(...UV_EMPTY)
        }

        // top
        { 
            const _v = clockDir > 0 
                ? _M.createPolygonV(vPos3, vPos2, vPos2_0, vPos3_0)
                : _M.createPolygonV(vPos3_0, vPos2_0, vPos2, vPos3)
            v.push(..._v)
            c.push(...COL_WHITE)
            uv.push(...UV_EMPTY)
        }

        // bottom
        { 
            const _v = clockDir > 0 
                ? _M.createPolygonV(vPos1, vPos0, vPos0_0, vPos1_0) 
                : _M.createPolygonV(vPos1_0, vPos0_0, vPos0, vPos1)
            v.push(..._v)
            c.push(...COL_WHITE)
            uv.push(...UV_EMPTY)
        }
        // back
        { 
            const _v = clockDir > 0 
                ? _M.createPolygonV(vPos3_0, vPos2_0, vPos1_0, vPos0_0) 
                : _M.createPolygonV(vPos0_0, vPos1_0, vPos2_0, vPos3_0)
            v.push(..._v)
            c.push(...COL_RED)
            uv.push(...UV_EMPTY)
        }

        vDir.copy(vDirNext)
    }

    return { v, uv, c, vCollide }
}