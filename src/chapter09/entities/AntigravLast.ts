import { Root } from "../index";
import { _M } from "../geometry/_m";
import { Mesh } from 'three'
import { buildAntigravLast } from "../geometry/antigravLast/antigravLast"
import * as THREE from 'three'
import { tileMapWall } from "../geometry/tileMapWall";

export class AntigravLast {
    nameSpace = 'antigravLastCollision'
    nameSpaceTrigger = 'antigravLastCollisionTrigger'
    _m: Mesh | null
    _collisionMesh: Mesh | null
    _root: Root

    init (root: Root, point: THREE.Vector3) {
        this._root = root

        console.log('[MESSAGE:] START CREATE LAST_PORTAL')
        const d = Date.now()
        {
            const lastPortal = buildAntigravLast()
            this._m = _M.createMesh({
                ...lastPortal,
                material: this._root.materials.walls00
            })
            this._m.position.copy(point)
            this._root.studio.add(this._m)

            this._collisionMesh = _M.createMesh({
                v: lastPortal.vCollide,
                material: this._root.materials.collision
            })
            this._collisionMesh.name = this.nameSpace
            this._collisionMesh.position.copy(point)
            this._root.phisics.addMeshToCollision(this._collisionMesh)
        }
        console.log('[TIME:] COMPLETE CALCULATE HOUSES', ((Date.now() - d) / 1000).toFixed(2))
    }

    activate () {
        const ui = this._m.geometry.attributes.uv.array
        // draw black portal 
        for (let i = 0; i < ui.length; i += 6) {
            if (
                ui[i] ===  tileMapWall.stoneTree[0] && 
                ui[i + 1] ===  tileMapWall.stoneTree[1]
            ) {
                ui[i] = 0
                ui[i + 1] = 0
                ui[i + 2] = 0
                ui[i + 3] = 0
                ui[i + 4] = 0
                ui[i + 5] = 0

                const j = i / 2
                const forceMat = this._m.geometry.attributes.forcemat.array
                forceMat[j] = -500
                forceMat[j + 1] = -500
                forceMat[j + 2] = -500
            }
        }
        this._m.geometry.attributes.uv.needsUpdate = true
        this._m.geometry.attributes.forcemat.needsUpdate = true
        console.log('[MESSAGE:] ACTIVATE LAST_PORTAL')

        const v = _M.createBevel4P(
            [1, 0, -50],
            [-1, 0, -50],
            [-1, 0, 100],
            [1, 0, 100],
            2.5,
            true
        )

        const m2 = _M.createMesh({
            v,
            material: this._root.materials.collision
        })
        m2.name = this.nameSpaceTrigger
        m2.position.copy(this._m.position)
        m2.position.y += 4
        //this._root.studio.add(m2)
        this._root.phisics.addMeshToCollision(m2)
    }

    destroy () {
        if (this._m === null) return
        
        this._root.studio.remove(this._m)
        this._m.geometry.dispose()
        this._m = null

        if (this._collisionMesh !== null) {
            this._collisionMesh.geometry.dispose()
            this._collisionMesh = null
            this._root.phisics.removeMeshFromCollision(this.nameSpace)
        }

        this._root.phisics.removeMeshFromCollision(this.nameSpaceTrigger)

        // TODO: destroy mesh trigger
    }

    removeStonesFromPhisics() {
        if (!this._collisionMesh) {
            return
        }
        this._collisionMesh.geometry.dispose()
        this._collisionMesh = null
        this._root.phisics.removeMeshFromCollision(this.nameSpace)
    }

    getPosition () { 
        return this._m ? this._m.position : null 
    }
}