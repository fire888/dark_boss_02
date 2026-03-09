import { _M, A3 } from "../_m"
import { tileMapWall } from "../tileMapWall"
import { createTopElem_00 } from "../../geometry/topElem00/topElem_00"


export const createAntigrav = (
    radius: number | null = null
) => {
    const v: number[] = [] 
    const uv: number[] = [] 
    const c: number[] = []
    const forceMat: number[] = []

    const h1 = Math.random() * .1 + .1
    const h2 = Math.random() * .2 + h1 + .05 
    const h3 = .12

    let r2 = 1 + Math.random() * .5
    let r3 = r2 + .3
    let r4 = r3 + .05
    let r1 = r2 - .3
    let r0 = r1 - .1 

    if (radius !== null) {
        r2 = radius - .2 * Math.random()
        r3 = radius
        r4 = r3 + .05
        r1 = r2 - .3
        r0 = r1 - .1 
    }

    const N = 6 + Math.floor(Math.random() * 10)

    for (let i = 0; i < N; ++i) { 
        const r = _M.lathePath([
            [r4, 0],
            [r4, h3],
            [r3, h3],
            [r2, h2],
            [r1, h2],
            [r0, 0],
        ], 12, [1, 1, 1], tileMapWall.noise)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)
    }

    const topElem = createTopElem_00([1, 1, 1], Math.random() * .3 + .1, Math.random() * .5 + .4)
    for (let i = 0; i < N; ++i) {
        const copy = [...topElem.v]

        const r = r2 + (r3 - r2) * .5
        const angle = i / N * Math.PI * 2
        const angle1 = (.5 / N) * Math.PI * 2 + angle  
        const x = Math.cos(angle1) * r
        const z = Math.sin(angle1) * r

        _M.rotateVerticesY(copy, -angle1)
        _M.translateVertices(copy, x, 0, z)
        v.push(...copy)
        c.push(...topElem.c)
        uv.push(...topElem.uv)
    }

    for (let i = 0; i < c.length; i += 3) {
        forceMat.push(1.2)
    }

    for (let i = 0; i < N; ++i) {
        const r = r0 + .1

        const x = Math.cos(i / N * Math.PI * 2) * r
        const z = Math.sin(i / N * Math.PI * 2) * r

        const x1 = Math.cos((i + 1) / N * Math.PI * 2) * r
        const z1 = Math.sin((i + 1) / N * Math.PI * 2) * r
        
        v.push(
            x1, .15, z1, 
            x, .15, z,
            0, .15, 0, 
        )
        uv.push(...tileMapWall.stoneTree)
        c.push(
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
        ) 
        forceMat.push(-500, -500, -500)
    }

    return { v, uv, c, forceMat }
}