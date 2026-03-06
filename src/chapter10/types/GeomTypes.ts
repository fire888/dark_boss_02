import * as THREE from 'three'

export type IArrayForBuffers = {
    v: number[]
    uv: number[]
    c: number[]
    vCollide?: number[]
    forceMat?: number[]
    w?: number 
    h?: number
    d?: number 
}

export type IPerimeter = [number, number][]

export type I_TypeSeg = 'FLOOR' | 'STAIR' | 'STAIR_ADAPTER'

export type T_ROOM = {
    axisP0?: THREE.Vector3,
    axisP1?: THREE.Vector3,
    dir0?: THREE.Vector3,
    dir1?: THREE.Vector3,
    dir: THREE.Vector3,
    
    p0: THREE.Vector3,
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    p3: THREE.Vector3,

    id: number,
    w: number,
    d: number,

    type: I_TypeSeg
} 
