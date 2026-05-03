import { _M } from "_CORE/_M/_m"
import { IArrayForBuffers } from "../GeomTypes"
import * as THREE from "three" 

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

type T_f = {
    w: number
    d?: number
    wStep: number
    maxH: number
}

export const createFloor01 = (opts: T_f): IArrayForBuffers => {

    const { w = 100, d = w, wStep = 3, maxH = .3 } = opts

    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const vCollide: number[] = []

    const p: number[][][] = []


    const countX = Math.ceil(w / wStep)
    const countZ = Math.ceil(d / wStep)

    const stepX = w / countX
    const stepZ = d / countZ

    for (let i = 0; i < countZ; i++) {
        const z = d * 0.5 - i * stepZ
        const arr = []
        for (let j = 0; j < countX; j++) { 
            const x = -w * 0.5 + j * stepX - (i % 2 * stepX * .5)
            const h = Math.random() * maxH
            arr.push([x, h, z])
        }
        p.push(arr)
    }


    for (let i = 1; i < p.length; ++i) { 
        const curZRow = p[i] 
        const prevZRow = p[i - 1]
        for (let j = 1; j < curZRow.length; ++j) {
            const p0 = prevZRow[j - 1]
            const p1 = prevZRow[j]
            const p2 = curZRow[j]

            v.push(...p0, ...p1, ...p2)
            uv.push(0, 0, 1, 0, .5, 1)
            c.push(1, 1, 1)


            const p3 = prevZRow[j - 1]
            const p4 = curZRow[j]
            const p5 = curZRow[j - 1]
            
            v.push(...p3, ...p4, ...p5)
            uv.push(.5, 0, 1, 1, 0, 1)
            c.push(1, 1, 1)
        } 
    }

    for (let i = 0; i < v.length; ++i) {
        vCollide.push(v[i])
    }

    return { v, uv, c, vCollide }
}