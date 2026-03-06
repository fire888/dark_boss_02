import { IArrayForBuffers, T_ROOM } from "types/GeomTypes"
import { createFloor00, T_Floor } from "geometry/floor00/floor00"
import { _M } from "../_m"
import { Root } from "index"
import { COL_RED, UV_POINTS } from "geometry/tileMapWall"

export const createPlatform00 = (s: T_ROOM): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const vCollide: number[] = []

    const plData: T_Floor = {
        p0: s.p0, p1: s.p1, p2: s.p2, p3: s.p3,
        d: s.d, w: s.w,
        isFillStart: s.type === 'FLOOR', isFillEnd: s.type === 'FLOOR'
    }
    
    { // floor
        const r = createFloor00(plData)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)
        vCollide.push(...r.vCollide)
    }

    // perimeter vertical
    const hPL = .3

    { // left
        const _v = _M.createPolygonV(
            s.p0.clone().setY(s.p0.y - hPL), 
            s.p1.clone().setY(s.p1.y - hPL), 
            s.p1,
            s.p0
        )
        _M.fill(_v, v)
        _M.fill(COL_RED, c)
        _M.fill(UV_POINTS, uv)
    }

    { // right
        const _v = _M.createPolygonV(
            s.p2.clone().setY(s.p2.y - hPL), 
            s.p3.clone().setY(s.p3.y - hPL), 
            s.p3,
            s.p2
        )
        _M.fill(_v, v)
        _M.fill(COL_RED, c)
        _M.fill(UV_POINTS, uv)
    }

    { // фронт
        const _v = _M.createPolygonV(
            s.p3.clone().setY(s.p3.y - hPL), 
            s.p0.clone().setY(s.p0.y - hPL), 
            s.p0.clone(),
            s.p3.clone() 
        )
        _M.fill(_v, v)
        _M.fill(COL_RED, c)
        _M.fill(UV_POINTS, uv)
    }

    { // бэк
        const _v = _M.createPolygonV(
            s.p1.clone().setY(s.p1.y - hPL), 
            s.p2.clone().setY(s.p2.y - hPL), 
            s.p2.clone(),
            s.p1.clone() 
        )
        _M.fill(_v, v)
        _M.fill(COL_RED, c)
        _M.fill(UV_POINTS, uv)
    }

    { // боттом
        const _v = _M.createPolygonV(
            s.p3.clone().setY(s.p3.y - hPL), 
            s.p2.clone().setY(s.p2.y - hPL), 
            s.p1.clone().setY(s.p1.y - hPL),
            s.p0.clone().setY(s.p0.y - hPL) 
        )
        _M.fill(_v, v)
        _M.fill(COL_RED, c)
        _M.fill(UV_POINTS, uv)
    }
    
    return { v, c, uv, vCollide }
}