import { _M } from "../../_CORE/_M/_m"
import * as THREE from 'three'

export const createArrow = (s: number = 10, wA: number = .2): { v: number[] } => {
    const w = wA * .2
    const wH = w * .5
    const d = .7 * s
    const w2 = wA
    const wH2 = w2 * .5
    const d2 = .3 * s

    const v = [
         -wH,   0,   0,
          wH,   0,   0,
          wH,   0,   d,

         -wH,   0,   0,
          wH,   0,   d,
         -wH,   0,   d,

        -wH2,   0,   d,
         wH2,   0,   d,
           0,   0,   d2 +d,
    ]

    return { v }
}


type T_CrMeshArrow = {
    startPos?: THREE.Vector3
    endPos?: THREE.Vector3
    color?: THREE.Color
    w?: number
    l?: number
}

export const createMeshArrow = (opts: T_CrMeshArrow = {}) => {
    const {
        startPos = new THREE.Vector3(0, 0, 0),
        endPos = new THREE.Vector3(10, 0, 0),
        color: color = new THREE.Color().setRGB(1, 0, 0),
        l = startPos.distanceTo(endPos),
        w = startPos.distanceTo(endPos) * .05
    } = opts

    const dataV = createArrow(l, w)
    
    const m = _M.createMesh({ v: dataV.v, material: new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }) } )
    m.position.copy(startPos)
    m.lookAt(endPos)
        
    return m
}