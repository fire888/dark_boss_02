import * as THREE from 'three'
import { Root } from '../index'
import { FINAL_ENV_COLOR } from '../Structure03/constants/const_structures'

export class Materials {
    structureMaterial: THREE.MeshBasicMaterial
    structureMaterialInv: THREE.MeshBasicMaterial
    matNotFog: THREE.MeshBasicMaterial
    matFog: THREE.MeshBasicMaterial
    basicMat: THREE.MeshBasicMaterial
    matNotFogOuter: THREE.MeshBasicMaterial
    collision: THREE.MeshBasicMaterial
    materialLab: THREE.MeshStandardMaterial
    
    init (root: Root) {
        root.assets.textureTiles.magFilter = THREE.NearestFilter
        root.assets.textureTiles.minFilter = THREE.NearestFilter
        this.structureMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: root.assets.textureTiles,
            vertexColors: true,
        })
        root.assets.textureTilesInv.magFilter = THREE.NearestFilter
        root.assets.textureTilesInv.minFilter = THREE.NearestFilter
        this.structureMaterialInv = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: root.assets.textureTilesInv,
            vertexColors: true,
        })
        this.matNotFog = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: root.assets.textureTilesInv,
            vertexColors: true,
        })
        this.matNotFogOuter = new THREE.MeshBasicMaterial({
            color: FINAL_ENV_COLOR,
            fog: false,
        })

        this.basicMat = new THREE.MeshBasicMaterial({ color: 0xffff00 })

        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }
}