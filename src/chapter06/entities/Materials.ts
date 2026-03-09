import * as THREE from 'three'
import { Root } from '../index'

export class Materials {
    walls00: THREE.MeshPhongMaterial | THREE.MeshStandardMaterial
    road: THREE.MeshStandardMaterial
    desert: THREE.MeshPhongMaterial | THREE.MeshStandardMaterial
    collision: THREE.MeshBasicMaterial
    
    init (root: Root) {
        this.walls00 =  new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            map: root.assets.mapWall_01,
            bumpMap: root.assets.mapWall_01,
            bumpScale: 3,
            vertexColors: true,
        })
        
        this.walls00.onBeforeCompile = (shader) => {
            shader.vertexShader =
                `attribute float forcemat;
                varying float vForceMat;
                ` + shader.vertexShader

            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vForceMat = forcemat;
                `
            )

            shader.fragmentShader =
                `varying float vForceMat;
                ` + shader.fragmentShader;

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <tonemapping_fragment>',
                `
                gl_FragColor.rgb *= (vForceMat - .5);
                #include <tonemapping_fragment>
                `
            )
        }

        {
            const map = root.assets.roadImg
            map.wrapS = THREE.RepeatWrapping
            map.wrapT = THREE.RepeatWrapping
            map.repeat.set(40, 40)
        }

        this.road = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            map: root.assets.roadImg,
            bumpMap: root.assets.roadImg,
            bumpScale: 17,
            vertexColors: true,
        })

        {
            const map = root.assets.noise00
            map.wrapS = THREE.RepeatWrapping
            map.wrapT = THREE.RepeatWrapping
            map.repeat.set(50, 50)
        }

        this.desert = new THREE.MeshStandardMaterial({
            color: 0x323341,
            map: root.assets.noise00,
            bumpMap: root.assets.noise00,
            bumpScale: 4,
        })

        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }

    changeWallMaterial(data: { color: number[], emissive: number[], specular: number[] }) {
        this.walls00.color.fromArray(data.color)
        this.walls00.emissive.fromArray(data.emissive)
        this.walls00.needsUpdate = true
    }

    changeRoadMaterial(data: { color: number[], emissive: number[] }) {
        this.road.color.fromArray(data.color)
        this.road.emissive.fromArray(data.emissive)
        this.road.needsUpdate = true
    }

    changeDesertMaterial(data: { color: number[], emissive: number[], specular: number[] }) {
        this.desert.color.fromArray(data.color)
        this.desert.emissive.fromArray(data.emissive)
        this.desert.needsUpdate = true
    }
}