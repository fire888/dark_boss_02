import { Root } from '../../index'
import { _M } from '_CORE/_M/_m'
import { createMeshSuper } from './meshStairs'

const BIG_ELEMS_N = 3

export class Stairs {
    _arr: any[] = []  
    _root: Root

    constructor(root: Root) {
        this._root = root

        for (let i = 0; i < BIG_ELEMS_N; i++) {
            const { mesh, meshCollision, meshFinish, lastXYZ} = createMeshSuper(root)
            meshCollision.name = `collisionBuild_|stair_${i}`

            this._arr.push({
                mesh,
                meshCollision,
                meshFinish,
                lastXYZ: lastXYZ as [number, number, number],
            })
        }
    }

    addToScene(ind: number, x: number, z: number): any {
        this._addToScene(this._arr[ind], x, z)
        return this._arr[ind].meshFinish
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
        
        const { mesh, meshCollision, meshFinish, lastXYZ, id } = elem
        
        mesh.position.set(x, 0, z)
        meshCollision.position.copy(mesh.position)
        this._root.studio.add(mesh)
        meshCollision.name = `${id}|${Math.floor(Math.random() * 10000)}`
        this._root.phisics.addMeshToCollision(meshCollision)

        meshFinish.position.set(
            x + lastXYZ[0],
            0 + lastXYZ[1] + 3,
            z + lastXYZ[2],
        )
    }

    private _removeFromScene (elem: any) {
        elem.inScene = false
        this._root.studio.remove(elem.mesh)
        this._root.phisics.removeMeshFromCollision(elem.meshCollision.name)
    }

    private _getAvailableelem(): any {
        const elem = this._arr.find((item: any) => !item.inScene)
        if (!elem) return null
        return elem
    }

}
