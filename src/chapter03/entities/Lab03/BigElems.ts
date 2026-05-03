import { Root } from '../../index'
import * as THREE from 'three'
import { SIZE_QUADRANT } from './Lab03';
import { _M } from '_CORE/_M/_m'
import { createMeshBigElem } from './meshBigElem'

const BIG_ELEMS_N = 30

export class BigElems {
    _arr: any[] = []  
    _root: Root

    constructor(root: Root) {
        this._root = root

        for (let i = 0; i < BIG_ELEMS_N; i++) {
            const { mesh, meshCollision } = createMeshBigElem(root)
            this._arr.push({ 
                mesh,
                meshCollision,
                id: 'collisionBuild_' + i,
                inScene: false,
                location: '---',
            })
        }
    }

    addForLocation(location: string, x: number, z: number): void {
        for (let i = 0; i < this._arr.length; i++) {
            if (this._arr[i].location === location && this._arr[i].inScene) {
                return
            }
        }

        const elem = this._getAvailableElem()
        if (!elem) return

        elem.location = location
        this._addToScene(elem, x, z)
    }

    removeForLocation(location: string) {
        for (const elem of this._arr) {
            if (elem.location === location) {
                elem.location = null
                this._removeFromScene(elem)
            }
        }
    }

    removeAll() {
        this._arr.forEach((elem) => {
            if (elem.inScene) {
                this._removeFromScene(elem)
            }
        })
    }

    private _addToScene (elem: any, x: number = 0, z: number = 0) {
        elem.inScene = true
        elem.mesh.position.set(x, 0, z)
        elem.meshCollision.position.copy(elem.mesh.position)
        this._root.studio.add(elem.mesh)
        elem.meshCollision.name = `${elem.id}|${Math.floor(Math.random() * 10000)}`
        this._root.phisics.addMeshToCollision(elem.meshCollision)
    }

    private _removeFromScene (elem: any) {
        elem.inScene = false
        this._root.studio.remove(elem.mesh)
        this._root.phisics.removeMeshFromCollision(elem.meshCollision.name)
    }

    private _getAvailableElem(): any {
        const elem = this._arr.find((item: any) => !item.inScene)
        if (!elem) return null
        return elem
    }
}