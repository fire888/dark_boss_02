import * as THREE from 'three'
import { Root } from '../index'

export class Materials {
    collision: THREE.MeshBasicMaterial
    wall: THREE.MeshPhongMaterial
    wall2: THREE.MeshPhongMaterial
    topGround: THREE.MeshPhongMaterial
    

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

        const mapGround = root.assets.mapGround
        mapGround.wrapS = THREE.RepeatWrapping
        mapGround.wrapT = THREE.RepeatWrapping
        mapGround.repeat.set(1, 1)

        this.topGround = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setStyle('#27a213'),
            emissive: new THREE.Color().setStyle('#af6c5f'),
            map: mapGround,
            bumpMap: mapGround,
            bumpScale: 30,
            envMap: root.assets.matIronBox,
            reflectivity: 0.2,
            specular: new THREE.Color().setStyle('#222222'),
        })

        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }

}
