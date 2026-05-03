import * as THREE from 'three'
import { Root } from '../index'

export class Materials {
    collision: THREE.MeshBasicMaterial

    floorMatNorm: THREE.MeshPhongMaterial
    floorMatGreen: THREE.MeshBasicMaterial
    body: THREE.MeshPhongMaterial
    bodyWhite: THREE.MeshPhongMaterial
    bodyShadow: THREE.MeshBasicMaterial
    carGreen: THREE.MeshBasicMaterial
    carNorm: THREE.MeshBasicMaterial
    carShadow: THREE.MeshBasicMaterial
    testBlack: THREE.MeshBasicMaterial
    carBattery: THREE.MeshBasicMaterial

    unit: THREE.MeshPhongMaterial
    unitCenter: THREE.MeshBasicMaterial
    wallsGreen: THREE.MeshBasicMaterial
    
    init (root: Root) {
        this.carGreen = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
        })

        this.carNorm = new THREE.MeshBasicMaterial({
            color: 0xaa00aa,
        })

        this.testBlack = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide,
        })

        this.carBattery = new THREE.MeshBasicMaterial({
            color: 0xaa0000,
            transparent: true,
        })

        this.body = new THREE.MeshPhongMaterial({ 
            color: 0xaaaaff,
            emissive: 0x000000,
            map: root.assets.mapBody,
            bumpMap: root.assets.mapBody,
            bumpScale: .1,
            reflectivity: .05,
            shininess: .005,
            specular: 0xffffff,
            envMap: root.assets.matIronBox,
        })

        const mapGround = root.assets.mapGround
        mapGround.wrapS = THREE.RepeatWrapping
        mapGround.wrapT = THREE.RepeatWrapping
        mapGround.repeat.set(10, 10)

        this.floorMatNorm = new THREE.MeshPhongMaterial({
            color: 0xff77ff,
            map: root.assets.mapGround,
            bumpMap: root.assets.mapGround,
            bumpScale: 30,
            //envMap: root.assets.skybox,
            reflectivity: .01,
            shininess: .01,
            specular: 0xffffff,
        }) 

        const mapGroundPoints = root.assets.groundPointsMap
        mapGroundPoints.wrapS = THREE.RepeatWrapping
        mapGroundPoints.wrapT = THREE.RepeatWrapping
        mapGroundPoints.repeat.set(5, 5)

        this.floorMatGreen = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            map: mapGroundPoints,
        })

        this.bodyShadow = new THREE.MeshBasicMaterial({
            alphaMap: root.assets.bodyShadow,
            color: 0x222230,
            transparent: true,
            opacity: .5,
        })

        this.carShadow = new THREE.MeshBasicMaterial({
            alphaMap: root.assets.carShadow,
            color: 0x222230,
            transparent: true,
            opacity: .5,
        })

        this.wallsGreen = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: root.assets.wallTexture,
            vertexColors: true,
        })

        this.unit = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0x666600,
            vertexColors: true,
            flatShading: false,
            side: THREE.DoubleSide,
        })
        this.unitCenter = new THREE.MeshBasicMaterial({
            color: 0xffff55,
        })

        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }

}
