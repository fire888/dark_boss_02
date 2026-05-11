import { _M, IArraysGeom } from "_CORE/_M/_m"
import * as THREE from "three"
import { wall00 } from "../06_wall00/wall00"

const COLOR_OUT = new THREE.Color().setStyle('#ffffff').toArray()
const COLOR_CEIL = new THREE.Color().setStyle('#debbea').toArray()
const COLOR_IN = new THREE.Color().setStyle('#000000').toArray()

type THole = {
    wallKey: string,
    offsetLeft: number,
    w: number,
    h: number,
    y: number,
}

type T = {
    p0?: THREE.Vector3,
    p1?: THREE.Vector3,
    p2?: THREE.Vector3,
    p3?: THREE.Vector3,
    h?: number,
    holes?: THole[],
}

const DEFAULT_OPTS: Required<T> = {
    p0: new THREE.Vector3(-15, 0, 15),
    p1: new THREE.Vector3(15, 0, 15),
    p2: new THREE.Vector3(15, 0, -15),
    p3: new THREE.Vector3(-15, 0, -15),
    h: 10,
    holes: [
       // { wallKey: 'p1-p0', offsetLeft: 15, w: 4, h: 4, y: 0 }
    ],
}

type T_Perim = {
    [key: string]: THREE.Vector3
}

export const room00 = (opts: T = {}): IArraysGeom => {
    const { 
        p0, p1, p2, p3, holes, h,
    }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const floor: T_Perim = { p0, p1, p2, p3 }
    const ceil: T_Perim = {} 
    Object.keys(floor).forEach((key: string) => { ceil[key] = floor[key].clone().add(new THREE.Vector3(0, h, 0)) })

    const g: IArraysGeom = {
        v: [],
        c: [],
        index: [],
    } 

    g.v = [
        ...floor.p0.toArray(), ...floor.p1.toArray(), ...floor.p2.toArray(), ...floor.p3.toArray(),
        ...ceil.p0.toArray(), ...ceil.p1.toArray(), ...ceil.p2.toArray(), ...ceil.p3.toArray(),
    ]

    g.c = [
        ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, ...COLOR_OUT, // 3
        ...COLOR_CEIL, ...COLOR_CEIL, ...COLOR_CEIL, ...COLOR_CEIL,
    ]

    g.index = [
        0, 1, 2, 0, 2, 3,     // floor
        5, 4, 7, 5, 7, 6,     // ceil
    ]


    const wallsLinks = [
        { pL: p1, pR: p0, holesKeys: ['p1-p0'] }, 
        { pL: p2, pR: p1, holesKeys: ['p2-p1'] }, 
        { pL: p3, pR: p2, holesKeys: ['p3-p2'] }, 
        { pL: p0, pR: p3, holesKeys: ['p3-p0'] }, 
    ]


    wallsLinks.forEach((link: any, ind: number) => {
        const { pL, pR, holesKeys } = link

        const resultWall = wall00({ 
            pL, pR, 
            // holes: holes.filter((hole: THole) => holesKeys.includes(hole.wallKey)), 
            h 
        })
        _M.mergeIndexedArrays(g, resultWall)

    })




    return g
}