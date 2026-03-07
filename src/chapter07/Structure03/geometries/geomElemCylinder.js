import {
    createFace,
    fillColorFace,
} from "../helpers/geomHelpers";
import {
    tileUv,
} from "./uvAtlas";
import { COLOR_00 } from '../constants/constants_elements'

const { sin, cos } = Math

export const createElemCylinder = ({
                                    color = COLOR_00
                                }) => {
    const v = []
    const c = []
    const u = []
    const col = []

    const colorPolygon = fillColorFace(color)

    const SIDES = 8
    const points = [
         [7, 0],
         [7, 20, 'empty'],
         [0, 21, 'empty'],
    ]
    //
    for (let i = 1; i < points.length; ++i) {
         const r0 = points[i - 1][0]
         const r1 = points[i][0]

         for (let j = 0; j < SIDES; ++j) {
             let a0 = (j - 1) / SIDES * Math.PI * 2
             if (j === 0) {
                 a0 = (SIDES - 1) / SIDES * Math.PI * 2
             }
             const a1 = j / SIDES  * Math.PI * 2

             v.push(
                 ...createFace(
                     [sin(a0) * r0, points[i - 1][1], cos(a0) * r0],
                     [sin(a1) * r0, points[i - 1][1], cos(a1) * r0],
                     [sin(a1) * r1, points[i][1], cos(a1) * r1],
                 [sin(a0) * r1, points[i][1], cos(a0) * r1],
                     ),
             )
             u.push(...tileUv[points[i][2]])
             c.push(...colorPolygon)
         }
    }

    return { v, col, u, c }
}
