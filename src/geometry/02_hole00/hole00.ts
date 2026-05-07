import { _M } from "_CORE/_M/_m"
import { IArrayForBuffers } from "../GeomTypes"
import * as THREE from "three"

type I_hole00_opts = {
    w: number, h: number,
    holeOffstX: number, holeOffstY: number,
    holeW: number, holeH: number
}

const DEFAULT_HOLE_OPTS: I_hole00_opts = {
    w: 5, h: 10,
    holeOffstX: 0, holeOffstY: 1,
    holeW: .5, holeH: 1,
}

const COLOR_OUT = new THREE.Color().setStyle('#e1e1e1').toArray()

export const hole00 = (opts: I_hole00_opts = DEFAULT_HOLE_OPTS): IArrayForBuffers => {
    const { 
        w = DEFAULT_HOLE_OPTS.w, h = DEFAULT_HOLE_OPTS.h,
        holeOffstX = DEFAULT_HOLE_OPTS.holeOffstX, holeOffstY = DEFAULT_HOLE_OPTS.holeOffstY,
        holeW = DEFAULT_HOLE_OPTS.holeW, holeH = DEFAULT_HOLE_OPTS.holeH
    } = opts

    const hW = w * .5
    const hHoleW = holeW * .5

    const v: number[] = [
        -hW, 0, 0,                                     // 0
        hW, 0, 0,                                      // 1
        hW, h, 0,                                      // 2
        -hW, h, 0,                                     // 3

        holeOffstX - hHoleW, holeOffstY, 0,            // 4
        holeOffstX + hHoleW, holeOffstY, 0,            // 5
        holeOffstX + hHoleW, holeOffstY + holeH, 0,    // 6
        holeOffstX - hHoleW, holeOffstY + holeH, 0     // 7
    ]
    const c: number[] = [
        ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, 
        ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT
    ]
    const index: number[] = [
        0, 1, 5, 0, 5, 4,
        1, 2, 6, 1, 6, 5,
        2, 3, 7, 2, 7, 6,
        3, 0, 4, 3, 4, 7
    ]

    const g: IArrayForBuffers = { v, c, index }

    return g
}