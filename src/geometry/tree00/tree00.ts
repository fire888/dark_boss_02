import { _M } from "../_m"
import { IArrayForBuffers } from "types/GeomTypes"
import { Root } from "index"
import { COL_WHITE, UV_DARK, COL_BLUE_TOP, UV_GRID_CIRCLE, COL_RED, UV_EMPTY, 
    UV_POINTS_TREE,
    COL_BLUE_LIGHT_3,
} from "../tileMapWall"


export const createTree00 = (w: number = 1, h: number = 20, n: number = 8): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const vCollide: number[] = []

    const HH = h

    {
        const R0 = .2
        const R1 = .1
        const R2 = .3

        let r_Prev = R0
        let r_Curr = null

        const nS = 8

        let curH = 0
        let n = 0
        while (curH < HH) {
            ++n

            let col = COL_WHITE
            let __uv = UV_GRID_CIRCLE
            let segH = 0
            if (n === 1) {
                r_Curr = R0
                segH = .1
                col = COL_RED
                __uv = UV_EMPTY
            }
            if (n === 2) {
                r_Curr = R1
                segH = .1
                col = COL_RED
                __uv = UV_EMPTY
            }
            if (n === 3) {
                r_Curr = R2
                segH = .3
                col = COL_RED
                __uv = UV_EMPTY
            }
            if (n === 4) {
                r_Curr = R2 - .1
                segH = 0
                col = COL_RED
                __uv = UV_EMPTY
            }
            if (n === 5) {
                r_Curr = R2 - .1
                segH = -.1
                col = COL_RED
                __uv = UV_EMPTY
            }
            if (n > 5) {
                r_Curr = Math.random() * .2 + 0.05
                segH = Math.random() * .2 + .2
            }



            const __v = []

            for (let i = 0; i < nS; ++i) {
                let prev = i / nS
                let cur = (i - 1) / nS

                if (i === 0) cur = (nS - 1) / nS

                const _v = _M.createPolygon(
                    [Math.cos(prev * Math.PI * 2) * r_Prev, 0, Math.sin(prev * Math.PI * 2) * r_Prev],
                    [Math.cos(cur * Math.PI * 2) * r_Prev, 0, Math.sin(cur * Math.PI * 2) * r_Prev],
                    [Math.cos(cur * Math.PI * 2) * r_Curr, segH, Math.sin(cur * Math.PI * 2) * r_Curr],
                    [Math.cos(prev * Math.PI * 2) * r_Curr, segH, Math.sin(prev * Math.PI * 2) * r_Curr],
                )

                __v.push(..._v)

                const ran = Math.random()
                if (ran < .02) {
                    uv.push(...UV_DARK)
                    c.push(...COL_BLUE_TOP)
                } else if (ran < .04) {
                    uv.push(...UV_DARK)
                    c.push(...COL_BLUE_TOP)
                } else {
                    uv.push(...__uv)
                    c.push(...col)
                }

                if (curH + segH >= HH) {
                    __v.push(
                        Math.cos(prev * Math.PI * 2) * r_Curr, segH, Math.sin(prev * Math.PI * 2) * r_Curr,
                        Math.cos(cur * Math.PI * 2) * r_Curr, segH, Math.sin(cur * Math.PI * 2) * r_Curr,
                        0, segH + 1, 0
                    )
                    uv.push(...UV_POINTS_TREE)
                    c.push(...COL_BLUE_LIGHT_3)
                }
            }

            r_Prev = r_Curr
            
            _M.translateVertices(__v, 0, curH, 0)
            v.push(...__v)                        
            
            curH += segH
        }

        for (let i = 0; i < 15; ++i) {
            let p0 = [0, 0, 0]
            let p1 = [Math.random() + .3, 0, 0]
            let p2 = [p1[0] - Math.random() * .3, Math.random() * .5 + .1, 0]

            const _v = [...p0, ...p1, ...p2, ...p0, ...p2, ...p1]
            _M.rotateVerticesX(_v, Math.random() * .3)
            _M.rotateVerticesY(_v, Math.random() * Math.PI * 2)
            _M.translateVertices(_v, 0, curH, 0)
            v.push(..._v)
            uv.push(...UV_POINTS_TREE, ...UV_POINTS_TREE)
            c.push(...COL_BLUE_LIGHT_3, ...COL_BLUE_LIGHT_3)
        }
    }

    vCollide.push(
        ..._M.createPolygon(
            [-.3, 0, 0],
            [.3, 0, 0],
            [.3, HH, 0],
            [-.3, HH, 0],
        ),
    )

    return { v, c, uv, vCollide }
}