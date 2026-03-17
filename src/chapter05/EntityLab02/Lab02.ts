import * as THREE from 'three'
import { Root } from '../index'
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
        // this._root = root

        const groundC = new THREE.Mesh(
            new THREE.BoxGeometry(1500, 0.1, 1500),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        )
        groundC.position.y = 0
        groundC.position.z = 500
        groundC.position.x = 500
        root.phisics.addMeshToCollision(groundC)

        // const { floors } = createTown2(root)
        // this.floors = floors
    }

    checkArea(indPrev: number, x: number, z: number) {
        // if (this.floors[indPrev]) {
        //     const p0 = this.floors[indPrev].p0
        //     const p1 = this.floors[indPrev].p1
        //     const p2 = this.floors[indPrev].p2
        //     const p3 = this.floors[indPrev].p3
        //     if (x >= p0[0] && x <= p1[0] && z <= p0[1] && z >= p3[1]) {
        //         return indPrev
        //     }
        // }

        // for (let i = 0; i < this.floors.length; ++i) {
        //     const p0 = this.floors[i].p0
        //     const p1 = this.floors[i].p1
        //     const p2 = this.floors[i].p2
        //     const p3 = this.floors[i].p3
        //     if (x >= p0[0] && x <= p1[0] && z <= p0[1] && z >= p3[1]) {
        //         return i
        //     }
        // }
        return -1
    }

    getRandomPosInRoom(indRoom: number) {
    //     const p0 = this.floors[indRoom].p0
    //     const p1 = this.floors[indRoom].p1
    //     const p2 = this.floors[indRoom].p2
    //     const p3 = this.floors[indRoom].p3

    //     return { x: Math.random() * (p1[0] - p0[0] - 2) + p0[0] + 1, z: Math.random() * (p0[1] - p3[1] - 2) + p3[1] + 1 }
    }
}