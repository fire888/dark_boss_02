import * as THREE from 'three'
import { Root } from '../../index'
import { _M } from '_CORE/_M/_m'
export const SIZE_QUADRANT = 10

import { IArrayForBuffers } from 'geometry/GeomTypes'
import { createFloor01, T_Floor01 } from 'geometry/00_floor01/floor01'
import { studioConfig } from 'chapter05/entities/geometry/constants'
import { Mountains } from './Mountains/Mountains'

export class Labyrinth {
    private _root!: Root
    private _mountains!: Mountains

    async init(root: Root): Promise<void> {
        this._root = root

        this._mountains = new Mountains()
        await this._mountains.init(root)

        const { studio, phisics } = root

        const center = new THREE.Mesh(
            new THREE.BoxGeometry(30, 140, 30),
            root.materials.floorMatNorm
        )
        center.position.set(0, 15, -70)
        studio.add(center)
        phisics.addMeshToCollision(center, true)
    }

}