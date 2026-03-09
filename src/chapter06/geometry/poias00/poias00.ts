import { IArrayForBuffers } from "../../types/GeomTypes"
import { Root } from "../../index"
import { _M } from "../_m"
import { tileMapWall } from "../tileMapWall"
import { COLOR_BLUE_D, COLOR_BLUE } from "../../constants/CONSTANTS"

const C1 = COLOR_BLUE_D

const PR_BOTTOM: [number, number][] = [
    [0.25, 0],
    [0.25, .3],
    [0.15, .3],
    [.1, .4],
    [.12, .4],
    [.12, .45],
    [.1, .45],
    [.1, .5],
    [0, .5], 
]
const PR_CENTER: [number, number][] = [
    [0, 1.5],
    [.1, 1.6],
    [.1, 1.63],
    [.15, 1.64],
    [.15, 1.7],
    [.17, 1.7],
    [.17, 1.75],
    [0, 1.75],
]

export const createPoias00 = (w: number, h: number = 1.75, d: number = .25): IArrayForBuffers => {
    const v: number[] = []
    const uv: number[] = []
    const c: number[] = []

    let profileCenter = PR_CENTER
    if (h !== 1.75) {
        profileCenter = []
        PR_CENTER.forEach(e => profileCenter.push([e[0], e[1] - 1.75 + h]))
    }
    
    const LEVELS = [
        { profile: _M.convertSimpleProfileToV3(PR_BOTTOM), color: C1, uvTile: tileMapWall.noise },
        { profile: _M.getLastAndFirstCoordsPath(_M.convertSimpleProfileToV3(PR_BOTTOM), _M.convertSimpleProfileToV3(profileCenter)), color: C1, uvTile: tileMapWall.noise },
        { profile: _M.convertSimpleProfileToV3(profileCenter), color: C1, uvTile: tileMapWall.noise },
    ]
     
    LEVELS.forEach(e => {
        const r = _M.fillPoligonsV3(e.profile, e.profile, w, e.uvTile, e.color)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)
    })

    return { v, uv, c }
}