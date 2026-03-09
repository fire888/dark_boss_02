import { _M, A3 } from "../_m"
import { tileMapWall } from '../tileMapWall'
import { createCurb00 } from "../bevel00/curb00"
import { COLOR_BLUE, COLOR_BLUE_L } from "../../constants/CONSTANTS"
import { Root } from "../../index"
import { IHoleData } from "../../types/GeomTypes"

const TOP_PROFILE: [number, number][] = [
    [0, 0],
    [.8, 0],
    [.8, .15],
    [1, .15],
    [1, .3],
    [0, .33],
]

export const createDoor00 = (
    doorData: IHoleData,
) => {
    const v: number[] = [] 
    const uv: number[] = [] 
    const c: number[] = []

    const {
        w = 2, 
        d = .8, 
        h = 4,
    } = doorData

    const R = w * .5 - .2
    const DS = .1

    const H_SQ = 1 // высота плоскости над дверью

    { // проем внутренний
        // порог нижний
        const r = createCurb00([0, 0], [R, 0], [R, -d], [0, -d], tileMapWall.noise, .1, 100, COLOR_BLUE)
        v.push(...r.v)
        uv.push(...r.uv)
        c.push(...r.c)

        v.push(
            ..._M.createPolygon(
                [R, 0, -d - DS],
                [R, 0, DS],
                [R, h, DS],
                [R, h, -d - DS],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))

        v.push(
            ..._M.createPolygon(
                [R, h, -d - DS],
                [R, h, DS],
                [0, h, DS],
                [0, h, -d - DS],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))
    }

    { // передний внутренний профиль
        const ws = .2
        v.push(
            ..._M.createPolygon(
                [R, 0, DS],
                [R + ws, 0, ws * .3 + DS],
                [R + ws, h + ws, ws * .3 + DS],
                [R, h, DS],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))

        v.push(
            ..._M.createPolygon(
                [0, h, DS],
                [R, h, DS],
                [R + ws, h + ws, ws * .3 + DS],
                [0, h + ws, ws * .3 + DS],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))

        // закрываем сверху внутренний профиль
        v.push(
            ..._M.createPolygon(
                [0, h + ws, ws * .3 + DS],
                [R + ws, h + ws, ws * .3 + DS],
                [R + ws, h + ws, DS],
                [0, h + ws, DS],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))

        // квадрат над дверью
        v.push(
            ..._M.createPolygon(
                [0, h + ws, DS],
                [R + ws, h + ws, DS],
                [R + ws, h + ws + H_SQ, DS],
                [0, h + ws + H_SQ, DS],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))
    }

    { // передняя пилястра
        const R1 = R + .2
        const R2 = R1 + .3
        const D = .35
        const H = h + .2 + H_SQ + .3

        // перед
        v.push(
            ..._M.createPolygon(
                [R1, 0, D],
                [R2, 0, D],
                [R2, H, D],
                [R1, H, D],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE_L))

        // лево
        v.push(
            ..._M.createPolygon(
                [R1, 0, 0],
                [R1, 0, D],
                [R1, H, D],
                [R1, H, 0],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE_L))

        // право
        v.push(
            ..._M.createPolygon(
                [R2, 0, D],
                [R2, 0, 0],
                [R2, H, 0],
                [R2, H, D],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE_L))
    }

    { // низ пилястры
        const R1 = R + .1
        const R2 = R + .2 + .3 + .05
        const D = .405
        const H = .6

        // перед
        v.push(
            ..._M.createPolygon(
                [R1, 0, D],
                [R2, 0, D],
                [R2, H, D],
                [R1, H, D],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))

        // лево
        v.push(
            ..._M.createPolygon(
                [R1, 0, 0],
                [R1, 0, D],
                [R1, H, D],
                [R1, H, 0],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))

        // право
        v.push(
            ..._M.createPolygon(
                [R2, 0, D],
                [R2, 0, 0],
                [R2, H, 0],
                [R2, H, D],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))

        // верх
        v.push(
            ..._M.createPolygon(
                [R1, H, D],
                [R2, H, D],
                [R2, H, 0],
                [R1, H, 0],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))
    }

    { // верхний профиль
        const RT = R - .2

        const pr =  _M.convertSimpleProfileToV3(TOP_PROFILE)
        const pr2 = []
        for (let i = 0; i < pr.length; i += 3) {
            pr2.push(pr[i + 2], pr[i + 1], pr[i + 2]) 
        }

        const r = _M.fillPoligonsV3(pr, pr2, RT, tileMapWall.white, COLOR_BLUE_L)
        _M.translateVertices(r.v, 0, h + .2 + H_SQ, 0)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)

        _M.translateVertices(pr2, RT, 0, 0)
        const pr3 = []
        for (let i = 0; i < pr2.length; i += 3) {
            pr3.push(pr2[i], pr2[i + 1], 0)
        }
        const r2 = _M.fillPoligonsV3(pr2, pr3, 0, tileMapWall.white, COLOR_BLUE_L)
        _M.translateVertices(r2.v, 0, h + .2 + H_SQ, 0)
        v.push(...r2.v)
        c.push(...r2.c)
        uv.push(...r2.uv)
    }

    { // внутренний косяк в комнате
        const ws = .2
        const DSS = -d - DS

        // право
        v.push(
            ..._M.createPolygon(
                [R + ws, 0, -ws * .3 + DSS],
                [R, 0, DSS],
                [R, h, + DSS],
                [R + ws, h + ws, -ws * .3 + DSS],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))

        // право к стенке
        v.push(
            ..._M.createPolygon(
                [R + ws, 0, -d],
                [R + ws, 0, -ws * .3 + DSS],
                [R + ws, h + ws, -ws * .3 + DSS],
                [R + ws, h + ws, -d],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))

        v.push(
            ..._M.createPolygon(
                [R, h, DSS],
                [0, h, DSS],
                [0, h + ws, -ws * .3 + DSS],
                [R + ws, h + ws, -ws * .3 + DSS],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))

        // закрываем сверху внутренний профиль
        v.push(
            ..._M.createPolygon(
                [R + ws, h + ws, -ws * .3 + DSS],
                [0, h + ws, -ws * .3 + DSS],
                [0, h + ws, -d],
                [R + ws, h + ws, -d],
            )
        )
        uv.push(...tileMapWall.white)
        c.push(..._M.fillColorFace(COLOR_BLUE))
    }

    // mirror
    _M.appendMirrorX(v, c, uv)

    return { v, uv, c }
}