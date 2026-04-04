import * as THREE from 'three'
import { Root } from '../index'
import { Phisics } from '_CORE'

export class Lab03 {
    _root: Root
    floors: {
        p0: number[]
        p1: number[]
        p2: number[]
        p3: number[]
    }[]  = []

    constructor() {
        this._root = null as any
    }
    async init (root: Root) {
        this._root = root

        // const groundC = new THREE.Mesh(
        //     new THREE.BoxGeometry(1500, 0.1, 1500),
        //     new THREE.MeshBasicMaterial({ color: 0xff0000 })
        // )
        // groundC.position.y = 0
        // groundC.position.z = 500
        // groundC.position.x = 500
        // root.phisics.addMeshToCollision(groundC)

        const level = root.assets.level
        const scale = 0.05
        //level.scale.set(scale, scale, scale)
        //level.position.x = 30
        //level.position.z = -20
        // console.log(root.assets.level)
        //root.studio.add(root.assets.level)

        for (let i = 0; i < level.children.length; i++) {
            const child = level.children[i]
            console.log('--', child.name)
            if (
                child.name === 'level_000_000'
                ||
                child.name === 'level_001_000'
                ||
                child.name === 'level_002_000'
                ||
                child.name === 'roadwall_001_000'
            ) {
                console.log('ADD', child.name)


                const mat = child.name.includes('level') ? root.materials.wall : root.materials.wall2

                const pos = child.position
                const mesh = new THREE.Mesh(child.geometry.clone(), mat)
                mesh.geometry.translate(pos.x, pos.y, pos.z)
                mesh.position.set(0, 0, 0)
                mesh.geometry.scale(scale, scale, scale)
                root.studio.add(mesh)
                root.phisics.addMeshToCollision(mesh)
            }

        }

    }
}