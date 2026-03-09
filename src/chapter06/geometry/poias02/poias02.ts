import { _M } from "../_m"
import { tileMapWall } from '../tileMapWall'
import { IArrayForBuffers } from "../../types/GeomTypes"
import { Root } from "../../index"

import { COLOR_BLUE_D } from "../../constants/CONSTANTS"

const PROFILE = [
    [0, 0],
    [0, 0],
    [0, .05],
    [.05, .05],
    [.05, .2],
    [0, .2],
    [0, .35],
    [.15, .35],
    [.15, .45],
    [.0, .5],
]

const n = []
for (let i = 0; i < PROFILE.length; ++i) {
    n.push([PROFILE[i][0] - .1, PROFILE[i][1]])
}

export const createPoias02 = (w: number, h: number = 1.3, d: number = 0): IArrayForBuffers => {
    const v: number[] = []
    const uv: number[] = []
    const c: number[] = []

    let profile = PROFILE
    if (h !== 1.3) {
        profile = []
        for (let i = 0; i < PROFILE.length; ++i) {
            if (i < 6) {
                profile.push([PROFILE[i][0], PROFILE[i][1]])
            } else {
                profile.push([PROFILE[i][0], PROFILE[i][1] - .5 + h])
            }
        }
    }

    if (d !== 0) {
        const profileD = []
        for (let i = 0; i < profile.length; ++i) {
            if (i === 0 || i === profile.length - 1) {
                profileD.push([profile[i][0], profile[i][1]])
            } else {
                profileD.push([profile[i][0] + d, profile[i][1]])
            }
        }
        profile = profileD
    }

    {
        const converted = _M.convertSimpleProfileToV3(profile)
        const r = _M.fillPoligonsV3(converted, converted, w, tileMapWall.noise, COLOR_BLUE_D, .5, true)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)
    }

    return { v, uv, c }
}
