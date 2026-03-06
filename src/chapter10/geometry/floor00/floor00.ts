import { _M } from "_CORE/_M/_m"
import { IArrayForBuffers } from "chapter10/types/GeomTypes"
import * as THREE from "three" 
import { 
    UV_POINTS, COL_RED, COL_GREEN_BLUE,
    UV_DARK, COL_BLUE_TOP, 
    UV_TRIANGLE, COL_BLUE_HIGHT,
    UV_GRID, UV_GRID_CIRCLE,
    UV_HT, COL_WHITE
} from "../tileMapWall"

const S = .3

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

export const createFloor00 = (floor: T_Floor): IArrayForBuffers => {
    const { d, w, p0, p1, p2, p3, isFillStart, isFillEnd } = floor

    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const vCollide: number[] = []

    const countD = Math.ceil(d / S)
    const countW = Math.ceil(w / S)

    const p0_p1: THREE.Vector3[] = []
    const p3_p2: THREE.Vector3[] = []

    // divide front\back lines
    for (let i = 0; i < (countD + 1); ++i) {
        const cur = i / countD
        
        p0_p1.push(new THREE.Vector3(
            p0.x * (1 - cur) + p1.x * cur, 
            p0.y * (1 - cur) + p1.y * cur, 
            p0.z * (1 - cur) + p1.z * cur
        ))
        p3_p2.push(new THREE.Vector3(
            p3.x * (1 - cur) + p2.x * cur, 
            p3.y * (1 - cur) + p2.y * cur,  
            p3.z * (1 - cur) + p2.z * cur
        ))
    }

    let mode = 'ARROW'
    const ran = Math.random()
    if (ran < .25) {
        mode = 'GRID'
    } else if (ran < .5) { 
        mode = 'DARK'
    } else if (ran < .75) {
        mode = 'HI_TECH'
    }

    // fill tiles full perimeter
    for (let i = 1; i < p0_p1.length; ++i) {
        for (let j = 1; j < countW + 1; ++j) {
            const p0 = p0_p1[i - 1].clone().sub(p3_p2[i - 1]).multiplyScalar((j - 1) / countW).add(p3_p2[i - 1])
            const p1 = p0_p1[i - 1].clone().sub(p3_p2[i - 1]).multiplyScalar(j / countW).add(p3_p2[i - 1])
            const p2 = p0_p1[i].clone().sub(p3_p2[i]).multiplyScalar(j / countW).add(p3_p2[i])
            const p3 = p0_p1[i].clone().sub(p3_p2[i]).multiplyScalar((j - 1) / countW).add(p3_p2[i]) 

            if (mode === 'ARROW') {
                const ran = Math.random()
                if (ran < .08) { // random black
                    const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                    v.push(..._v)
                    uv.push(...UV_POINTS)
                    c.push(...COL_RED)
                } else if (ran < .16) { // random gray
                    const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                    v.push(..._v)
                    uv.push(...UV_DARK)
                    c.push(...COL_BLUE_TOP)
                } else {
                    let isSide = false

                    if (j === 1) isSide = true
                    if (j === countW) isSide = true
                    if (i === 1 && isFillStart) isSide = true
                    if (i === p0_p1.length - 1 && isFillEnd) isSide = true

                    if (isSide) { // black border
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_POINTS)
                        c.push(...COL_RED)
                    } else { // normal
                        const ran = Math.random()
                        if (ran < .1) { // back
                            const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                            v.push(..._v)
                            uv.push(...UV_TRIANGLE)
                            c.push(...COL_BLUE_HIGHT)
                        } else {
                            const _v = _M.createPolygon(p2.toArray(), p3.toArray(), p0.toArray(), p1.toArray())
                            v.push(..._v)
                            uv.push(...UV_TRIANGLE)
                            c.push(...COL_WHITE)
                        }
                    }
                }
            }

            if (mode === 'GRID') {
                let isSide = false

                if (j === 1) isSide = true
                if (j === countW) isSide = true
                if (i === 1 && isFillStart) isSide = true
                if (i === p0_p1.length - 1 && isFillEnd) isSide = true

                if (isSide) { // black border
                    const r = Math.random()
                    if (r > .2) { 
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_POINTS)
                        c.push(...COL_RED)
                    } else {
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_DARK)
                        c.push(...COL_BLUE_TOP)
                    }
                } else { // normal
                    const ran = Math.random()
                    if (ran < .1) { // back
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_GRID)
                        c.push(...COL_WHITE)
                    } else if (ran < .13) { 
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_DARK)
                        c.push(...COL_BLUE_TOP)
                    } else if (ran < .135) {
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_POINTS)
                        c.push(...COL_RED)
                    } else {
                        const _v = _M.createPolygon(p2.toArray(), p3.toArray(), p0.toArray(), p1.toArray())
                        v.push(..._v)
                        uv.push(...UV_GRID_CIRCLE)
                        c.push(...COL_WHITE)
                    }
                }
            }

            if (mode === 'DARK') {
                let isSide = false

                if (j === 1) isSide = true
                if (j === countW) isSide = true
                if (i === 1 && isFillStart) isSide = true
                if (i === p0_p1.length - 1 && isFillEnd) isSide = true

                if (isSide) {
                    if (Math.random() > .04) {
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_POINTS)
                        if (Math.random() > .06) {
                            c.push(...COL_GREEN_BLUE) 
                        } else {
                            c.push(...COL_RED) 
                        }
                    } else {
                        const _v = _M.createPolygon(p2.toArray(), p3.toArray(), p0.toArray(), p1.toArray())
                        v.push(..._v)
                        uv.push(...UV_DARK)
                        c.push(...COL_BLUE_TOP)
                    }
                } else {
                    const r = Math.random()
                    if (r < .03) {
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_POINTS)
                        c.push(...COL_RED)
                    } else if (r < .06) {
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_POINTS)
                        c.push(...COL_GREEN_BLUE)
                    } else {
                        const _v = _M.createPolygon(p2.toArray(), p3.toArray(), p0.toArray(), p1.toArray())
                        v.push(..._v)
                        uv.push(...UV_DARK)
                        c.push(...COL_BLUE_TOP)
                    }
                }
            }

            if (mode === 'HI_TECH') {
                let isSide = false

                if (j === 1) isSide = true
                if (j === countW) isSide = true
                if (i === 1 && isFillStart) isSide = true
                if (i === p0_p1.length - 1 && isFillEnd) isSide = true

                if (isSide) {
                    if (Math.random() > .04) {
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_POINTS)
                        if (Math.random() > .06) {
                            c.push(...COL_WHITE) 
                        } else {
                            c.push(...COL_RED) 
                        }
                    } else {
                        const _v = _M.createPolygon(p2.toArray(), p3.toArray(), p0.toArray(), p1.toArray())
                        v.push(..._v)
                        uv.push(...UV_DARK)
                        c.push(...COL_BLUE_TOP)
                    }
                } else {
                    const r = Math.random()
                    if (r < .03) {
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_POINTS)
                        c.push(...COL_WHITE)
                    } else if (r < .06) {
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_POINTS)
                        c.push(...COL_GREEN_BLUE)
                    } else if (r < .07) {
                        const _v = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
                        v.push(..._v)
                        uv.push(...UV_DARK)
                        c.push(...COL_WHITE)
                    } else {
                        const _v = _M.createPolygon(p2.toArray(), p3.toArray(), p0.toArray(), p1.toArray())
                        v.push(..._v)
                        uv.push(...UV_HT)
                        c.push(...COL_WHITE)
                    }
                }
            }
        }
    }
    
    const _vCollide = _M.createPolygon(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray())
    vCollide.push(..._vCollide) 

    return { v, uv, c, vCollide }
}