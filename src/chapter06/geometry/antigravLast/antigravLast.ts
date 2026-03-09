import { IArrayForBuffers } from "../../types/GeomTypes"
import { _M } from '../../geometry/_m'
import { OUTER_HOUSE_FORCE } from "../../constants/CONSTANTS"
import { createAntigrav } from "../../geometry/antigrav/antigrav"
import { createPilaster04 } from "../../geometry/pilaster04/pilaster04"

export const buildAntigravLast = (): IArrayForBuffers => {
    const v: number[] = [] 
    const uv: number[] = []
    const c: number[] = []
    const forceMat: number[] = []
    const vCollide: number[] = []

    for (let i = 0; i < 6; ++i) {
        const r = createAntigrav(1)
        
        const _v = []
        const copy = [...r.v]
        _M.rotateVerticesX(copy, Math.PI / 2)
        _v.push(...copy)
        uv.push(...r.uv)
        c.push(...r.c)

        _M.rotateVerticesX(r.v, -Math.PI / 2)
        _v.push(...r.v)
        uv.push(...r.uv)
        c.push(...r.c)
        for (let i = 0; i < c.length; i += 3) {
            forceMat.push(1)
        }
        for (let i = 0; i < c.length; i += 1) {
            c[i] = 1
        }

        _M.translateVertices(_v, 0, 5, 0)

        {
            const __v = []
            const r = createPilaster04(.8, 4, .2)
            const copy = [...r.v]
            __v.push(...r.v)
            uv.push(...r.uv)
            c.push(...r.c)
            for (let i = 0; i < c.length; i += 3) {
                forceMat.push(OUTER_HOUSE_FORCE)
            }

            _M.rotateVerticesY(copy, Math.PI)
            __v.push(...copy)
            uv.push(...r.uv)
            c.push(...r.c)
            for (let i = 0; i < c.length; i += 3) {
                forceMat.push(OUTER_HOUSE_FORCE)
            }

            _v.push(...__v)
        }

        const collisionV = [
            ..._M.createPolygon(
                [1, 0, -.3],
                [-1, 0, -.3],
                [-1, 6, -.3],
                [1, 6, -.3],
            ),
            ..._M.createPolygon(
                [1, 0, .3],
                [-1, 0, .3],
                [-1, 6, .3],
                [1, 6, .3],
            )
        ]
        _M.translateVertices(collisionV, 0, 0, -i * 2)
        vCollide.push(...collisionV)

        _M.translateVertices(_v, 0, 0, -i * 2)
        v.push(..._v)
    }

    for (let i = 0; i < forceMat.length; ++i) {
        forceMat[i] = 1.2
    }

    return { v, uv, c, vCollide, forceMat }
}