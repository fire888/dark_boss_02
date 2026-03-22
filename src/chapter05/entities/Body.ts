import { Root } from "../index";
import * as THREE from "three";

export class Body {
    init(root: Root) {
        const m = root.assets.levelObj.children.filter((item: THREE.Mesh) => item.name === 'body')[0]
        m.material = root.materials.body
        m.scale.set(.03, .03, .03)
        m.position.set(3, 0.1, 2)
        m.rotation.y = Math.PI / 2
        root.studio.add(m)

        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), root.materials.bodyShadow)
        shadow.rotation.x = -Math.PI / 2
        shadow.position.x = -1
        shadow.position.y = -.1
        shadow.position.z = 2
        m.add(shadow)
    }
}
