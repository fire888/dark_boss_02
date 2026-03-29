import * as THREE from 'three'
import { Root  } from '../index'

export const createCarCompas = (root: Root) => {
    const {
        assets,
        studio,
    } = root

    //const arrow = root.system_Assets.items.arrow
    const arrow = root.assets['levelObj'].children.filter((item: THREE.Mesh) => item.name === 'arrow')[0]
    arrow.scale.set(.06, .06, .06)
    arrow.material = root.materials.carNorm

    const target = new THREE.Object3D()
    target.position.set(-500, -30, -500)
    studio.add(target)

    const src = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    src.position.set(0, 0, 0)
    studio.add(target)

    const v = new THREE.Vector3()

    return {
        addToParent: (parent: THREE.Object3D) => { 
            parent.add(arrow)
        },
        setArrowPosition: (x: number, y: number, z: number) => {
            arrow.position.set(x, y, z)
        },
        setTargetPosition: (pos: THREE.Vector3) => {
            target.position.copy(pos)
        },
        update: () => {
            src.position.copy(arrow.parent.position)
            src.lookAt(target.position)
            if (arrow.parent.position.z < target.position.z) {
                arrow.rotation.y = -arrow.parent.rotation.y + src.rotation.y
            }
            else {
                arrow.rotation.y = -arrow.parent.rotation.y - src.rotation.y + Math.PI
            }
        },
        changeColor: (key: string) => {
            if (key === 'normal') {
                arrow.material = root.materials.carNorm
            }
            if (key === 'green') {
                arrow.material = root.materials.carGreen
            }
        },
    }
}