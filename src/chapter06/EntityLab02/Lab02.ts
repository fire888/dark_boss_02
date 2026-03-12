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
}