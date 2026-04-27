import * as THREE from 'three'
import { Root } from '../index'
import { Phisics } from '_CORE'

export class Lab03 {
    _root: Root
    currentLevelMeshes: THREE.Mesh[] = []
    _levels: THREE.Mesh[] = []

    constructor() {
        this._root = null as any
    }
    async init (root: Root) {
        this._root = root

        // const groundC = new THREE.Mesh(
        //     new THREE.BoxGeometry(1500, 0.1, 1500),
        //     new THREE.MeshBasicMaterial({ color: 0xff0000 })
        // )
        // groundC.position.y = 0
        // groundC.position.z = 500
        // groundC.position.x = 500
        // root.phisics.addMeshToCollision(groundC)

        root.assets.level.children.forEach((child: THREE.Mesh) => {
            //if (child.name.includes('level')) {
                this._levels.push(child)
            //}
        })
        const scale = 0.05
        //level.scale.set(scale, scale, scale)
        //level.position.x = 30
        //level.position.z = -20
        console.log(root.assets.level)
        //root.studio.add(root.assets.level)

        for (let i = 0; i < this._levels.length; i++) {
            const child = this._levels[i]
            //console.log('--', child.name)
            if (
                child.name === 'level_000_000'
                ||
                child.name === 'level_001_000'
                // ||
                // child.name === 'level_002_000'
                // ||
                // child.name === 'roadwall_001_000'
            ) {
                const index =  +child.name.split('_')[1]
                // console.log('ADD', child.name)

                this._addMesh(index)
            }
        }
    }

    _addMesh(index: number) {
        const { materials, studio, phisics, controls } = this._root
        const scale = 0.05

        const arrElemsSrc: THREE.Mesh[] = []
        this._levels.forEach((child: THREE.Mesh) => {
            const childInd = +child.name.split('_')[1]
            if (childInd === index) {
                arrElemsSrc.push(child)                
            }
        })

        arrElemsSrc.forEach((el: THREE.Mesh) => {
            const mat = el.name.includes('level') ? materials.wall : materials.wall2
            const mesh = new THREE.Mesh(el.geometry.clone(), mat)
            mesh.name = el.name
            console.log('ADD MESH', mesh.name)
            mesh.geometry.scale(scale, scale, scale)
            
            studio.add(mesh)
            phisics.addMeshToCollision(mesh)
            controls.addLevelElem(mesh)
            this.currentLevelMeshes.push(mesh)
        })
    }
}