import { Root } from "../index"
import * as THREE from "three"

export class ChangerCurrentLevelPart {
    _root: Root
    _raycaster = new THREE.Raycaster()
    currentLevel: number

    constructor() {
        this._root = null as any
        this.currentLevel = 0
    }

    init(root: Root) {
        this._root = root
        
        const { ticker, lab, studio, controls } = this._root
        
        const DIR = new THREE.Vector3(0, -1, 0)
   
        ticker.on((t: number) => {
            this._raycaster.set(controls.obj.position, DIR)     
            const intercepts = this._raycaster.intersectObjects(lab.currentLevelMeshes)
            if (intercepts.length > 0) {
                const ind = +intercepts[0].object.name.split('_')[1]
                if (ind !== this.currentLevel) {
                    this.currentLevel = ind
                    // lab._addMesh(ind + 1)
                    // lab._addMesh(ind + 2)
                }       
            }
        })
    }

}