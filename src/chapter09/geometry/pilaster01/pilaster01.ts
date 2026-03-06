import { _M } from "../_m"
import { tileMapWall } from '../tileMapWall'
import { IArrayForBuffers } from "../../types/GeomTypes"
import { Root } from "../../index";
import { COLOR_BLUE_D } from "../../constants/CONSTANTS"

export const createPilaster01 = (w: number, h: number, d: number = .3): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
            
    const PILASTRE_PROF_V2 = [    
        [0.25, 0],
        [0.25, .3],
        [0.15, .3],
        [.1, .4],
        [.12, .4],
        [.12, .45],
        [.1, .45],
        [.1, .5],
        [0, .5], 
        [0, h], 
    ]
    
    const pilastreProfV3 = _M.convertSimpleProfileToV3(PILASTRE_PROF_V2)
    const pilastreR = []
    for (let i = 0; i < pilastreProfV3.length; i += 3) {
        pilastreR.push(pilastreProfV3[i + 2], pilastreProfV3[i + 1], pilastreProfV3[i + 2])
    }
    const pilastreL = []
    for (let i = 0; i < pilastreProfV3.length; i += 3) {
        pilastreL.push(-pilastreProfV3[i + 2], pilastreProfV3[i + 1], pilastreProfV3[i + 2])
    }
    
    {
        const r = _M.fillPoligonsV3(pilastreL, pilastreR, w, tileMapWall.noise, COLOR_BLUE_D, 1, true)
        _M.translateVertices(r.v, -w * .5, 0, d)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)

        { // top center
            v.push(
                0, h, 0,
                -r.v[r.v.length - 6], h, pilastreR[pilastreR.length - 1] + d,
                r.v[r.v.length - 6], h, pilastreR[pilastreR.length - 1] + d,
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
                -r.v[0], 0, pilastreR[2] + d,
                r.v[0], 0, pilastreL[2] + d,
            )
            c.push(
                ...COLOR_BLUE_D,
                ...COLOR_BLUE_D,
                ...COLOR_BLUE_D,
            )   
            uv.push(...tileMapWall.noiseTree)  
        }
    }
    
    {
        const r = _M.fillPoligonsV3(pilastreProfV3, pilastreR, d, tileMapWall.noise, COLOR_BLUE_D, 1, true)
        _M.rotateVerticesY(r.v, -Math.PI / 2)
        _M.translateVertices(r.v, -w * .5, 0, 0)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)

        { // bottom left
            v.push(
                0, 0, 0,
                r.v[0], 0, pilastreR[2] + d,
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
                r.v[r.v.length - 3], h, pilastreL[pilastreL.length - 1] + d,
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
    
    {
        const r = _M.fillPoligonsV3(pilastreL, pilastreProfV3, d, tileMapWall.noise, COLOR_BLUE_D, 1, true)
        _M.rotateVerticesY(r.v, Math.PI / 2)
        _M.translateVertices(r.v, w * .5, 0, d)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)

        { // bottom right
            v.push(
                r.v[0], 0, pilastreR[2] + d,
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
                r.v[r.v.length - 3], h, pilastreL[pilastreL.length - 1] + d,
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