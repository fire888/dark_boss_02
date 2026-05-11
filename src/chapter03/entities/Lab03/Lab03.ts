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
import { hole00 } from 'geometry/02_hole00/hole00'
import { platform00 } from 'geometry/03_platform00/platform00'
import { tunnel00 } from 'geometry/04_tunnel00/tunnel00'
import { room00 } from 'geometry/05_room00/room_00'

const ZERO_Y = -2.5 

export class Labyrinth {
    private _root!: Root
    private _mountains!: Mountains
    private _levelOuter!: THREE.Mesh  

    async init(root: Root): Promise<void> {
        this._root = root
        const { studio, phisics } = root

        this._mountains = new Mountains()
        await this._mountains.init(root)

        ////////////////////////////////////////////////

        const W = 100, H = 100, D = -150
        
        const g: IArraysGeom = { v: [], c: [], index: [] } 
        
        const gates = gates00()
        _M.mergeIndexedArrays(g, gates)

        const front = hole00({ w: W, h: H, holeW: 2, holeH: 4, holeOffstX: 0, holeOffstY: 4.5 })
        _M.translateVertices(front.v, 0, 0, D)
        _M.mergeIndexedArrays(g, front)

        const bridge = box00({ w: 1, d: 4, h: 80 })
        _M.rotateVerticesY(bridge.v, -Math.PI / 2)
        _M.rotateVerticesX(bridge.v, Math.PI / 2)
        _M.translateVertices(bridge.v, 0, 4, D)
        _M.mergeIndexedArrays(g, bridge)

        const toBr = platform00({w0: 4, y0: 0, w1: 4, y1: 4.5, d: 4, h: 1})
        _M.translateVertices(toBr.v, 0, 0, D + 84)
        _M.mergeIndexedArrays(g, toBr)

        const t = tunnel00({
            w0: 2, h0: 4, 
            w1: 2, h1: 4, 
            d: 30 
        })
        _M.translateVertices(t.v, 0, 4.5, D)
        _M.mergeIndexedArrays(g, t)

        const r = room00()
        _M.translateVertices(r.v, 0, 4, D - 30 - 15)
        //_M.translateVertices(r.v, 0, 4, 0)
        _M.mergeIndexedArrays(g, r)

        this._levelOuter = _M.createMesh({ ...g, material: root.materials.levelMatNorm })
        this._levelOuter.position.set(0, ZERO_Y, 0)
        this._levelOuter.geometry.computeVertexNormals()
        studio.add(this._levelOuter)

        const collG1 = this._levelOuter.geometry.clone().toNonIndexed()
        const coll1 = new THREE.Mesh(collG1, root.materials.collision)
        coll1.position.set(0, ZERO_Y, 0)
        phisics.addMeshToCollision(coll1, true)



    }

}