import { _M, IArraysGeom } from "_CORE/_M/_m"
import * as THREE from "three"

const COLOR_OUT = new THREE.Color().setStyle('#000000').toArray()
const COLOR_IN = new THREE.Color().setStyle('#ffffff').toArray()

type T = {
    w?: number
    d?: number
    h?: number
}

const DEFAULT_OPTS: Required<T> = { w: 1, d: 1, h: 3 }

export const box00 = (opts: T = DEFAULT_OPTS): IArraysGeom => {
    const {
        w, d, h
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const v: number[] = []
    const index: number[] = []
    const c: number[] = []

    // front
    const f0 = [-w * 0.5, 0, d * 0.5]
    const f1 = [w * 0.5, 0, d * 0.5]
    const f2 = [w * 0.5, h, d * 0.5]
    const f3 = [-w * 0.5, h, d * 0.5]

    v.push(...f0, ...f1, ...f2, ...f3)
    c.push(...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT)
    
    index.push(0, 1, 2, 0, 2, 3)

    // back
    const b0 = [w * 0.5, 0, -d * 0.5]
    const b1 = [-w * 0.5, 0, -d * 0.5]
    const b2 = [-w * 0.5, h, -d * 0.5]
    const b3 = [w * 0.5, h, -d * 0.5]

    v.push(...b0, ...b1, ...b2, ...b3)
    c.push(...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT)

    index.push(4, 5, 6, 4, 6, 7)

    // right
    v.push(...f1, ...b0, ...b3, ...f2) 
    index.push(8, 9, 10, 8, 10, 11)
    c.push(...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT)

    // top
    v.push(...f3, ...f2, ...b3, ...b2)
    index.push(12, 13, 14, 12, 14, 15)
    c.push(...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT)

    // bottom
    v.push(...b1, ...b0, ...f1, ...f0)
    index.push(16, 17, 18, 16, 18, 19)
    c.push(...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT)

    // left 
    v.push(...b1, ...f0, ...f3, ...b2)
    index.push(20, 21, 22, 20, 22, 23)
    c.push(...COLOR_IN, ...COLOR_IN, ...COLOR_IN, ...COLOR_IN)

    return { index, v, c }
}