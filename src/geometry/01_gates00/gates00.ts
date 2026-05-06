import { _M } from "_CORE/_M/_m"
import { IArrayForBuffers } from "../GeomTypes"
import { box00 } from "geometry/01_box00/box00"

type T_f = {
    w: number
    d: number
    h: number
}

export const gates00 = (): IArrayForBuffers => {
    const g: IArrayForBuffers = { v: [], c: [], index: [] }

    const stepZ = 10
    const offstX = 5
    const w = 1.5
    const h = 60

    for (let i = 0; i < 12; ++i) {
        const r = box00({ w, d: 1, h })
        _M.translateVertices(r.v, offstX, 0, -i * stepZ)  
        _M.mergeIndexedArrays(g, r)

        const l = box00({ w, d: 1, h })
        _M.rotateVerticesY(l.v, Math.PI)
        _M.translateVertices(l.v, -offstX, 0, -i * stepZ)
        _M.mergeIndexedArrays(g, l)

        const t = box00({ w, d: 1, h: offstX * 2 - w })
        _M.rotateVerticesZ(t.v, Math.PI / 2)
        _M.translateVertices(t.v, offstX - w * .5, h - w * .5, -i * stepZ)
        _M.mergeIndexedArrays(g, t)
    }

    return g
}