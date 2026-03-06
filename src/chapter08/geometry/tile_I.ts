import { _M } from "./_m";
import { createLineGeom } from './_lineGeom'

import { DataToCreateGeom, DataToCreateLine, DataToCreateTileU, Dir } from '../entities/labyrinth/types'

import { vC_H } from "../constants/CONSTANTS";


export const createTileI = (data:  DataToCreateTileU) => {
    const { width, num, w, s, n, e } = data

    let dir: Dir, startData: DataToCreateLine, endData: DataToCreateLine
    if (n && s) { 
        dir = Dir.NORTH
        startData = data.n
        endData = data.s
    }
    if (w && e) { 
        dir = Dir.WEST
        startData = data.w
        endData = data.e
    }

    const arrs = _M.interpolateArrays({ 
        forms: [startData.form, endData.form], 
        paths: [startData.path, endData.path],
        colors: [startData.color, endData.color],
        n: num,
    })

    const v = []
    const c = []
    const vC = []

    const xStep = width / num
    const startX = xStep / 2

    for (let i = 0; i < arrs.paths.length; ++i) {
        const l = createLineGeom({
            form: arrs.forms[i],
            path: arrs.paths[i],
            color: arrs.colors[i],
            isClosed: true,
        })
        if (dir === Dir.NORTH) {
            _M.translateVertices(l.v, 0, 0, -width / 2 + startX + i * xStep)
        }
        if (dir === Dir.WEST) {
            _M.rotateVerticesY(l.v, Math.PI * .5)
            _M.translateVertices(l.v, -width / 2 + startX + i * xStep, 0, 0)
        }

        v.push(...l.v)
        c.push(...l.c)
    }

    {
        const w = width
        vC.push(
            ..._M.createPolygon(
                [-w * .5, 0, w * .5],
                [w * .5, 0, w * .5],
                [w * .5, 0, -w * .5],
                [-w * .5, 0, -w * .5],
            ),
            ..._M.createPolygon(
                [-w * .5, 0, w * .5],
                [-w * .5, 0, -w * .5],
                [-w * .5, vC_H, -w * .5],
                [-w * .5, vC_H, w * .5],
            ),
            ..._M.createPolygon(
                [w * .5, 0, -w * .5],
                [w * .5, 0, w * .5],
                [w * .5, vC_H, w * .5],
                [w * .5, vC_H, -w * .5],
            ),
        )
    }

    if (dir === Dir.WEST) {
        _M.rotateVerticesY(vC, Math.PI * .5)
    }

    return { v, c, vC }
}
