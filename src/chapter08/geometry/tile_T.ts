import { _M, A3 } from "./_m"

import { createLineGeom  } from "./_lineGeom";
import { vC_H } from "../constants/CONSTANTS"
import { DataToCreateTileU } from '../entities/labyrinth/types'


export const createTileT = (data: DataToCreateTileU) => {
    const { w, n, s, e, width, num } = data

    const v: number[] = []
    const c: number[] = []
    const vC: number[] = [] 
    
    {
        // bottom collision 
        const w = width

        vC.push(
            ..._M.createPolygon(
                [-w * .5, 0, w * .5],
                [w * .5, 0, w * .5],
                [w * .5, 0, -w * .5],
                [-w * .5, 0, -w * .5],
            )
        )

    }

    if (w && e && s) {
        /*
            |||||||||
            |       |
            |       |
            
        */
        const pathStart: A3[] = [
            [0, 0, 0], 
            w.path[0], 
            w.path[1], 
            w.path[2], 
        ]
        const pathEnd: A3[] = [
            [0, 0, 0], 
            e.path[0], 
            e.path[1], 
            e.path[2], 
        ]
        
        const arr = _M.interpolateArrays({
            paths: [pathStart, pathEnd], 
            forms: [w.form, e.form], 
            colors: [w.color, e.color],
            n: num,
        })

        const step = width / num
        const hstep = step / 2
        const hwidth = width / 2

        for (let i = 0; i < arr.paths.length; ++i) { 
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: false,
            })

            _M.rotateVerticesY(l.v, Math.PI / 2)
            _M.translateVertices(l.v, -hwidth + i * step + hstep, 0, 0)

            v.push(...l.v)
            c.push(...l.c)
        }

        vC.push(
            ..._M.createPolygon(
                [-hwidth, 0, -hwidth],
                [hwidth, 0, -hwidth],
                [hwidth, vC_H, -hwidth],
                [-hwidth, vC_H, -hwidth],
            )
        )
    }

    if (w && e && n) {
        /*
            |       |
            |       |
            |||||||||
        */
        const pathStart: A3[] = [
            [0, 0, 0], 
            w.path[4], 
            w.path[3], 
            w.path[2], 
        ]
        const pathEnd: A3[] = [
            [0, 0, 0], 
            e.path[4], 
            e.path[3], 
            e.path[2], 
        ]
        
        const arr = _M.interpolateArrays({
            paths: [pathStart, pathEnd], 
            forms: [w.form, e.form], 
            colors: [w.color, e.color],
            n: num,
        })

        const step = width / num
        const hstep = step / 2
        const hwidth = width / 2

        for (let i = 0; i < arr.paths.length; ++i) { 
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: false,
            })

            _M.rotateVerticesY(l.v, Math.PI / 2)
            _M.translateVertices(l.v, -hwidth + i * step + hstep, 0, 0)

            v.push(...l.v)
            c.push(...l.c)
        }

        vC.push(
            ..._M.createPolygon(
                [hwidth, 0, hwidth],
                [-hwidth, 0, hwidth],
                [-hwidth, vC_H, hwidth],
                [hwidth, vC_H, hwidth],
            )
        )        
    }


    if (n && s && e) {
        /*
            --------
            -
            -
            -
            --------
        */
        const pathStart: A3[] = [
            [0, 0, 0], 
            n.path[4], 
            n.path[3], 
            n.path[2], 
        ]
        const pathEnd: A3[] = [
            [0, 0, 0], 
            s.path[4], 
            s.path[3], 
            s.path[2], 
        ]
        
        const arr = _M.interpolateArrays({
            paths: [pathStart, pathEnd], 
            forms: [n.form, s.form], 
            colors: [n.color, s.color],
            n: num,
        })

        const step = width / num
        const hstep = step / 2
        const hwidth = width / 2

        for (let i = 0; i < arr.paths.length; ++i) { 
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: false,
            })
            _M.translateVertices(l.v, 0, 0, -hwidth + i * step + hstep)
            v.push(...l.v)
            c.push(...l.c)
        }

        vC.push(
            ..._M.createPolygon(
                [-hwidth, 0, hwidth],
                [-hwidth, 0, -hwidth],
                [-hwidth, vC_H, -hwidth],
                [-hwidth, vC_H, hwidth],
            )
        ) 
    }

    if (n && s && w) {
        /*
            --------
                   -
                   -
                   -
            --------
        */
        const pathStart: A3[] = [
            [0, 0, 0], 
            n.path[0], 
            n.path[1], 
            n.path[2], 
        ]
        const pathEnd: A3[] = [
            [0, 0, 0], 
            s.path[0], 
            s.path[1], 
            s.path[2], 
        ]
        
        const arr = _M.interpolateArrays({
            paths: [pathStart, pathEnd], 
            forms: [n.form, s.form], 
            colors: [n.color, s.color],
            n: num,
        })

        const step = width / num
        const hstep = step / 2
        const hwidth = width / 2

        for (let i = 0; i < arr.paths.length; ++i) { 
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: false,
            })
            _M.translateVertices(l.v, 0, 0, -hwidth + i * step + hstep)
            v.push(...l.v)
            c.push(...l.c)
        }

        vC.push(
            ..._M.createPolygon(
                [hwidth, 0, -hwidth],
                [hwidth, 0, hwidth],
                [hwidth, vC_H, hwidth],
                [hwidth, vC_H, -hwidth],
            )
        ) 
    }


    if (s && e) {
        /* 
        
           \ |
           _ *
        */

        const n = 5 
        const pathStart: A3[] = [
            [0, 0, 0], 
            s.path[0], 
            s.path[1], 
            s.path[2], 
        ]
        const pathEnd: A3[] = [
            [0, 0, 0], 
            e.path[0], 
            e.path[1], 
            e.path[2], 
        ]
        
        const arr = _M.interpolateArrays({
            paths: [pathStart, pathEnd], 
            forms: [s.form, e.form], 
            colors: [s.color, e.color],
            n,
        })


        const angleStep = Math.PI * .5 / n
        const angleStepH = angleStep / 2
        const hwidth = width / 2

        for (let i = 0; i < arr.paths.length; ++i) { 
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: false,
            })
            _M.translateVertices(l.v, -hwidth, 0, 0)
            _M.rotateVerticesY(l.v, -angleStepH - i * angleStep)
            _M.translateVertices(l.v, hwidth, 0, hwidth)
            v.push(...l.v)
            c.push(...l.c)
        }
    }

    if (s && w) {
        /* 
        
            | /
            * -
        */

        const n = 5 
        const pathStart: A3[] = [
            [0, 0, 0], 
            s.path[4], 
            s.path[3], 
            s.path[2], 
        ]
        const pathEnd: A3[] = [
            [0, 0, 0], 
            w.path[4], 
            w.path[3], 
            w.path[2], 
        ]
        
        const arr = _M.interpolateArrays({
            paths: [pathStart, pathEnd], 
            forms: [s.form, w.form], 
            colors: [s.color, w.color],
            n,
        })


        const angleStep = Math.PI * .5 / n
        const angleStepH = angleStep / 2
        const hwidth = width / 2

        for (let i = 0; i < arr.paths.length; ++i) { 
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: false,
            })
            _M.translateVertices(l.v, hwidth, 0, 0)
            _M.rotateVerticesY(l.v, angleStepH + i * angleStep)
            _M.translateVertices(l.v, -hwidth, 0, hwidth)
            v.push(...l.v)
            c.push(...l.c)
        }
    }

    if (n && w) {
        /* 
            * -
            | \
        */

        const nn = 5 
        const pathStart: A3[] = [
            [0, 0, 0], 
            n.path[4], 
            n.path[3], 
            n.path[2], 
        ]
        const pathEnd: A3[] = [
            [0, 0, 0], 
            w.path[4], 
            w.path[3], 
            w.path[2], 
        ]
        
        const arr = _M.interpolateArrays({
            paths: [pathStart, pathEnd], 
            forms: [n.form, w.form], 
            colors: [n.color, w.color],
            n: nn,
        })


        const angleStep = Math.PI * .5 / nn
        const angleStepH = angleStep / 2
        const hwidth = width / 2

        for (let i = 0; i < arr.paths.length; ++i) { 
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: false,
            })
            _M.translateVertices(l.v, hwidth, 0, 0)
            _M.rotateVerticesY(l.v, -angleStepH - i * angleStep)
            _M.translateVertices(l.v, -hwidth, 0, -hwidth)
            v.push(...l.v)
            c.push(...l.c)
        }
    }

    if (n && e) {
        /* 
            - * 
            / | 
        */

        const nn = 5 
        const pathStart: A3[] = [
            [0, 0, 0], 
            n.path[0], 
            n.path[1], 
            n.path[2], 
        ]
        const pathEnd: A3[] = [
            [0, 0, 0], 
            e.path[0], 
            e.path[1], 
            e.path[2], 
        ]
        
        const arr = _M.interpolateArrays({
            paths: [pathStart, pathEnd], 
            forms: [n.form, e.form], 
            colors: [n.color, e.color],
            n: nn,
        })


        const angleStep = Math.PI * .5 / nn
        const angleStepH = angleStep / 2
        const hwidth = width / 2

        for (let i = 0; i < arr.paths.length; ++i) { 
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: false,
            })
            _M.translateVertices(l.v, -hwidth, 0, 0)
            _M.rotateVerticesY(l.v, angleStepH + i * angleStep)
            _M.translateVertices(l.v, hwidth, 0, -hwidth)
            v.push(...l.v)
            c.push(...l.c)
        }
    }

    return { v, c, vC }
}
