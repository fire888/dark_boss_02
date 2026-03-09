import { Root } from "../index";
import { _M } from "../geometry/_m";
import { Mesh } from 'three'
import { createAntigrav } from "../geometry/antigrav/antigrav"
import * as THREE from 'three'

export class AntigravSystem {
    pointsV2: THREE.Vector2[] = []
    _m: Mesh | null
    _root: Root

    init (root: Root, points: THREE.Vector3[]) {
        this._root = root

        const v: number[] = []
        const uv: number[] = []
        const c: number[] = []
        const forceMat: number[] = []

        for (let i = 0; i < points.length; ++i) {
            const p = points[i]

            const r = createAntigrav()

            _M.translateVertices(r.v, p.x, 0, p.z)

            v.push(...r.v)
            uv.push(...r.uv)
            c.push(...r.c)
            forceMat.push(...r.forceMat)

            this.pointsV2.push(new THREE.Vector2(p.x, p.z))
        }

        const material = root.materials.walls00
        this._m = _M.createMesh({ 
            v,
            uv,
            c, 
            forceMat,
            material,
        })
        root.studio.add(this._m)
    }

    destroy () {
        if (this._m === null) return
        
        this.pointsV2 = []
        this._root.studio.remove(this._m)
        this._m.geometry.dispose()
        this._m = null
    }
}