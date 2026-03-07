import { _M } from "_CORE/_M/_m"
import { IArrayForBuffers } from "chapter10/types/GeomTypes"
import { Root } from "chapter10"
import { 
    UV_TRIANGLE, COL_WHITE, COL_BLUE_TOP, UV_GRID, UV_GRID_CIRCLE, UV_EMPTY, 
    COL_BLUE_LIGHT, UV_POINTS
 } from "../tileMapWall"
 import * as THREE from "three"

export const createArc00 = (w: number = 1, d: number = 20): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []

    const wSegment = .5//Math.random() * .3 + .3
    const wP = Math.random() * .2 + 0.05
    const ROOF_H = wP * 2
    const H_SIDES = .1 + Math.random() * .8

    const TYPE = Math.random() < .5 ? 'CIRCLE' : 'CROSS'

    { // arc
        const arrPoints0 = []
        let currAng = Math.PI * .5
        const maxAngle = Math.PI * (Math.random() * .8 + .55)
        const diffAngle = maxAngle - currAng
        const l = Math.abs((w - wP) * diffAngle)
        let count = Math.max(3, Math.round(l / wSegment))
        const stepAngle = diffAngle / count
        const scaleX = Math.abs((w - wP) / Math.cos(maxAngle))

        while (currAng <= (maxAngle + .01)) {
            const newP = [Math.cos(currAng) * scaleX, Math.sin(currAng) * scaleX]
            arrPoints0.push(newP)
            currAng += stepAngle
        }
    
        const lastP = arrPoints0[arrPoints0.length - 1]
        const startY: number = (lastP[1])

        const arrPoints1 = []
        for (let i = 0; i < arrPoints0.length; ++i) {
            const copyP = new THREE.Vector3(arrPoints0[i][0], arrPoints0[i][1] - startY, 0).normalize()
            const angle = _M.angleFromCoords(copyP.x, copyP.y)
            const offsetX = Math.cos(angle) * ROOF_H
            const offsetY = Math.sin(angle) * ROOF_H
            arrPoints1.push([arrPoints0[i][0] + offsetX, arrPoints0[i][1] + offsetY]) 
        }

        const DZ = -d
        const countZ = Math.max(1, Math.round(Math.abs(DZ / wSegment)))
        const stepD = Math.abs(DZ / countZ)

        for (let i = 1; i < arrPoints0.length; ++i) {
            const prev = arrPoints0[i - 1]
            const prevT = arrPoints1[i - 1]
            const curr = arrPoints0[i]
            const currT = arrPoints1[i]

            const prevP = [prev[0], prev[1]]
            let currP = [curr[0], curr[1]]

            for (let j = 1; j < countZ + 1; ++j) {
                // bottom
                const _v = _M.createPolygon(
                    [prevP[0], prevP[1], DZ + j * stepD],
                    [currP[0], currP[1], DZ + j * stepD],
                    [currP[0], currP[1], DZ + (j - 1) * stepD],
                    [prevP[0], prevP[1], DZ + (j - 1) * stepD],
                )
                v.push(..._v)
                if (j === 1 || j === countZ) {
                    c.push(...COL_WHITE)
                    uv.push(...UV_POINTS)
                } else {
                    if (TYPE === 'CIRCLE') {
                        if (Math.random() < .8) {
                            uv.push(...UV_GRID_CIRCLE) 
                        } else {
                            uv.push(...UV_GRID)
                        }
                        c.push(...COL_BLUE_LIGHT)
                    } else if (TYPE === 'CROSS') {
                        if (Math.random() < .95) {
                            uv.push(...UV_GRID) 
                        } else {
                            uv.push(...UV_GRID_CIRCLE)
                        }
                        c.push(...COL_BLUE_LIGHT)
                    }
                }

                // top
                const _vt = _M.createPolygon(
                    [prevT[0], prevT[1], DZ + (j - 1) * stepD],
                    [currT[0], currT[1], DZ + (j - 1) * stepD],
                    [currT[0], currT[1], DZ + (j) * stepD],
                    [prevT[0], prevT[1], DZ + (j) * stepD],
                )
                v.push(..._vt)
                c.push(...COL_BLUE_TOP)
                uv.push(...UV_GRID)
            }

            // fill front
            const _v = _M.createPolygon(
                [currP[0], currP[1], 0],
                [prevP[0], prevP[1], 0],
                [prevT[0], prevT[1], 0],
                [currT[0], currT[1], 0],
            )
            v.push(..._v)
            c.push(...COL_WHITE)
            uv.push(...UV_EMPTY)

            // fill back
            const _vb = _M.createPolygon(
                [prevP[0], prevP[1], DZ],
                [currP[0], currP[1], DZ],
                [currT[0], currT[1], DZ],
                [prevT[0], prevT[1], DZ],
            )
            v.push(..._vb)
            c.push(...COL_WHITE)
            uv.push(...UV_EMPTY)
        }
        _M.translateVertices(v, 0, -startY + H_SIDES, 0)
    }

    { // sides balks
        { // front
            const _v = _M.createPolygon(
                [-w - wP, 0, 0],
                [-w + wP, 0, 0],
                [-w + wP, H_SIDES, 0],
                [-w - wP, H_SIDES, 0],
            )
            v.push(..._v)
            c.push(...COL_WHITE)
            uv.push(...UV_TRIANGLE)
        }

        { // back
            const _v = _M.createPolygon(
                [-w + wP, 0, -d],
                [-w - wP, 0, -d],
                [-w - wP, H_SIDES, -d],
                [-w + wP, H_SIDES, -d],
            )
            v.push(..._v)
            c.push(...COL_WHITE)
            uv.push(...UV_TRIANGLE)
        }

        const countZ = Math.ceil(d / wSegment)
        const stepZ = d / countZ

        for (let i = 1; i < countZ + 1; ++i) {
            // right
            const _v = _M.createPolygon(
                [-w + wP, 0, -d + stepZ * i],
                [-w + wP, 0, -d + stepZ * (i - 1)],
                [-w + wP, H_SIDES, -d + stepZ * (i - 1)],
                [-w + wP, H_SIDES, -d + stepZ * i],
            )
            v.push(..._v)
            c.push(...COL_WHITE)
            uv.push(...UV_TRIANGLE)

            // left
            const _v2 = _M.createPolygon(
                [-w - wP, 0, -d + stepZ * (i - 1)],
                [-w - wP, 0, -d + stepZ * i],
                [-w - wP, H_SIDES, -d + stepZ * i],
                [-w - wP, H_SIDES, -d + stepZ * (i - 1)],
            )
            v.push(..._v2)
            c.push(...COL_WHITE)
            uv.push(...UV_TRIANGLE)

            // bottom
            const _vb = _M.createPolygon(
                [-w + wP, 0, -d + stepZ * i],
                [-w - wP, 0, -d + stepZ * i],
                [-w - wP, 0, -d + stepZ * (i - 1)],
                [-w + wP, 0, -d + stepZ * (i - 1)],
            )
            v.push(..._vb)
            c.push(...COL_WHITE)
            uv.push(...UV_EMPTY)
        }
    }

    _M.appendMirrorX(v, c, uv)

    return { v, c, uv }
}