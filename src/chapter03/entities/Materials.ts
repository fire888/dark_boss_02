import * as THREE from 'three'
import { Root } from '../index'

export class Materials {
    collision: THREE.MeshBasicMaterial

    floorMatNorm: THREE.MeshPhongMaterial
    floorMatGreen: THREE.MeshBasicMaterial

    wallsGreen: THREE.MeshBasicMaterial
    
    init (root: Root) {
        const mapGround = root.assets.mapGround
        mapGround.wrapS = THREE.RepeatWrapping
        mapGround.wrapT = THREE.RepeatWrapping
        mapGround.repeat.set(5, 5)

        this.floorMatNorm = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setStyle('#efb0ff'),
            emissive: new THREE.Color().setStyle('#317287'),
            map: root.assets.mapGround,
            bumpMap: root.assets.mapGround,
            bumpScale: 30,
            envMap: root.assets.matIronBox,
            reflectivity: .5,
            shininess: .01,
            specular: new THREE.Color().setStyle('#ffffff'),
        }) 

        const mapGroundPoints = root.assets.groundPointsMap
        mapGroundPoints.wrapS = THREE.RepeatWrapping
        mapGroundPoints.wrapT = THREE.RepeatWrapping
        mapGroundPoints.repeat.set(5, 5)

        this.floorMatGreen = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            map: mapGroundPoints,
        })


        this.wallsGreen = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: root.assets.wallTexture,
            vertexColors: true,
        })

        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }

}
