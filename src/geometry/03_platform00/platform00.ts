import { _M } from "_CORE/_M/_m"
import { IArrayForBuffers } from "../GeomTypes"
import * as THREE from "three"


type T = {
    w0: number, y0: number
    w1: number, y1: number
    d: number,
    h: number
}


const DEFAULT_OPTS: T = {
    w0: 1, y0: .5,
    w1: 1, y1: .5,
    d: 1,
    h: .5
}

const COLOR_OUT = new THREE.Color().setStyle('#000000').toArray()
const COLOR_IN = new THREE.Color().setStyle('#ffffff').toArray()

export const platform00 = (opts: T = DEFAULT_OPTS): IArrayForBuffers => {
    const { 
        w0 = DEFAULT_OPTS.w0, y0 = DEFAULT_OPTS.y0, 
        w1 = DEFAULT_OPTS.w1, y1 = DEFAULT_OPTS.y1, 
        d = DEFAULT_OPTS.d, h = DEFAULT_OPTS.h 
    } = opts


    const v: number[] = [
        // top White
        -w0 * 0.5, y0, 0,
        w0 * 0.5, y0, 0,
        w1 * 0.5, y1, -d,
        -w1 * 0.5, y1, -d,  // 3

        // black 
        // top
        -w0 * 0.5, y0, 0, // 4
        w0 * 0.5, y0, 0,  // 5
        w1 * 0.5, y1, -d,  // 6
        -w1 * 0.5, y1, -d, // 7
        // bottom
        -w0 * 0.5, y0 - h, 0, // 8
        w0 * 0.5, y0 - h, 0, // 9
        w1 * 0.5, y1 - h, -d, // 10
        -w1 * 0.5, y1 - h, -d, // 11
    ]

    const index = [
        0, 1, 2, 0, 2, 3,  // top
        //4, 5, 6, 4, 6, 7,
        9, 8, 11, 9, 11, 10, // bottom
        // sides
        8, 9, 5, 8, 5, 4,
        9, 10, 6, 9, 6, 5,
        10, 11, 7, 10, 7, 6,
        11, 8, 4, 11, 4, 7
    ]

    const c: number[] = [
        ...COLOR_IN, ...COLOR_IN, ...COLOR_IN, ...COLOR_IN,
        ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT,
        ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT,
        ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT,
        ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT,
        ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT,
    ]

    return { index, v, c }
}