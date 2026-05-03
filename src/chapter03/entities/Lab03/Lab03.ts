import * as THREE from 'three'
import { Root } from '../../index'
import { _M } from '_CORE/_M/_m'
export const SIZE_QUADRANT = 10

import { IArrayForBuffers } from 'geometry/GeomTypes'
import { createFloor01, T_Floor } from 'geometry/00_floor01/floor01'
import { studioConfig } from 'chapter05/entities/geometry/constants'

export class Labyrinth {
    private _root!: Root

    async init(root: Root): Promise<void> {
        this._root = root

        const { studio, phisics } = root

        // console.log('level obj', root.assets.levelObj)
        // root.assets.levelObj.children.forEach((child: any) => {
        //     if (child.name === 'outer_floor') {
        //         child.scale.set(.1, .1, .1)
        //         root.studio.add(child)
        //     }
        // })
        // const floor = new THREE.Mesh(
        //     new THREE.PlaneGeometry(SIZE_QUADRANT * 2, SIZE_QUADRANT * 2, 1, 1),
        //     root.materials.floorMatNorm
        // )
        // floor.name = "floor"
        // floor.rotation.x = -Math.PI / 2
        // floor.position.y = -15
        
        // root.studio.add(floor)
        // root.phisics.addMeshToCollision(floor, true)
        studio.addAxisHelper()

        const floor = createFloor01({ w: 500, wStep: 15, maxH: 5 })
        const m = _M.createMesh({
            v: floor.v,
            uv: floor.uv,
            c: floor.c,
            material: root.materials.floorMatNorm,
        })
        m.position.y = -2.5
        root.studio.add(m)
        root.phisics.addMeshToCollision(m, true)



    }

}