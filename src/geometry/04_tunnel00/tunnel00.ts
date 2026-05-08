import { _M, IArraysGeom } from "_CORE/_M/_m"
import * as THREE from "three"

const COLOR_OUT = new THREE.Color().setStyle('#ffffff').toArray()
const COLOR_IN = new THREE.Color().setStyle('#000000').toArray()

type T = {
    w0?: number, y0?: number, h0?: number, a0?: number,
    w1?: number, y1?: number, h1?: number, a1?: number,
    d?: number,
}

const DEFAULT_OPTS: Required<T> = {
    w0: 1, y0: 0, h0: 5, a0: 0,
    w1: 1, y1: 0, h1: 5, a1: 0,
    d: 1,
}

export const tunnel00 = (opts: T = {}): IArraysGeom => {
    const {
        w0, y0, h0, a0,
        w1, y1, h1, a1,
        d,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const b = {
        fl: [-w0 * 0.5 * Math.cos(a0), y0, -w0 * 0.5 * Math.sin(a0)],
        fr: [w0 * 0.5 * Math.cos(a0), y0, w0 * 0.5 * Math.sin(a0)],
        br: [w1 * 0.5 * Math.cos(a1), y1, -d + w1 * 0.5 * Math.sin(a1)],
        bl: [-w1 * 0.5 * Math.cos(a1), y1, -d - w1 * 0.5 * Math.sin(a1)],
    }
    const t = {
        fl: [-w0 * 0.5 * Math.cos(a0), y0 + h0, -w0 * 0.5 * Math.sin(a0)],
        fr: [w0 * 0.5 * Math.cos(a0), y0 + h0, w0 * 0.5 * Math.sin(a0)],
        br: [w1 * 0.5 * Math.cos(a1), y1 + h1, -d + w1 * 0.5 * Math.sin(a1)],
        bl: [-w1 * 0.5 * Math.cos(a1), y1 + h1, -d - w1 * 0.5 * Math.sin(a1)],
    }

    const v: number[] = [
        ...b.fl, ...b.fr, ...b.br, ...b.bl, // 0 1 2 3
        ...b.br, ...b.fr, ...t.fr, ...t.br, // 4 5 6 7
        ...b.fl, ...b.bl, ...t.bl, ...t.fl, // 8 9 10 11
    ]

    const c: number[] = [
        ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT,
        ...COLOR_IN, ...COLOR_IN, ...COLOR_IN, ...COLOR_IN,
        ...COLOR_IN, ...COLOR_IN, ...COLOR_IN, ...COLOR_IN,
    ]

    const index = [
        0, 1, 2, 0, 2, 3,     // b
        4, 5, 6, 4, 6, 7,     // r
        8, 9, 10, 8, 10, 11,  // l
        10, 7, 6, 10, 6, 11,  // t
    ]

    return { index, v, c }
}