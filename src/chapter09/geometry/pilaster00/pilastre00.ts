import { _M } from "../_m"
import { IArrayForBuffers } from "../../types/GeomTypes"
import { Root } from "../../index";
import { createPilaster01 } from "../../geometry/pilaster01/pilaster01"
import { createPilaster02 } from "../../geometry/pilaster02/pilaster02"
import { createColumn00 } from "../../geometry/column00/column00"

export const createPilaster00 = (w: number, h: number, d: number): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
            
    const D_COLUMN_BASE = .2  // выдвижение вперед базы колонны
    const H_BASE = 1.4
    const OFFSET_COLUMN = .3
    const OFFSET_COLUMN_BASE = .14

    {
        const p = createPilaster01(w, h, d - D_COLUMN_BASE)
        v.push(...p.v)
        c.push(...p.c)
        uv.push(...p.uv)
    }

    {
        const r = createPilaster02(w - OFFSET_COLUMN, H_BASE, D_COLUMN_BASE)
        _M.translateVertices(r.v, 0, 0, d - D_COLUMN_BASE)
        v.push(...r.v)
        uv.push(...r.uv)
        c.push(...r.c)
    }
    
    // bodycolumn    
    {
        // если база широкая расставляем несколько колонн
        const r = createColumn00(.38, h - H_BASE) // 1.4 - высота базы

        const _W = w - (OFFSET_COLUMN_BASE - .1) - (OFFSET_COLUMN_BASE - .1)
        const DIAM = (.15 + .1) * 2
        const count = Math.floor(_W / DIAM)
        const W_COL = DIAM * count

        for (let i = 0; i < count; ++i) {
            const copyV = [...r.v]
            _M.translateVertices(copyV, -W_COL * .5 + DIAM * .5 + i * DIAM, H_BASE, d - OFFSET_COLUMN * .6)
            v.push(...copyV)
            uv.push(...r.uv)
            c.push(...r.c)
        }
    } 

    return { v, c, uv }
}