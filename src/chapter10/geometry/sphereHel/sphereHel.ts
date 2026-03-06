import { _M, A2, A3 } from "_CORE/_M/_m"
import { IArrayForBuffers } from "chapter10/types/GeomTypes"
import { Root } from "chapter10"
import { UV_TRIANGLE, COL_WHITE, UV_DARK, COL_BLUE_TOP, COL_RED, UV_EMPTY } from "../tileMapWall"
import * as THREE from "three"


export const createSphereHel = (): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const vCollide: number[] = []

    let spd1 = Math.random() * .12 + 0.01
    const spd2 = Math.random() * .12 + 0.01
    if (Math.abs(spd1 - spd2) < 0.015) {
        spd1 += 0.05
    }

    let dist1 = 1
    const savedVec_1 = new THREE.Vector2(1, 0)
    let dist2 = 1
    const savedVec_2 = new THREE.Vector2(1, 0)

    const currentPoint = new THREE.Vector3(1, 0, 0)

    let savedPoint = null
    let prevP0
    let prevP1
    let prevP3

    let collidePrevPC
    let collidePrevP3

    let n = 0
    let collideCount = 0
    const maxN = 200
    while (n < maxN) {
        ++n
        ++collideCount

        dist1 += spd1
        const vec_1 = new THREE.Vector2(Math.cos(dist1), Math.sin(dist1))
        const vec1_Diff = vec_1.clone().sub(savedVec_1)
        savedVec_1.copy(vec_1)
        
        dist2 += spd2
        const vec_2 = new THREE.Vector2(Math.cos(dist2), Math.sin(dist2))
        const vec2_Diff = vec_2.clone().sub(savedVec_2)
        savedVec_2.copy(vec_2)

        currentPoint.x += vec1_Diff.x + vec2_Diff.x
        currentPoint.z += vec1_Diff.y
        currentPoint.y += vec2_Diff.y

        if (savedPoint) {
            const dirFront = currentPoint.clone().sub(savedPoint).normalize()
            const dirLeft = currentPoint.clone().cross(dirFront).normalize()

            const w = 0.1

            const p0 = dirLeft.clone().multiplyScalar(w).add(currentPoint)
            const p1 = dirLeft.clone().multiplyScalar(-w).add(currentPoint)
            const p3 = currentPoint.clone().multiplyScalar(0.9)

            if (!prevP0 && !prevP1) { // cap start 
                const _v = [
                    ...p3.toArray(),
                    ...p1.toArray(),
                    ...p0.toArray(),
                ]
                v.push(..._v)
                c.push(
                    0, 1, 0, 
                    0, 1, 0, 
                    0, 1, 0
                )
                uv.push(
                    0, 0,
                    0, 0,
                    0, 0
                )
            }
            if (!collidePrevPC) collidePrevPC = currentPoint.clone()
            if (!collidePrevP3) collidePrevP3 = p3.clone()

            if (prevP0 && prevP1 && prevP3) {
                {
                    const _v = _M.createPolygonV(
                        prevP0.clone(), 
                        prevP1.clone(), 
                        p1.clone(),
                        p0.clone(), 
                    )
                    v.push(..._v)
                    c.push(...COL_WHITE)
                    uv.push(...UV_EMPTY)
                }
                {
                    const _v = _M.createPolygonV(
                        p3.clone(), 
                        prevP3.clone(), 
                        prevP0.clone(),
                        p0.clone(), 
                    )
                    v.push(..._v)
                    c.push(...COL_RED)
                    uv.push(...UV_EMPTY)
                }
                {
                    const _v = _M.createPolygonV(
                        prevP3.clone(), 
                        p3.clone(), 
                        p1.clone(),
                        prevP1.clone(), 
                    )
                    v.push(..._v)
                    c.push(...COL_RED)
                    uv.push(...UV_EMPTY)
                }

                if (collideCount > 7) {
                    collideCount = 0
                    const vCol = _M.createPolygonV(p3.clone().add(new THREE.Vector3(0, 0.1, 0)), collidePrevP3.clone().add(new THREE.Vector3(0, 0.1, 0)), collidePrevPC.clone(), currentPoint.clone())
                    vCollide.push(...vCol)
                    collidePrevP3 = p3.clone()
                    collidePrevPC = currentPoint.clone()
                }
            }

            if (n === maxN) { // cap end
                const _v = [
                    ...p0.toArray(),
                    ...p1.toArray(),
                    ...p3.toArray(),
                ]
                v.push(..._v)
                c.push(
                    0, 1, 0, 
                    0, 1, 0, 
                    0, 1, 0
                )
                uv.push(
                    0, 0,
                    0, 0,
                    0, 0
                )
            }

            prevP0 = p0.clone()
            prevP1 = p1.clone()
            prevP3 = p3.clone()
        }

        savedPoint = currentPoint.clone()
    }

    return { v, c, uv, vCollide }
}