import { Root } from "../index"
import { _M } from "../../_CORE/_M/_m"
import * as THREE from "three"
import { createTowerSilhouette } from "../geometry/towerSilhouette/towerSilhouette"

export class BackTower {
    _root: Root
    _m: THREE.Mesh

    constructor() {}
    async init (root: Root) {
        this._root = root

        const { v, c, uv } = createTowerSilhouette()

        this._m = _M.createMesh({ v, c, uv, material: root.materials.materialLab })
        this._m.rotation.y = -Math.PI / 2
        this._root.studio.add(this._m)
    }

    setPositionX (x: number) {
        if (this._m) {
            this._m.position.x = x
        }
    }

}
