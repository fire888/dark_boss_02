import { _M } from "../_m"
import { tileMapWall } from '../tileMapWall'
import { IArrayForBuffers } from "../../types/GeomTypes"
import { Root } from "../../index"

import { COLOR_BLUE_D } from "../../constants/CONSTANTS"

const TOP_PROFILE = [
    [0,0],
    [0,0],
    [0,0.1],
    [0,0.2],
    [0.1,0.3],
    [0,0.3],
    [0,0.9],
    [0.1,1],
    [0.15,1],
    [0.15,1.1],
    [0.2,1.1],
    [0.2,1.3],
    [0,1.3]
]

const modifyProfile = (h: number = 1.3, d: number = 0): number[] => {
    let profile = TOP_PROFILE
    if (h !== 1.3) {
        profile = []
        for (let i = 0; i < TOP_PROFILE.length; ++i) {
            if (i < 6) {
                profile.push([TOP_PROFILE[i][0], TOP_PROFILE[i][1]])
            } else {
                profile.push([TOP_PROFILE[i][0], TOP_PROFILE[i][1] - 1.3 + h])
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

    const converted = _M.convertSimpleProfileToV3(profile)

    return converted
}


export const createPoias01 = (w: number, h: number = 1.3, d: number = 0): IArrayForBuffers => {
    const v: number[] = []
    const uv: number[] = []
    const c: number[] = []

    const converted = modifyProfile(h, d) 

    const r = _M.fillPoligonsV3(converted, converted, w, tileMapWall.noise, COLOR_BLUE_D, .5, true)
    v.push(...r.v)
    c.push(...r.c)
    uv.push(...r.uv)

    return { v, uv, c }
}

export const createAnglePoias01 = (
    angle1: number, 
    angle2: number, 
    h: number = 1.3, 
    d: number = 0
): IArrayForBuffers => {
    const profileLeft = modifyProfile(h, d)
    const profileRight = [...profileLeft]

    _M.rotateVerticesY(profileLeft, angle1)
    _M.rotateVerticesY(profileRight, angle2)

    const r =_M.fillPoligonsV3(profileLeft, profileRight, 0, tileMapWall.noise, COLOR_BLUE_D, d, false)

    return r
}
