import { _M } from "../_m"
import { tileMapWall } from '../tileMapWall'
import { IArrayForBuffers } from "../../types/GeomTypes"
import { Root } from "../../index"
import { COLOR_BLUE } from "../../constants/CONSTANTS"

export const createColumn00 = (w: number, h: number, n: number = 8): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    
    let W = .21
    if (w !== .21 * 2) {
        W = w * .5
    }

    const PATH: [number, number][] = [
        [W + .05, 0],
        [W + .05, .16],
        [W, 0.23],
        [W, h - .2],
        [W + .09, h - .15],
        [W + .09, h],
    ]

    const r = _M.lathePath(
        PATH,
        n,
        COLOR_BLUE,
        tileMapWall.white,
    )

    v.push(...r.v)
    c.push(...r.c)
    uv.push(...r.uv)

    return { v, c, uv }
}