import { _M } from "../_m"
import { tileMapWall } from '../tileMapWall'
import { IArrayForBuffers } from "../../types/GeomTypes"
import { Root } from "../../index"
import { COLOR_BLUE_D } from "../../constants/CONSTANTS"

const C1 = COLOR_BLUE_D

const PR_COLUMN = [
    [-.1, 0],
    [0, 0],
    [0, 0],
    [0, .8],
    [.1, .85],
    [.1, 1],
]

export const createPilaster03 = (w: number, h: number, d: number): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []

    let pr = PR_COLUMN
    if (h !== 1) {
        pr = []
        for (let i = 0; i < PR_COLUMN.length; ++i) {
            if (i < 3) {
                pr.push([PR_COLUMN[i][0], PR_COLUMN[i][1]])
            } else {
                pr.push([PR_COLUMN[i][0], PR_COLUMN[i][1] - 1 + h])   
            }
        }
    }

    const profile = _M.convertSimpleProfileToV3(pr)

    const path0 = profile
    const pathL = [...profile] 
    const pathR = [...profile]
    for (let i = 0; i < pathL.length; i += 3) {
        pathL[i] = -pathL[i + 2] // поворот под 45 градусов
        pathR[i] = pathR[i + 2]  // поворот пол 45 градусов
    }
    
    /** front */
    const r = _M.fillPoligonsV3(
        pathL, 
        pathR, 
        w, 
        tileMapWall.noise, 
        C1
    )
    _M.translateVertices(r.v, -w * .5, 0, d)
    v.push(...r.v)
    uv.push(...r.uv)
    c.push(...r.c)

    { // top center
        v.push(
            0, h, 0,
            -r.v[r.v.length - 6], h, pathL[pathL.length - 1] + d,
            r.v[r.v.length - 6], h, pathL[pathL.length - 1] + d,
        )
        c.push(
            ...COLOR_BLUE_D,
            ...COLOR_BLUE_D,
            ...COLOR_BLUE_D,
        )   
        uv.push(...tileMapWall.noiseTree)  
    }

    { // bottom center
        v.push(
            0, 0, 0,
            -r.v[0], 0, pathL[2] + d,
            r.v[0], 0, pathL[2] + d,
        )
        c.push(
            ...COLOR_BLUE_D,
            ...COLOR_BLUE_D,
            ...COLOR_BLUE_D,
        )   
        uv.push(...tileMapWall.noiseTree)  
    }

    /** left */
    {
        const r = _M.fillPoligonsV3(path0, pathR, d, tileMapWall.noise, C1)
        _M.rotateVerticesY(r.v, -Math.PI * .5)
        _M.translateVertices(r.v, -w * .5, 0, 0)
        v.push(...r.v)
        uv.push(...r.uv)
        c.push(...r.c)

        { // bottom left
            v.push(
                0, 0, 0,
                r.v[0], 0, pathR[2] + d,
                r.v[0], 0, 0,
            )
            c.push(
                ...COLOR_BLUE_D,
                ...COLOR_BLUE_D,
                ...COLOR_BLUE_D,
            )   
            uv.push(...tileMapWall.noiseTree)  
        }

        { // top left
            v.push(
                r.v[r.v.length - 3], h, pathL[pathL.length - 1] + d,
                0, h, 0,
                r.v[r.v.length - 3], h, 0,
            )
            c.push(
                ...COLOR_BLUE_D,
                ...COLOR_BLUE_D,
                ...COLOR_BLUE_D,
            )   
            uv.push(...tileMapWall.noiseTree)  
        }

    }

    /** right */
    {
        const r = _M.fillPoligonsV3(pathL, path0, d, tileMapWall.noise, C1)
        _M.rotateVerticesY(r.v, Math.PI * .5)
        _M.translateVertices(r.v, w * .5, 0, d)
        v.push(...r.v)
        uv.push(...r.uv)
        c.push(...r.c)

        { // bottom right
            v.push(
                r.v[0], 0, pathL[2] + d,
                0, 0, 0,
                r.v[0], 0, 0,
            )
            c.push(
                ...COLOR_BLUE_D,
                ...COLOR_BLUE_D,
                ...COLOR_BLUE_D,
            )   
            uv.push(...tileMapWall.noiseTree)  
        }

        { // top right
            v.push(
                0, h, 0,
                r.v[r.v.length - 3], h, pathL[pathL.length - 1] + d,
                r.v[r.v.length - 3], h, 0,
            )
            c.push(
                ...COLOR_BLUE_D,
                ...COLOR_BLUE_D,
                ...COLOR_BLUE_D,
            )   
            uv.push(...tileMapWall.noiseTree)  
        }
    }
 
    return { v, c, uv }
}