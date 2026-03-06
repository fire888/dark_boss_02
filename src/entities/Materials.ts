import * as THREE from 'three'
import { Root } from 'index'

export class Materials {
    //walls00: THREE.MeshPhongMaterial | THREE.MeshStandardMaterial
    // road: THREE.MeshStandardMaterial
    // desert: THREE.MeshPhongMaterial | THREE.MeshStandardMaterial
    collision: THREE.MeshBasicMaterial
    materialLab: THREE.MeshStandardMaterial
    
    init (root: Root) {
        this.materialLab = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0,
            metalness: .7,
            map: root.texturesCanvas.iron00Map,
            bumpMap: root.texturesCanvas.iron00Map,
            bumpScale: .5,
            aoMap: root.texturesCanvas.iron00Map,
            aoMapIntensity: 1,
            envMap: root.texturesCanvas.env,
            envMapIntensity: 1,
            vertexColors: true,
        })
        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }
}