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
        // this.materialLab = new THREE.MeshStandardMaterial({
        //     color: 0xffffff,
        //     roughness: 0,
        //     metalness: .7,
        //     //map: root.texturesCanvas.iron00Map,
        //     bumpMap: root.texturesCanvas.iron00Map,
        //     bumpScale: .5,
        //     aoMap: root.texturesCanvas.iron00Map,
        //     aoMapIntensity: 1,
        //     envMap: root.texturesCanvas.env,
        //     envMapIntensity: 1,
        //     vertexColors: true,
        // })


        root.loader.assets.textureTiles.magFilter = THREE.NearestFilter
        root.loader.assets.textureTiles.minFilter = THREE.NearestFilter
        this.structureMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: root.loader.assets.textureTiles,
            vertexColors: true,
        })
        root.loader.assets.textureTilesInv.magFilter = THREE.NearestFilter
        root.loader.assets.textureTilesInv.minFilter = THREE.NearestFilter
        this.structureMaterialInv = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: root.loader.assets.textureTilesInv,
            vertexColors: true,
        })
        this.matNotFog = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: root.loader.assets.textureTilesInv,
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