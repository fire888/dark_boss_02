import * as THREE from 'three'
import { Root } from '../index'

// export const MATERIALS_CONF = {
//     'unit': {
//         mat: 'MeshPhongMaterial',
//         props: {
//             color: 0xffffff,
//             emissive: 0x000000,
//             reflectivity: 5,
//             shininess: 5,
//             vertexColors: true,
//             flatShading: false,
//             side: THREE.DoubleSide,
//         },
//     },
//     'wallVirtual': {
//         mat: 'MeshStandardMaterial',
//         props: {
//             color: 0xff00ff,
//             emissive: 0x000000,
//         },
//     },
//     'wallVirtualColor': {
//         mat: 'MeshBasicMaterial',
//         props: {
//             color: 0xffffff,
//             emissive: 0x001111,
//             map: 'mapParams',
//             bumpMap: 'mapParams',
//             bumpScale: .1,
//             specular: 0x0000ff,
//             vertexColors: true,
//         },
//     },
//     'body': {
//         mat: 'MeshPhongMaterial',
//         props: {
//             color: 0xaaaaff,
//             emissive: 0x000000,
//             map: 'mapBody',
//             bumpMap: 'mapBody',
//             bumpScale: .1,
//             reflectivity: .005,
//             shininess: .005,
//             specular: 0xffffff,
//         },
//     },
//     'body_sh': {
//         mat: 'MeshPhongMaterial',
//         props: {
//             color: 0x000000,
//             emissive: 0x000000,
//             transparent: true,
//             alphaMap: 'mapBodySh',
//         },
//     },
//     'floorMat1': {
//         mat: 'MeshPhongMaterial',
//         props: {
//             color: 0xff77ff,
//             map: 'mapTop',
//             bumpMap: 'mapTop',
//             bumpScale: 3,
//             envMap: 'skyBox2',
//             reflectivity: .01,
//             shininess: .01,
//             specular: 0xffffff,
//         },
//     },
//     'floorMat': {
//         mat: 'MeshPhongMaterial',
//         props: {
//             color: 0x00ff00,
//             map: 'mapVirtual2',
//             bumpMap: 'mapVirtual2',
//             bumpScale: 3,
//         },
//     },
//     'testWhite': {
//         mat: 'MeshBasicMaterial',
//         props: {
//             color: 0xffff55,
//         },
//     },
//     'testRed': {
//         mat: 'MeshBasicMaterial',
//         props: {
//             color: 0xff0000,
//         },
//     },
//     'carNorm': {
//         mat: 'MeshStandardMaterial',
//         props: {
//             color: 0xaa00aa,
//         },
//     },
//     'carBattery': {
//         mat: 'MeshBasicMaterial',
//         props: {
//             color: 0xaa0000,
//             transparent: true,
//         },
//     },
//     'testGreen': {
//         mat: 'MeshBasicMaterial',
//         props: {
//             color: 0x00aa00,
//         },
//     },
//     'testGreen1': {
//         mat: 'MeshBasicMaterial',
//         props: {
//             color: 0x009900,
//         },
//     },
//     'testBlack': {
//         mat: 'MeshBasicMaterial',
//         props: {
//             color: 0x000000,
//             side: THREE.DoubleSide,
//         },
//     },
// }

export class Materials {
    collision: THREE.MeshBasicMaterial

    iron: THREE.MeshPhongMaterial
    floorMat1: THREE.MeshPhongMaterial
    body: THREE.MeshPhongMaterial
    bodyWhite: THREE.MeshPhongMaterial
    bodyShadow: THREE.MeshBasicMaterial
    testGreen1: THREE.MeshBasicMaterial
    carNorm: THREE.MeshStandardMaterial
    testBlack: THREE.MeshBasicMaterial
    carBattery: THREE.MeshBasicMaterial
    
    init (root: Root) {
        this.testGreen1 = new THREE.MeshBasicMaterial({
            color: 0x009900,
        })

        this.carNorm = new THREE.MeshStandardMaterial({
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
            color: 0xff77ff,
            map: root.assets.mapGround,
            bumpMap: root.assets.mapGround,
            bumpScale: 30,
            envMap: root.assets.matIronBox,
            reflectivity: .01,
            shininess: .01,
            specular: 0xffffff,
        }) 

        this.bodyShadow = new THREE.MeshBasicMaterial({
            alphaMap: root.assets.bodyShadow,
            color: 0x222230,
            transparent: true,
            opacity: 1,
        })

        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }

}