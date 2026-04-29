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
        // 'wall': {
        //     mat: 'MeshPhongMaterial',
        //     props: {
        //         color: 0x338877,
        //         emissive: 0x9997777,
        //         map: 'mapFloorOuter',
        //         bumpMap: 'mapFloorOuter',
        //         bumpScale: 1,
        //         envMap: 'skyBox',
        //         reflectivity: 0.3,
        //         shininess: 60,
        //         specular: 0x222222,
        //     },
        // },


        // 'groundTop': {
        //     mat: 'MeshPhongMaterial',
        //     props: {
        //         color: 0xaa6666,
        //         emissive: 0xaa6666,
        //         map: 'mapTop',
        //         bumpMap: 'mapTop',
        //         bumpScale: 1,
        //         envMap: 'skyBox2',
        //         reflectivity: 0.5,
        //         specular: 0x222222,
        //     },
        // },

        // 'road': {
        //     mat: 'MeshPhongMaterial',
        //     props: {
        //         color: 0xffffff,
        //         emissive: 0x666666,
        //         map: 'mapFloorOuter2',
        //         bumpMap: 'mapFloorOuter2',
        //         bumpScale: 1,
        //         envMap: 'skyBox',
        //         reflectivity: 0.3,
        //     },
        // },

        // 'skin': {
        //     mat: 'MeshPhongMaterial',
        //     props: {
        //         color: 0xffffff,
        //         emissive: 0x555555,
        //         specular: 0xffffff,
        //         shininess: 12,
        //         bumpMap: 'skin',
        //         bumpScale: 0.8,
        //         envMap: 'skyBox',
        //         reflectivity: 0.5,
        //         map: 'skin',
        //         skinning: true,
        //     },        
        // }



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
            color: new THREE.Color().setStyle('#b5eeff'),
            emissive: new THREE.Color().setStyle('#a9545d'),
            map: floorOuterMap,
            bumpMap: floorOuterMap,
            bumpScale: 15,
            envMap: root.assets.matIronBox,
            reflectivity: 0.01,
            shininess: 100,
            specular: 0x555555,
        })

        const { floorOuterMap2 } = root.assets
        floorOuterMap2.wrapS = THREE.RepeatWrapping
        floorOuterMap2.wrapT = THREE.RepeatWrapping
        floorOuterMap2.repeat.set(1, 1)

        this.wall2 = new THREE.MeshPhongMaterial({
            map: floorOuterMap2,
            bumpMap: floorOuterMap2,
            bumpScale: 10,
            specular: 0xffffff,
            color: 0xffffff,
            emissive: 0x666666,
            envMap: root.assets.matIronBox,
            reflectivity: 0.3,
        })

        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }

}
