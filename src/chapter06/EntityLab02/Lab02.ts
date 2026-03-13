import * as THREE from 'three'
import { Root } from '../index'
//import { _M } from '../geometry/_m'
import { createTown2 } from './town2'

export class Labyrinth {
    _root: Root
    floors: {
        p0: number[]
        p1: number[]
        p2: number[]
        p3: number[]
    }[]  = []

    constructor() {}
    async init (root: Root) {
        this._root = root

        const groundC = new THREE.Mesh(
            new THREE.BoxGeometry(500, 0.1, 500),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        )
        groundC.position.y = 0
        root.phisics.addMeshToCollision(groundC)

        const { floors } = createTown2(root)
        this.floors = floors
    }

    checkArea(indPrev: number, x: number, z: number) {
        if (this.floors[indPrev]) {
            const p0 = this.floors[indPrev].p0
            const p1 = this.floors[indPrev].p1
            const p2 = this.floors[indPrev].p2
            const p3 = this.floors[indPrev].p3
            if (x >= p0[0] && x <= p1[0] && z <= p0[1] && z >= p3[1]) {
                return indPrev
            }
        }

        for (let i = 0; i < this.floors.length; ++i) {
            const p0 = this.floors[i].p0
            const p1 = this.floors[i].p1
            const p2 = this.floors[i].p2
            const p3 = this.floors[i].p3
            if (x >= p0[0] && x <= p1[0] && z <= p0[1] && z >= p3[1]) {
                return i
            }
        }
        return -1
    }
}