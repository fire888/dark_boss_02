import { _M } from "./_m";
import { createLineGeom, mirrorPathX } from './_lineGeom'
import { DataToCreateGeom, DataToCreateTileU, DataToCreateLine } from '../entities/labyrinth/types'
import { vC_H } from "../constants/CONSTANTS";


export const createTileL = (data: DataToCreateTileU) => {
    let { w, n, e, s, num, width } = data

    let dir = null
    if (n) {
        if (e) dir = 'ne'
        if (w) dir = 'nw'
    }
    if (s) {
        if (e) dir = 'se'
        if (w) dir = 'sw'
    }

    let startData: DataToCreateLine, endData: DataToCreateLine

    const v = []
    const c = []

    if (dir === 'nw') {
        startData = data.n
        endData = data.w

        const copyEndPath = mirrorPathX(endData.path)

        const arr = _M.interpolateArrays({
            forms: [startData.form, endData.form],
            paths: [startData.path, copyEndPath],
            colors: [startData.color, endData.color],
            n: num,
        })

        const angleStep = Math.PI * .5 / num

        for (let i = 0; i < arr.paths.length; i++) {
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: true,
            })
            _M.translateVertices(l.v, width / 2, 0, 0)
            _M.rotateVerticesY(l.v, -angleStep * i - angleStep / 2)
            _M.translateVertices(l.v, -width / 2, 0, -width / 2)
            v.push(...l.v)
            c.push(...l.c)
        }
    }
    if (dir === 'ne') {
        startData = data.n
        endData = data.e

        const arr = _M.interpolateArrays({
            forms: [startData.form, endData.form],
            paths: [startData.path, endData.path],
            colors: [startData.color, endData.color],
            n: num,
        })

        const angleStep = Math.PI * .5 / num

        for (let i = 0; i < arr.paths.length; i++) {
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: true,
            })
            _M.translateVertices(l.v, -width / 2, 0, 0)
            _M.rotateVerticesY(l.v, angleStep * i + angleStep / 2)
            _M.translateVertices(l.v, width / 2, 0, -width / 2)
            v.push(...l.v)
            c.push(...l.c)
        }
    }
    if (dir === 'sw') {
        startData = data.s
        endData = data.w

        const arr = _M.interpolateArrays({
            forms: [startData.form, endData.form],
            paths: [startData.path, endData.path],
            colors: [startData.color, endData.color],
            n: num,
        })  

        const angleStep = Math.PI * .5 / num

        for (let i = 0; i < arr.paths.length; i++) {
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: true,
            })
            _M.translateVertices(l.v, width / 2, 0, 0)
            _M.rotateVerticesY(l.v, angleStep * i + angleStep / 2)
            _M.translateVertices(l.v, -width / 2, 0, width / 2)
            v.push(...l.v)
            c.push(...l.c)
        }
    }
    if (dir === 'se') {
        startData = data.s
        endData = data.e

        const copyPath = mirrorPathX(endData.path)

        const arr = _M.interpolateArrays({
            forms: [startData.form, endData.form],
            paths: [startData.path, copyPath],
            colors: [startData.color, endData.color],
            n: num,
        })  

        const angleStep = Math.PI * .5 / num

        for (let i = 0; i < arr.paths.length; i++) {
            const l = createLineGeom({
                form: arr.forms[i],
                path: arr.paths[i],
                color: arr.colors[i],
                isClosed: true,
            })
            _M.translateVertices(l.v, -width / 2, 0, 0)
            _M.rotateVerticesY(l.v, -angleStep * i - angleStep / 2)
            _M.translateVertices(l.v, width / 2, 0, width / 2)
            v.push(...l.v)
            c.push(...l.c)
        }
    }

    const vC: number[] = []
    {
        const w = width

        // bottom face
        vC.push(..._M.createPolygon(
            [-w * .5, 0, w * .5],
            [w * .5, 0, w * .5],
            [w * .5, 0, -w * .5],
            [-w * .5, 0, -w * .5],
        ))

        // arc
        /*
            *     |
                 /   
            __ /
        */

        const r = w
        const angleStep = Math.PI * .5 / 5
        const arcVC = [] 
        for (let i = 0; i < 5; ++i) {
            const a1 = angleStep * i
            const a2 = angleStep * (i + 1)

            arcVC.push(..._M.createPolygon(
                [Math.cos(a2) * r, 0, Math.sin(a2) * r],
                [Math.cos(a1) * r, 0, Math.sin(a1) * r],
                [Math.cos(a1) * r, vC_H, Math.sin(a1) * r],
                [Math.cos(a2) * r, vC_H, Math.sin(a2) * r],
            ))
        }

        if (dir === 'nw') {
            _M.translateVertices(arcVC, -w * .5, 0, -w * .5)
            vC.push(...arcVC)
        }
        if (dir === 'ne') {
            _M.rotateVerticesY(arcVC, -Math.PI * .5)
            _M.translateVertices(arcVC, w * .5, 0, -w * .5)
            vC.push(...arcVC)
        }
        if (dir === 'sw') {
            _M.rotateVerticesY(arcVC, Math.PI * .5)
            _M.translateVertices(arcVC, -w * .5, 0, w * .5)
            vC.push(...arcVC)
        }
        if (dir === 'se') {
            _M.rotateVerticesY(arcVC, Math.PI)
            _M.translateVertices(arcVC, w * .5, 0, w * .5)
            vC.push(...arcVC)
        }
    }

    return { v, c, vC }
}
