import * as THREE from 'three'
import { Root } from '../../index'
import { _M, IArraysGeom } from '_CORE/_M/_m'
export const SIZE_QUADRANT = 10

import { IArrayForBuffers } from 'geometry/GeomTypes'
import { createFloor01, T_Floor01 } from 'geometry/00_floor01/floor01'
import { studioConfig } from 'chapter05/entities/geometry/constants'
import { Mountains } from './Mountains/Mountains'
import { gates00 } from 'geometry/01_gates00/gates00'
import { box00 } from 'geometry/01_box00/box00'

export class Labyrinth {
    private _root!: Root
    private _mountains!: Mountains
    private _levelOuter!: THREE.Mesh  

    async init(root: Root): Promise<void> {
        this._root = root
        const { studio, phisics } = root

        this._mountains = new Mountains()
        await this._mountains.init(root)

        const g = gates00()
        this._levelOuter = _M.createMesh({ ...g, material: root.materials.levelMatNorm })
        this._levelOuter.position.set(0, -2.5, 0)
        this._levelOuter.geometry.computeVertexNormals()
        studio.add(this._levelOuter)

        ///////////////////////////////////////////////

        const b = box00({ w: 100, d: 100, h: 80 })
        _M.rotateVerticesY(b.v, Math.PI / 2)
        _M.translateVertices(b.v, 0, 0, 0)
        const box = _M.createMesh({ ...b, material: root.materials.levelMatNorm })
        box.position.set(0, -2.5, -150)
        studio.add(box)
        //phisics.addMeshToCollision(box, true)






        // const center = new THREE.Mesh(
        //     new THREE.BoxGeometry(30, 140, 30),
        //     root.materials.floorMatNorm
        // )
        // center.position.set(0, 15, -70)
        // studio.add(center)
        // phisics.addMeshToCollision(center, true)
    }

}