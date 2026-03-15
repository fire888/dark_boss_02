import * as THREE from 'three'
import { Root } from '../index'

    // 'iron': {
    //     mat: 'MeshPhongMaterial',
    //     props: {
    //         color: 0xcccccc,
    //         lightMap: 'ironAO',
    //         lightMapIntensity: .35,
    //         normalMap: 'ironNormal',
    //         normalScale: new THREE.Vector2(.2, .2),
    //         envMap: 'skyBox3',
    //         reflectivity: .02,
    //         shininess: 100,
    //         specular: 0x020201,
    //         vertexColors: true,
    //     },
    // },
    // 'iron2': {
    //     mat: 'MeshPhongMaterial',
    //     props: {
    //         color: 0xff0000,
    //         lightMap: 'ironAO',
    //         lightMapIntensity: .35,
    //         normalMap: 'ironNormal',
    //         normalScale: new THREE.Vector2(.1, .1),
    //         envMap: 'skyBox3',
    //         reflectivity: .02,
    //         shininess: 100,
    //         specular: 0x020201,
    //         vertexColors: true,
    //     },
    // },
    // 'floorMat1': {
    //     mat: 'MeshPhongMaterial',
    //     props: {
    //         color: 0xffffff,
    //         map: 'mapTop',
    //         bumpMap: 'mapTop',
    //         bumpScale: 2,
    //         reflectivity: 0.1,
    //         shininess: .01,
    //         specular: 0xffffff,
    //         emissive: 0x555555,
    //     },
    // },
    // 'body': {
    //     mat: 'MeshPhongMaterial',
    //     props: {
    //         color: 0xffffff,
    //         envMap: 'skyBox3',
    //         reflectivity: 3,
    //         specular: 0xffffff,
    //     },
    // },
    // 'bodyRed': {
    //     mat: 'MeshPhongMaterial',
    //     props: {
    //         color: 0xaa0000,
    //         envMap: 'skyBox3',
    //         emissive: 0x770000,
    //         reflectivity: .01,
    //         specular: 0xff0000,
    //     },
    // },
    // 'bodyWhite': {
    //     mat: 'MeshPhongMaterial',
    //     props: {
    //         color: 0xFFFFFF,
    //         envMap: 'skyBox3',
    //         emissive: 0x222222,
    //         reflectivity: .5,
    //         specular: 0xffffff,
    //     },
    // },
    // 'bodyShadow': {
    //     mat: 'MeshBasicMaterial',
    //     props: {
    //         color: 0x222230,
    //         transparent: true,
    //         alphaMap: 'bodyDropShadow',
    //         opacity: 1,
    //     },
    // },
    // 'whiteBasic': {
    //     mat: 'MeshBasicMaterial',
    //     props: {
    //         color: 0xffffff,
    //         //vertexColors: true,
    //     }
    // },
    // 'whiteBasic2': {
    //     mat: 'MeshBasicMaterial',
    //     props: {
    //         color: 0xaaaaaa,
    //     }
    // },


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

        // this.walls00 =  new THREE.MeshStandardMaterial({ 
        //     color: 0xffffff,
        //     map: root.assets.mapWall_01,
        //     bumpMap: root.assets.mapWall_01,
        //     bumpScale: 3,
        //     vertexColors: true,
        // })
        
        // this.walls00.onBeforeCompile = (shader) => {
        //     shader.vertexShader =
        //         `attribute float forcemat;
        //         varying float vForceMat;
        //         ` + shader.vertexShader

        //     shader.vertexShader = shader.vertexShader.replace(
        //         '#include <begin_vertex>',
        //         `
        //         #include <begin_vertex>
        //         vForceMat = forcemat;
        //         `
        //     )

        //     shader.fragmentShader =
        //         `varying float vForceMat;
        //         ` + shader.fragmentShader;

        //     shader.fragmentShader = shader.fragmentShader.replace(
        //         '#include <tonemapping_fragment>',
        //         `
        //         gl_FragColor.rgb *= (vForceMat - .5);
        //         #include <tonemapping_fragment>
        //         `
        //     )
        // }

        // {
        //     const map = root.assets.roadImg
        //     map.wrapS = THREE.RepeatWrapping
        //     map.wrapT = THREE.RepeatWrapping
        //     map.repeat.set(40, 40)
        // }

        // this.road = new THREE.MeshStandardMaterial({ 
        //     color: 0xffffff,
        //     map: root.assets.roadImg,
        //     bumpMap: root.assets.roadImg,
        //     bumpScale: 17,
        //     vertexColors: true,
        // })

        // {
        //     const map = root.assets.noise00
        //     map.wrapS = THREE.RepeatWrapping
        //     map.wrapT = THREE.RepeatWrapping
        //     map.repeat.set(50, 50)
        // }

        // this.desert = new THREE.MeshStandardMaterial({
        //     color: 0x323341,
        //     map: root.assets.noise00,
        //     bumpMap: root.assets.noise00,
        //     bumpScale: 4,
        // })

        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }

    // changeWallMaterial(data: { color: number[], emissive: number[], specular: number[] }) {
    //     this.walls00.color.fromArray(data.color)
    //     this.walls00.emissive.fromArray(data.emissive)
    //     this.walls00.needsUpdate = true
    // }

    // changeRoadMaterial(data: { color: number[], emissive: number[] }) {
    //     this.road.color.fromArray(data.color)
    //     this.road.emissive.fromArray(data.emissive)
    //     this.road.needsUpdate = true
    // }

    // changeDesertMaterial(data: { color: number[], emissive: number[], specular: number[] }) {
    //     this.desert.color.fromArray(data.color)
    //     this.desert.emissive.fromArray(data.emissive)
    //     this.desert.needsUpdate = true
    // }
}