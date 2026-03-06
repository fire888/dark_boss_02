import { Root } from "../index"
import { _M } from "../geometry/_m"
import * as THREE from "three"
import { Way } from "./Way"

export class Labyrinth {
    static isCanBuild = true 

    _countBuild = -1
    _root: Root

    _way1: Way
    _way2: Way

    _mTriggerNextBuild: THREE.Mesh 

    _currentWay: Way

    constructor() {}
    async init (root: Root) {
        this._root = root

        this._way1 = new Way('way1', this._root)
        this._way2 = new Way('way2', this._root)

        this._mTriggerNextBuild = this._createCollisionCenter()

        this._buildTest()
    }

    async buildNext (key = 'normal') {
        if (Labyrinth.isCanBuild === false) { return }
        Labyrinth.isCanBuild = false
        setTimeout(() => { Labyrinth.isCanBuild = true }, 5000)

        ++this._countBuild

        const date = Date.now()
        console.log('[MESSAGE:] START BUILD LEVEL:', this._countBuild)

        const startPoint = new THREE.Vector3()
        this._currentWay && startPoint.copy(this._currentWay.endPoint).add(new THREE.Vector3(0, -1, 0))

        const nextWay = this._currentWay && this._currentWay.name === 'way1' 
            ? this._way2
            : this._way1
    
        await nextWay.build(startPoint, key)

        this._mTriggerNextBuild.name += '|_'
        this._mTriggerNextBuild.position.copy(nextWay.centerPoint)
        this._root.phisics.addMeshToCollision(this._mTriggerNextBuild)
        this._root.phisics.onCollision('collisionNextBuild', () => {
            this._root.phisics.removeMeshFromCollision(this._mTriggerNextBuild.name)          
            this.buildNext()
        })

        this._currentWay = nextWay

        console.log('[MESSAGE:] COMPLETE BUILD LEVEL:', ((Date.now() - date) / 1000).toFixed(2), 'sec')
    }

    getCurrentStartPoint () { 
        return this._currentWay.startPoint
    }

    private _createCollisionCenter() {
        const m = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 7), this._root.materials.collision)
        m.name = 'collisionNextBuild'
        return m
    } 
    
    private _buildTest() {
        // const { v, c, uv, vCollide } = createArc00(1, 1, this._root)
        // const m = _M.createMesh({ v, c, uv, material: this._root.materials.materialLab })
        // this._root.studio.add(m)
    }
}
