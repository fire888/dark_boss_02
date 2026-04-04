import * as THREE from 'three'
import { Root } from '../index'

export class Materials {
    //walls00: THREE.MeshPhongMaterial | THREE.MeshStandardMaterial
    //road: THREE.MeshStandardMaterial
    //desert: THREE.MeshPhongMaterial | THREE.MeshStandardMaterial
    collision: THREE.MeshBasicMaterial

    iron: THREE.MeshPhongMaterial
    floorMat1: THREE.MeshPhongMaterial
    body: THREE.MeshPhongMaterial
    bodyWhite: THREE.MeshPhongMaterial
    bodyShadow: THREE.MeshBasicMaterial
    wall: THREE.MeshPhongMaterial
    wall2: THREE.MeshPhongMaterial
    
    init (root: Root) {
        this.iron = new THREE.MeshPhongMaterial({
            //color: 0xcccccc,
            color: 0xdddddd,
            lightMap: root.assets.ironAO,
            lightMapIntensity: .35,
            normalMap: root.assets.ironNormal,
            normalScale: new THREE.Vector2(.2, .2),
            envMap: root.assets.matIronBox,
            reflectivity: .04,
            //reflectivity: .1,
            shininess: 100,
            specular: 0x020201,
            vertexColors: true,
        })

        const mapGround = root.assets.mapGround
        mapGround.wrapS = THREE.RepeatWrapping
        mapGround.wrapT = THREE.RepeatWrapping
        mapGround.repeat.set(30, 30)

        this.floorMat1 = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: root.assets.mapGround,
            bumpMap: root.assets.mapGround,
            //bumpScale: 2,
            bumpScale: 8,
            reflectivity: 0.04,
            shininess: .01,
            specular: 0xffffff,
            emissive: 0x555555,
        }) 

        this.body = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            envMap: root.assets.matIronBox,
            reflectivity: 3,
            specular: 0xffffff,
        })

        this.bodyWhite = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            envMap: root.assets.matIronBox,
            emissive: 0x222222,
            reflectivity: .5,
            specular: 0xffffff,   
        })

        this.bodyShadow = new THREE.MeshBasicMaterial({
            color: 0x222230,
            transparent: true,
            alphaMap: root.assets.shadowStatue,
            opacity: 1,
        })

        const { floorOuterMap } = root.assets
        floorOuterMap.wrapS = THREE.RepeatWrapping
        floorOuterMap.wrapT = THREE.RepeatWrapping
        floorOuterMap.repeat.set(1, 1)

        this.wall = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: floorOuterMap,
            bumpMap: floorOuterMap,
            bumpScale: 10,
            //envMap: root.assets.matIronBox,
            reflectivity: 3,
            specular: 0xffffff,
        })

        const { floorOuterMap2 } = root.assets
        floorOuterMap2.wrapS = THREE.RepeatWrapping
        floorOuterMap2.wrapT = THREE.RepeatWrapping
        floorOuterMap2.repeat.set(1, 1)

        this.wall2 = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: floorOuterMap2,
            bumpMap: floorOuterMap2,
            bumpScale: 10,
            //envMap: root.assets.matIronBox,
            reflectivity: 3,
            specular: 0xffffff,
        })

        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }

}
