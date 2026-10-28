import { _M, IArraysGeom } from "_CORE/_M/_m"
import * as THREE from "three"

const COLOR_OUT = new THREE.Color().setStyle('#000000').toArray()
const COLOR_IN = new THREE.Color().setStyle('#e46969').toArray()

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

type PS = {
    v3: THREE.Vector3
    arr: THREE.Vector3[]
} 

const DEFAULT_OPTS: Required<T> = {
    pL: new THREE.Vector3(-15, 0, 15),
    pR: new THREE.Vector3(15, 0, 15),
    h: 10,
    holes: [
        { offsetLeft: 15, w: 2, h: 4, y: .5 }
    ],
}
export const stairs00 = (opts: T = {}): IArraysGeom => {
    const { }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const g: IArraysGeom = {
        v: [],
        c: [],
        index: []
    }


    const vStart = new THREE.Vector3()
    const vC = vStart.clone()
    vC.z -= 5

    const A = 0
    const A2 = A + .4
    const A_MAX = Math.PI * .5
    const aStep = .03

    const as = [0, 3, 3.2, 5, 5.2]

    const ps: PS[] = []
    as.forEach(a => {
        const v3 = new THREE.Vector3(0, 0, a)
        ps.push({
            v3,
            arr: [v3.clone()]
        })
    })

    let currentA = A
    const axisY = new THREE.Vector3(0, 1, 0)
    while(currentA < A_MAX) {
        currentA += aStep
        if (currentA > A_MAX) currentA = A_MAX
        ps.forEach(el => {
            const { v3, arr } = el 
            const newAng = v3.clone().applyAxisAngle(axisY, currentA)
            arr.push(newAng)
        })
    }

    console.log('ps', ps)

    return g
}