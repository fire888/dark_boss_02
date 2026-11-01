import { _M } from "_CORE/_M/_m"
import { IArrayForBuffers } from "../GeomTypes"
import * as THREE from "three" 

type T_f = {
    w: number
    d?: number
    wStep: number
    maxH: number
    posXInd?: number[]
    negXInd?: number[]
    posZInd?: number[]
    negZInd?: number[]
    isHole?: boolean
}

export type T_Floor01 = IArrayForBuffers & {
    negZInd: number[], posZInd: number[],
    posXInd: number[], negXInd: number[]
}

export const createFloor01 = (opts: T_f): T_Floor01 => {

    const { w = 100, d = w, wStep = 3, maxH = .3, isHole = false } = opts

    const v: number[] = []
    const index: number[] = []
    const uv: number[] = []
    const c: number[] = []
    const vCollide: number[] = []

    const p: number[][][] = []


    const countX = Math.ceil(w / wStep)
    const countZ = Math.ceil(d / wStep)

    const stepX = w / countX
    const stepZ = d / countZ

    for (let i = 0; i < countZ + 1; i++) {
        const z = d * 0.5 - i * stepZ
        const arr = []
        for (let j = 0; j < countX + 1; j++) { 
            const x = -w * 0.5 + j * stepX + (i % 2 * stepX * .5)
            const h = Math.random() * maxH
            arr.push([x, h, z])
        }
        p.push(arr)
    }

    const negZInd: number[] = []
    const posZInd: number[] = []
    const posXInd: number[] = []
    const negXInd: number[] = []

    let countIndex = 0

    const color = new THREE.Color().setStyle('#e9ffff')
    const colorB = new THREE.Color().setStyle('#9f009f')

    for (let i = 1; i < p.length; ++i) { 
        const prevZRow = p[i - 1]
        const curZRow = p[i] 

        for (let j = 1; j < curZRow.length; ++j) {

            // CRUTCH ~ hole must be parametric 
            if (isHole) {
                if (
                    i > 2 && 
                    i < 10 && 
                    j > prevZRow.length / 2 - 3 && 
                    j < prevZRow.length / 2 + 3
                ) {
                    continue   
                }
            }
            // 
            
            const p0 = prevZRow[j - 1]
            const p1 = prevZRow[j]
            const p2 = curZRow[j]
            const p3 = curZRow[j - 1]

            v.push(...p0, ...p1, ...p2, ...p3)
            uv.push(0, 0, 1, 0, 1, 1, 0, 1)
            c.push(
                ...color.clone().lerp(colorB, 1 - p0[1] / maxH).toArray(),
                ...color.clone().lerp(colorB, 1 - p1[1] / maxH).toArray(),
                ...color.clone().lerp(colorB, 1 - p2[1] / maxH).toArray(),
                ...color.clone().lerp(colorB, 1 - p3[1] / maxH).toArray(),
            )
            index.push(
                countIndex, countIndex + 1, countIndex + 3, 
                countIndex + 1, countIndex + 2, countIndex + 3
            )

            if (j === curZRow.length - 1) {
                posXInd.push(countIndex + 1, countIndex + 2)                    
            }

            if (j === 1) {
                negXInd.push(countIndex, countIndex + 3)
            }

            if (i === 1) {
                posZInd.push(countIndex, countIndex + 1)
            }

            if (i === p.length - 1) {
                negZInd.push(countIndex + 3, countIndex + 2)
            }

            countIndex += 4
        } 
    }

    for (let i = 0; i < v.length; ++i) {
        vCollide.push(v[i])
    }

    return { index, v, uv, c, vCollide, negZInd, posZInd, posXInd, negXInd }
}