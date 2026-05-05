import * as THREE from 'three'
import { Root } from '../../index'
import { _M, IArraysGeom } from '_CORE/_M/_m'
export const SIZE_QUADRANT = 10

import { IArrayForBuffers } from 'geometry/GeomTypes'
import { createFloor01, T_Floor01 } from 'geometry/00_floor01/floor01'
import { studioConfig } from 'chapter05/entities/geometry/constants'
import { Mountains } from './Mountains/Mountains'
import { box00 } from 'geometry/01_box00/box00'

export class Labyrinth {
    private _root!: Root
    private _mountains!: Mountains

    async init(root: Root): Promise<void> {
        this._root = root

        this._mountains = new Mountains()
        await this._mountains.init(root)

        const { studio, phisics } = root


        //////////////////////////////////////////

        const g: IArraysGeom = { v: [], c: [], index: [] }

        const stepZ = 10
        const offstX = 5


        for (let i = 0; i < 50; ++i) {
            const b1 = box00({ w: 1.5, d: 1, h: 60 })
            _M.translateVertices(b1.v, offstX, 0, -i * stepZ)
            
            _M.mergeIndexedArrays(g, b1)

            const b2 = box00({ w: 1.5, d: 1, h: 60 })
            _M.rotateVerticesY(b2.v, Math.PI)
            _M.translateVertices(b2.v, -offstX, 0, -i * stepZ)
            
            _M.mergeIndexedArrays(g, b2)
        }

        console.log('g', g)

        const gates = _M.createMesh({ ...g, material: root.materials.levelMatNorm })
        gates.position.set(0, -2.5, 0)
        gates.geometry.computeVertexNormals()
        root.studio.add(gates)

        ///////////////////////////////////////////////






        // const center = new THREE.Mesh(
        //     new THREE.BoxGeometry(30, 140, 30),
        //     root.materials.floorMatNorm
        // )
        // center.position.set(0, 15, -70)
        // studio.add(center)
        // phisics.addMeshToCollision(center, true)
    }

}