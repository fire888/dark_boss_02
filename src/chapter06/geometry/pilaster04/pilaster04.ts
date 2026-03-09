import { _M } from "../_m"
import { tileMapWall } from '../tileMapWall'
import { IArrayForBuffers } from "../../types/GeomTypes"
import { Root } from "../../index"
import { COLOR_BLUE_D } from "../../constants/CONSTANTS"
import { createPilaster02 } from "../../geometry/pilaster02/pilaster02"
import { createPilaster03 } from "../../geometry/pilaster03/pilaster03"

export const createPilaster04 = (w: number, h: number, d: number): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
            
    const H_BASE = 1.4
    const H_CAPITEL = .4

    {
        const p = createPilaster02(w, H_BASE, d)
        v.push(...p.v)
        c.push(...p.c)
        uv.push(...p.uv)
    }

    {
        const r = createPilaster03(w * 1.05, H_CAPITEL, d)
        _M.translateVertices(r.v, 0, h - H_CAPITEL, 0)
        v.push(...r.v)
        uv.push(...r.uv)
        c.push(...r.c)
    }

    // front
    {
        const r = _M.fillPoligonsV3(
            [-w * .5, H_BASE, d - .1, -w * .5, h - H_CAPITEL, d - .1,],
            [-w * .5, H_BASE, d - .1, -w * .5, h - H_CAPITEL, d - .1,],
            w,
            tileMapWall.break,
            COLOR_BLUE_D,
            1,
            true
        )
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)
    }

    // left
    {
        const r = _M.fillPoligonsV3(
            [0, H_BASE, 0, 0, h - H_CAPITEL, 0,],
            [0, H_BASE, 0, 0, h - H_CAPITEL, 0,],
            d - .1,
            tileMapWall.break,
            COLOR_BLUE_D,
            1,
            true
        )
        _M.rotateVerticesY(r.v, -Math.PI * .5)
        _M.translateVertices(r.v, -w * .5, 0, 0)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)
    }

    // right
    {
        const r = _M.fillPoligonsV3(
            [0, H_BASE, 0, 0, h - H_CAPITEL, 0,],
            [0, H_BASE, 0, 0, h - H_CAPITEL, 0,],
            d - .1,
            tileMapWall.break,
            COLOR_BLUE_D,
            1,
            true
        )
        _M.rotateVerticesY(r.v, Math.PI * .5)
        _M.translateVertices(r.v, w * .5, 0, d - .1)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)
    }

    return { v, c, uv }
}