import { Root } from "../index";
import * as THREE from "three";

export class Body {
    init(root: Root) {
        const m = root.assets.levelObj.children.filter((item: THREE.Mesh) => item.name === 'body')[0]
        m.material = root.materials.body
        m.scale.set(.1, .1, .1)
        m.position.set(5, 0, 0)
        root.studio.add(m)

        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), root.materials.bodyShadow)
        shadow.rotation.x = -Math.PI / 2
        shadow.position.y = -.1
        shadow.position.z = -.8
        m.add(shadow)
    }
}
