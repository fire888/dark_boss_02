import { _M, IArraysGeom } from "_CORE/_M/_m"
import { offset } from "chapter09/entityLabyrinth/offset"
import * as THREE from "three"

const COLOR_OUT = new THREE.Color().setStyle('#000000').toArray()
const COLOR_IN = new THREE.Color().setStyle('#000000').toArray()

type THole = {
    offsetLeft: number,
    w: number,
    h: number,
    y: number,
}

type T = {
    pL?: THREE.Vector3,
    pR?: THREE.Vector3,
    h?: number,
    holes?: THole[],
}

const DEFAULT_OPTS: Required<T> = {
    pL: new THREE.Vector3(-15, 0, 15),
    pR: new THREE.Vector3(15, 0, 15),
    h: 10,
    holes: [
        { offsetLeft: 15, w: 2, h: 4, y: .5 }
    ],
}
export const wall00 = (opts: T = {}): IArraysGeom => {
    const { 
        pL, pR, holes, h,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const g: IArraysGeom = {
        v: [],
        c: [],
        index: []
    }

    if (!holes || holes.length < 1) {  
        g.v.push(
            ...pL.toArray(), 
            ...pR.toArray(),
            ...pR.clone().add(new THREE.Vector3(0, h, 0)).toArray(), 
            ...pL.clone().add(new THREE.Vector3(0, h, 0)).toArray(),
        )
        g.c && g.c.push(...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT)
        g.index && g.index.push(0, 1, 2, 0, 2, 3)   
    } else {

        const d = pL.distanceTo(pR)

        const sortedHoles = holes.sort((a, b) => a.offsetLeft - b.offsetLeft)
        for (let i = 0; i < sortedHoles.length; ++i) {
            const { offsetLeft, w, h: holeH, y } = sortedHoles[i]
            {
                // стенка перед дырой
                let pLB = new THREE.Vector3(0, 0, 0)
                let pRB = new THREE.Vector3(offsetLeft - w / 2, 0, 0)
                let pRT = new THREE.Vector3(offsetLeft - w / 2, h, 0)
                let pLT = new THREE.Vector3(0, h, 0)

                if (i !== 0) {
                    const { offsetLeft, w, h, y } = sortedHoles[i - 1]
                    pLB = new THREE.Vector3(offsetLeft + w / 2, 0, 0)
                    pLT = new THREE.Vector3(offsetLeft + w / 2, h, 0)
                }

                const _v = [...pLB.toArray(), ...pRB.toArray(), ...pRT.toArray(), ...pLT.toArray()]
                const _c = [...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT]
                const _index = [0, 1, 2, 0, 2, 3]

                _M.mergeIndexedArrays(g, { v: _v, c: _c, index: _index })
            }

            {
                if (y > 0) {
                    // стенка под дырой
                    let pLB = new THREE.Vector3(offsetLeft - w / 2, 0, 0)
                    let pRB = new THREE.Vector3(offsetLeft + w / 2, 0, 0)
                    let pRT = new THREE.Vector3(offsetLeft + w / 2, y, 0)
                    let pLT = new THREE.Vector3(offsetLeft - w / 2, y, 0)

                    const _v = [...pLB.toArray(), ...pRB.toArray(), ...pRT.toArray(), ...pLT.toArray()]
                    const _c = [...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT]
                    const _index = [0, 1, 2, 0, 2, 3]

                    _M.mergeIndexedArrays(g, { v: _v, c: _c, index: _index })
                }

            }

            {
                if (y + holeH < h) {
                    // стенка над дырой
                    let pLB = new THREE.Vector3(offsetLeft - w / 2, holeH + y, 0)
                    let pRB = new THREE.Vector3(offsetLeft + w / 2, holeH + y, 0)
                    let pRT = new THREE.Vector3(offsetLeft + w / 2, h, 0)
                    let pLT = new THREE.Vector3(offsetLeft - w / 2, h, 0)

                    const _v = [...pLB.toArray(), ...pRB.toArray(), ...pRT.toArray(), ...pLT.toArray()]
                    const _c = [...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT]
                    const _index = [0, 1, 2, 0, 2, 3]

                    _M.mergeIndexedArrays(g, { v: _v, c: _c, index: _index })
                }

            }

            // последняя стенка справа от дыры 
            if (!sortedHoles[i + 1]) {
                let pLB = new THREE.Vector3(offsetLeft + w / 2, 0, 0)
                let pRB = new THREE.Vector3(d, 0, 0)
                let pRT = new THREE.Vector3(d, h, 0)
                let pLT = new THREE.Vector3(offsetLeft + w / 2, h, 0)

                const _v = [...pLB.toArray(), ...pRB.toArray(), ...pRT.toArray(), ...pLT.toArray()]
                const _c = [...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT]
                const _index = [0, 1, 2, 0, 2, 3]

                _M.mergeIndexedArrays(g, { v: _v, c: _c, index: _index })
            }
        }

        const dir = new THREE.Vector3().subVectors(pR, pL).setY(0).normalize()
        _M.rotateVerticesY(g.v, -_M.angleFromCoords(dir.x, dir.z))
        _M.translateVertices(g.v, pL.x, pL.y, pL.z)
    }

    return g
}