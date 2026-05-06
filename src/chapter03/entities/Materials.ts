import * as THREE from 'three'
import { Root } from '../index'

export class Materials {
    collision!: THREE.MeshBasicMaterial
    floorMatNorm!: THREE.MeshPhongMaterial
    levelMatNorm!: THREE.MeshPhongMaterial

    init (root: Root) {
        const mapGround = root.assets.mapGround
        mapGround.wrapS = THREE.RepeatWrapping
        mapGround.wrapT = THREE.RepeatWrapping
        mapGround.repeat.set(1, 1)

        this.floorMatNorm = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setStyle('#e682ff'),
            emissive: new THREE.Color().setStyle('#317287'),
            map: root.assets.mapGround,
            bumpMap: root.assets.mapGround,
            bumpScale: 30,
            envMap: root.assets.matIronBox,
            reflectivity: .05,
            shininess: .1,
            specular: new THREE.Color().setStyle('#ffffff'),
            vertexColors: true,
        })

        this.levelMatNorm = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setStyle('#ffffff'),
            vertexColors: true,
        })

        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }

}