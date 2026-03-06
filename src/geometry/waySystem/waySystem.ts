import { _M, A3 } from "../_m"
import { IArrayForBuffers, T_ROOM } from "types/GeomTypes"
import * as THREE from "three" 
import { createHelix01 } from "geometry/helix01/helix01"
import { createWaySingle, T_LONG_WAY } from "./waySingle"


export const createWaySystem = ():  { geomData: IArrayForBuffers, segments: T_ROOM[] } => {

    // MAIN WAY

    const options: T_LONG_WAY = {
        p0: new THREE.Vector3(0, 0, 0), dir0: new THREE.Vector3(1, 0, 0),
        p1: new THREE.Vector3(400, 0, 0), dir1: new THREE.Vector3(1, 0, 0),
    }

    const { geomData: { v, c, uv, vCollide }, segments } = createWaySingle(options, false)

    const helixGlobal = createHelix01(400, 50)
    _M.rotateVerticesZ(helixGlobal.v, -Math.PI * .5)
    _M.fill(helixGlobal.v, v)
    _M.fill(helixGlobal.c, c)
    _M.fill(helixGlobal.uv, uv)


    // LEFT\RIGHT WAYS

    const L_SLEEP_WAYS = 45
    const MAX_WAYS = 10
    let countWaysMaked = 0
    let segmentIndex = 1

    while (segmentIndex < segments.length && countWaysMaked < MAX_WAYS) {
        while (segments[segmentIndex].type !== 'FLOOR') { 
            ++segmentIndex
        }

        if (Math.random() < .3) {
            const { p0, p1, p2, p3, dir } = segments[segmentIndex]

            let start, dirSeg, end
            if (countWaysMaked % 2 === 0) { // left\right direction
                start = p2.clone().sub(p3).multiplyScalar(.5).add(p3).setY(p2.y + (Math.random() - .5) * .005)
                dirSeg = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5)
                end = dirSeg.clone().multiplyScalar(L_SLEEP_WAYS).add(start)
            } else {
                start = p1.clone().sub(p0).multiplyScalar(.5).add(p0).setY(p1.y + (Math.random() - .5) * .005)
                dirSeg = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * .5)
                end = dirSeg.clone().multiplyScalar(L_SLEEP_WAYS).add(start) 
            }

            const options: T_LONG_WAY = { 
                p0: start, dir0: dirSeg, 
                p1: end, dir1: dirSeg 
            }
            const { geomData } = createWaySingle(options, true)
            _M.fill(geomData.v, v)
            _M.fill(geomData.c, c)
            _M.fill(geomData.uv, uv)
            _M.fill(geomData.vCollide, vCollide)

            ++countWaysMaked
        }

        ++segmentIndex
    }

    return { geomData: { v, uv, c, vCollide }, segments }
}
