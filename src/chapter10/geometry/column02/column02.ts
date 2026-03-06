import { _M } from "_CORE/_M/_m"
import { IArrayForBuffers } from "chapter10/types/GeomTypes"
import { Root } from "chapter10"
import { UV_TRIANGLE, COL_WHITE, UV_DARK, COL_BLUE_TOP, 
    UV_POINTS, COL_RED,
    UV_EMPTY,
    UV_GRID, UV_GRID_CIRCLE,
    UV_HT
} from "../tileMapWall"
import * as THREE from 'three'


export const createColumn02 = (w: number = .5, h: number = 2, n: number = 8): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const vCollide: number[] = []

    let mode = 'ARROW'
    const r = Math.random()
    if (r < .33) {
        mode = 'GRID'
    } else if (r < .66) {
        mode = 'HT'
    } else if (r < .8) {
        mode = 'EMPTY'
    }

    {
        const nS = 8

        const points0 = [] 
        const points1 = []
        const v3 = new THREE.Vector3(w + .05, 0, 0)
        const v3_1 = new THREE.Vector3(w, 0, 0)
        for (let i = 0; i < nS; ++i) {
            const vec = v3.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), i / nS * Math.PI * 2) 
            points0.push(vec)
            const vec1 = v3_1.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), i / nS * Math.PI * 2)
            points1.push(vec1)
        }

        for (let i = 0; i < points0.length; i++) { 
            const prev = i - 1 > -1 ? i - 1 : points0.length - 1
            const cur = i

            {
                const pol = _M.createPolygonV(
                    points0[prev].clone().setY(0),
                    points0[cur].clone().setY(0),
                    points0[cur].clone().setY(.1),
                    points0[prev].clone().setY(.1),
                )
                v.push(...pol)
                uv.push(...UV_POINTS)
                c.push(...COL_RED)
            }

            {
                const pol = _M.createPolygonV(
                    points0[prev].clone().setY(.1),
                    points0[cur].clone().setY(.1),
                    points1[cur].clone().setY(.2),
                    points1[prev].clone().setY(.2),
                )
                v.push(...pol)
                uv.push(...UV_EMPTY)
                c.push(...COL_RED)
            }

            let currentH = .2 
            const hs = .15

            {
                while (currentH < h - .3) {
                    currentH += hs
                    const pol = _M.createPolygonV(
                        points1[prev].clone().setY(currentH - hs),
                        points1[cur].clone().setY(currentH - hs),
                        points1[cur].clone().setY(currentH),
                        points1[prev].clone().setY(currentH),
                    )
                    v.push(...pol)

                    if (mode === 'GRID') { // grid
                        if (Math.random() < .1) { 
                            uv.push(...UV_GRID)
                        } else {
                            uv.push(...UV_GRID_CIRCLE)
                        }
                    } else if (mode === 'ARROW') { // arrows
                        if (Math.random() < .1) { 
                            uv.push(...UV_DARK)
                        } else {
                            uv.push(...UV_TRIANGLE)
                        }
                    } else if (mode === 'HT') { // HT
                        if (Math.random() < .1) { 
                            uv.push(...UV_POINTS)
                        } else {
                            uv.push(...UV_HT)
                        }
                    } else if (mode === 'EMPTY') {
                        if (Math.random() < .1) { 
                            uv.push(...UV_EMPTY) 
                        } else {
                            uv.push(...UV_DARK)
                        }
                    }

                    c.push(...COL_WHITE)
                }
            }

            {
                const pol = _M.createPolygonV(
                    points1[prev].clone().setY(currentH),
                    points1[cur].clone().setY(currentH),
                    points0[cur].clone().setY(currentH + .12),
                    points0[prev].clone().setY(currentH + .12),
                )
                v.push(...pol)
                uv.push(...UV_EMPTY)
                c.push(...COL_RED)
            }

            {
                const pol = _M.createPolygonV(
                    points0[prev].clone().setY(currentH + .12),
                    points0[cur].clone().setY(currentH + .12),
                    points0[cur].clone().setY(h),
                    points0[prev].clone().setY(h),
                )
                v.push(...pol)
                uv.push(...UV_POINTS)
                c.push(...COL_RED)
            }

            v.push(
                points0[prev].x, h, points0[prev].z,
                points0[cur].x, h, points0[cur].z,
                0, h, 0
            )
            uv.push(.55, .55,  .55, .55,  .55, .55)
            c.push(1, 0, 0,  1, 0, 0,   1, 0, 0)
        }
    }

    const wC = w * .5

    vCollide.push(
        ..._M.createPolygon(
            [-wC, 0, 0],
            [wC, 0, 0],
            [wC, h, 0],
            [-wC, h, 0],
        ),
        // ..._M.createPolygon(
        //     [0, 0, -wC],
        //     [0, 0, wC],
        //     [0, h, wC],
        //     [0, h, -wC],
        // )
    )

    return { v, c, uv, vCollide }
}