import {createFace, fillColorFace} from "../helpers/geomHelpers";
import {
    tileUv,

} from "./uvAtlas";
import { COLOR_00 } from '../constants/constants_elements'

export const createElemDrive = ({
    color = COLOR_00
}) => {
    const v = []
    const c = []
    const u = []
    const col = []

    const colorPolygon = fillColorFace(color)

    v.push(
        ...createFace(
            [-15, 0, 5],
            [15, 0, 5],
            [15, 11, 2],
            [-15, 11, 2],
        )
    )
    u.push(...tileUv['empty'])
    c.push(...colorPolygon)

    v.push(
        ...createFace(
            [-15, 0, -2],
            [-15, 0, 5],
            [-15, 11, 2],
            [-15, 11, -2],
        )
    )
    u.push(...tileUv['empty'])
    c.push(...colorPolygon)

    v.push(
        ...createFace(
            [15, 0, 5],
            [15, 0, -2],
            [15, 11, -2],
            [15, 11, 2],
        )
    )
    u.push(...tileUv['empty'])
    c.push(...colorPolygon)

    v.push(
        ...createFace(
            [15, 0, -2],
            [-15, 0, -2],
            [-15, 11, -2],
            [15, 11, -2],
        )
    )

    u.push(...tileUv['empty'])
    c.push(...colorPolygon)

    v.push(
        ...createFace(
            [-15, 11, 2],
            [15, 11, 2],
            [15, 11, -2],
            [-15, 11, -2],
        )
    )

    u.push(...tileUv['empty'])
    c.push(...colorPolygon)

    col.push(
        ...createFace(
            [-15, 0, 2],
            [15, 0, 2],
            [15, 30, 2],
            [-15, 20, 2],
        )
    )

    // const SIDES = 8
    //
    //
    // const points = [
    //     [w0, 0, 'columnSide_0'],
    //     [w0, h0, 'line_p0'],
    //     [w, h00, 'line_p1'],
    //     [w, h1, 'columnSide_0'],
    //     [w1, h11, 'line_p1'],
    //     [w1, h2, 'line_p1'],
    //     [0, h, 'line_p1'],
    // ]
    //
    // const colorPolygon = fillColorFace(color)
    //
    // for (let i = 1; i < points.length; ++i) {
    //     const r0 = points[i - 1][0]
    //     const r1 = points[i][0]
    //
    //     for (let j = 0; j < SIDES; ++j) {
    //         let a0 = (j - 1) / SIDES * Math.PI * 2
    //         if (j === 0) {
    //             a0 = (SIDES - 1) / SIDES * Math.PI * 2
    //         }
    //         const a1 = j / SIDES  * Math.PI * 2
    //
    //         v.push(
    //             ...createFace(
    //                 [sin(a0) * r0, points[i - 1][1], cos(a0) * r0],
    //                 [sin(a1) * r0, points[i - 1][1], cos(a1) * r0],
    //                 [sin(a1) * r1, points[i][1], cos(a1) * r1],
    //                 [sin(a0) * r1, points[i][1], cos(a0) * r1],
    //             ),
    //         )
    //         u.push(...tileUv[points[i][2]])
    //         c.push(...colorPolygon)
    //     }
    // }

    // /** collision */
    // col.push(
    //     ...createFace(
    //         [-w0 / 2, 0, w0 / 2],
    //         [w0 / 2, 0, w0 / 2],
    //         [w0 / 2, h, w0 / 2],
    //         [-w0 / 2, h, w0 / 2],
    //     ),
    //     ...createFace(
    //         [w0 / 2, 0, w0 / 2],
    //         [w0 / 2, 0, -w0 / 2],
    //         [w0 / 2, h, -w0 / 2],
    //         [w0 / 2, h, w0 / 2],
    //     ),
    //     ...createFace(
    //         [w0 / 2, 0, -w0 / 2],
    //         [-w0 / 2, 0, -w0 / 2],
    //         [-w0 / 2, h, -w0 / 2],
    //         [w0 / 2, h, -w0 / 2],
    //     ),
    //     ...createFace(
    //         [-w0 / 2, 0, -w0 / 2],
    //         [-w0 / 2, 0, w0 / 2],
    //         [-w0 / 2, h, w0 / 2],
    //         [-w0 / 2, h, -w0 / 2],
    //     ),
    // )

    return { v, col, u, c }
}
