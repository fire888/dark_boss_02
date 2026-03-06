import { _M, A3 } from "./_m";
import { createLineGeom, checkPathValid } from './_lineGeom'
import { DataToCreateTileU, Dir } from '../entities/labyrinth/types'
import { vC_H } from "../constants/CONSTANTS";


export const createTileU = (data: DataToCreateTileU) => {
    const { width, num, n, e, s, w } = data

    const v: number[] = []
    const c: number[] = []
    const vC: number[] = []

    let dir = null
    if (n) dir = Dir.NORTH
    if (e) dir = Dir.EAST
    if (s) dir = Dir.SOUTH
    if (w) dir = Dir.WEST

    if (!checkPathValid(data[dir].path)) {
        return null
    }

    const arrs = _M.interpolateArrays({ 
        forms: [data[dir].form, data[dir].form], 
        paths: [data[dir].path, data[dir].path], 
        colors: [data[dir].color, data[dir].color], 
        n: Math.floor(num / 2) 
    })

    const step = width / num
    for (let i = 0; i < arrs.paths.length; ++i) {
        const l = createLineGeom({
            form: arrs.forms[i],
            path: arrs.paths[i],
            color: arrs.colors[i],
            isClosed: true,
        })
        if (dir === Dir.NORTH) {
            _M.translateVertices(l.v, 0, 0, -width / 2 + i * step + step / 2 )
        }
        if (dir === Dir.SOUTH) {
            _M.translateVertices(l.v, 0, 0, +width / 2 - i * step - step / 2 )   
        }
        if (dir === Dir.WEST) { 
            _M.rotateVerticesY(l.v, Math.PI / 2)
            _M.translateVertices(l.v, -width / 2 + i * step + step / 2, 0, 0)
        }
        if (dir === Dir.EAST) { 
            _M.rotateVerticesY(l.v, Math.PI / 2)
            _M.translateVertices(l.v, width / 2 - i * step - step / 2, 0, 0)
        }

        v.push(...l.v)
        c.push(...l.c)
    }


    const N = 5
    const pathsEnd: A3[][] = []
    const colorsEnd = []
    const formsEnd = []
    const p = data[dir].path
    for (let i = 0; i < N; ++i) {
        const newP: A3[] = []
        for (let j = 0; j < p.length; ++j) {
            const phase = 1 - i / N
            newP.push([
                p[j][0] * phase,
                p[j][1] * phase + i / N,
                p[j][2] * phase
            ])
        }
        pathsEnd.push(newP)
        colorsEnd.push(data[dir].color)
        formsEnd.push(data[dir].form)
    }


    for (let i = 0; i < pathsEnd.length; ++i) {
        const b = createLineGeom({
            path: pathsEnd[i],
            form: formsEnd[i],
            color: colorsEnd[i],
            isClosed: true
        })

        if (dir === 's') {
            _M.translateVertices(b.v, 0, 0, -i * step)
        }

        if (dir === 'n') {
            _M.translateVertices(b.v, 0, 0, +i * step)
        }

        if (dir === Dir.WEST) { 
            _M.rotateVerticesY(b.v, Math.PI / 2)
            _M.translateVertices(b.v, i * step, 0, 0)
        }
        if (dir === Dir.EAST) { 
            _M.rotateVerticesY(b.v, Math.PI / 2)
            _M.translateVertices(b.v, -i * step, 0, 0)
        }

        v.push(...b.v)
        c.push(...b.c)
    }

    {
        /*
        _________
        |        |
        |        |
        |        |
        |        |
        
        */

        const w = width
        const _vC = [
            ..._M.createPolygon( // bottom
                [-w * .5, 0, w * .5],
                [w * .5, 0, w * .5],
                [w * .5, 0, -w * .2],
                [-w * .5, 0, -w * .2],
            ),
            ..._M.createPolygon( // left
                [-w * .5, 0, w * .5],
                [-w * .5, 0, -w *.2],
                [-w * .5, vC_H, -w *.2],
                [-w * .5, vC_H, w * .5],
            ),
            ..._M.createPolygon( // right
                [w * .5, 0, -w *.2],
                [w * .5, 0, w * .5],
                [w * .5, vC_H, w * .5],
                [w * .5, vC_H, -w *.2],
            ),
            ..._M.createPolygon( // back
              [-w * .5, 0, -w *.2],  
              [w * .5, 0, -w *.2],  
              [w * .5, vC_H, -w *.2],  
              [-w * .5, vC_H, -w *.2],  
            ),
        ]

        let rot = 0
        if (dir === 's') {}
        if (dir === 'n') rot = Math.PI
        if (dir === 'e') rot = Math.PI * .5
        if (dir === 'w') rot = Math.PI * 1.5
        _M.rotateVerticesY(_vC, rot)
        vC.push(..._vC)
    }

    return { v, c, vC }
}
