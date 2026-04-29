import * as THREE from 'three'
import { Root } from '../index'

export class Lab03 {
    _root: Root
    currentLevelMeshes: THREE.Mesh[] = []
    _levels: THREE.Mesh[] = []
    _indiciesInScene: number[] = []

    constructor() {
        this._root = null as any
    }
    async init (root: Root) {
        this._root = root

        root.assets.level.children.forEach((child: THREE.Mesh) => {
            this._levels.push(child)
        })

        for (let i = 0; i < this._levels.length; i++) {
            const child = this._levels[i]
            const index =  +child.name.split('_')[1]
            this._addMeshByInd(index)
        }
    }

    _addMeshByInd(index: number) {
        if (this._indiciesInScene.includes(index)) {
            return
        }
        this._indiciesInScene.push(index)


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
            let mat = el.name.includes('level') ? materials.wall : materials.wall2
            if (el.name === 'level_020_001') {
                mat = materials.topGround
            }
            const mesh = new THREE.Mesh(el.geometry.clone(), mat)
            mesh.name = el.name
            mesh.geometry.scale(scale, scale, scale)
            mesh.frustumCulled = false
            
            studio.add(mesh)
            phisics.addMeshToCollision(mesh)
            if (mesh.name.includes('roadwall')) {
                controls.addLevelElem(mesh)
            }
            this.currentLevelMeshes.push(mesh)
        })
    }
}