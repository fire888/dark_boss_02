import { Root } from "../index";
import * as THREE from "three";

export class Body {
    m: THREE.Mesh
    _root: Root
    init(root: Root) {
        this._root = root

        this.m = root.assets.levelObj.children.filter((item: THREE.Mesh) => item.name === 'body')[0]
        this.m.material = root.materials.body
        this.m.scale.set(.03, .03, .03)
        this.m.position.set(3, 0.1, 2)
        this.m.rotation.y = Math.PI / 2
        root.studio.add(this.m)

        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), root.materials.bodyShadow)
        shadow.rotation.x = -Math.PI / 2
        shadow.position.x = -1
        shadow.position.y = -.1
        shadow.position.z = 2
        this.m.add(shadow)
    }

    hide() {
        this._root.studio.remove(this.m)
    }
}
