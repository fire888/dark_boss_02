import { Root } from "../../index"
import { IArrayForBuffers, IHoleOrderData } from "../../types/GeomTypes"
import { _M } from "../_m"
import { COLOR_DARK_INTERIOR } from "../../constants/CONSTANTS"

export const createHoleBack01 = (holeData: IHoleOrderData): IArrayForBuffers => {
    /*

    |-------|--------|-------|
    x0     x1       x2       x3   

    - y3
    |
    |
    - y2
    |
    |
    - y1
    |
    |
    |
    - y0

    */

    const { x0, x1, x2, x3, y0, y1, y2, y3 } = holeData

    const color = COLOR_DARK_INTERIOR

    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []

    // UNDER HOLE ///////////////////////////
    if (x0 < x1 && y0 < y1) {
        v.push(
            ..._M.createPolygon(
                [x1, y0, 0],
                [x0, y0, 0],
                [x0, y1, 0],
                [x1, y1, 0],
            )
        )
        c.push(..._M.fillColorFace(color))
    }
    if (x1 < x2 && y0 < y1) {
        v.push(
            ..._M.createPolygon(
                [x2, y0, 0],
                [x1, y0, 0],
                [x1, y1, 0],
                [x2, y1, 0],
            )
        )
        c.push(..._M.fillColorFace(color))
    }
    if (x2 < x3 && y0 < y1) {
        v.push(
            ..._M.createPolygon(
                [x3, y0, 0],
                [x2, y0, 0],
                [x2, y1, 0],
                [x3, y1, 0],
            )
        )
        c.push(..._M.fillColorFace(color))
    }

    // LINE HOLE /////////////////
    if (x0 < x1 && y1 < y2) {
        v.push(
            ..._M.createPolygon(
                [x1, y1, 0],
                [x0, y1, 0],
                [x0, y2, 0],
                [x1, y2, 0],
            )
        )
        c.push(..._M.fillColorFace(color))
    }   
    if (x2 < x3 && y1 < y2) {
        v.push(
            ..._M.createPolygon(
                [x3, y1, 0],
                [x2, y1, 0],
                [x2, y2, 0],
                [x3, y2, 0],
            )
        )
        c.push(..._M.fillColorFace(color))
    }
    // OWER HOLE /////////////////////     
    if (x0 < x1 && y2 < y3) {
        v.push(
            ..._M.createPolygon(
                [x1, y2, 0],
                [x0, y2, 0],
                [x0, y3, 0],
                [x1, y3, 0],
            )
        )
        c.push(..._M.fillColorFace(color))
    }
    if (x1 < x2 && y2 < y3) {
        v.push(
            ..._M.createPolygon(
                [x2, y2, 0],
                [x1, y2, 0],
                [x1, y3, 0],
                [x2, y3, 0],
            )
        )
        c.push(..._M.fillColorFace(color))
    }      
    if (x2 < x3 && y2 < y3) {
        v.push(
            ..._M.createPolygon(
                [x3, y2, 0],
                [x2, y2, 0],
                [x2, y3, 0],
                [x3, y3, 0],
            )
        )
        c.push(..._M.fillColorFace(color))
    }

    for (let i = 0; i < v.length; i += 3) {
        uv.push(
            0, 0
            //.4 + v[i] / x3 * .2, 
            //.0 + .25 + v[i + 1] / y3 * .2
        )
    }

    return { v, c, uv }
}