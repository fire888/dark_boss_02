import { Root } from '../../index'
import * as THREE from 'three'
import { SIZE_QUADRANT } from './Lab03';
import { _M } from '_CORE/_M/_m'

const FLOOR_GRID_N = 40
const N_FLOORS = 12

export class Floors {
    _arr: any[] = []  
    _root: Root
    baseFloor: any

    constructor(root: Root) {
        this._root = root

        this.baseFloor = this._createFloor()
        this.baseFloor.mesh.material = root.materials.floorMat1
        this._addToScene(this.baseFloor)


        for (let i = 0; i < N_FLOORS; i++) {
            const { mesh, meshCollision } = this._createFloor()
            this._arr.push({ 
                mesh,
                meshCollision,
                id: 'floor_' + i,
                inScene: false,
                location: '---',
            })
        }
    }

    addFloorForLocation(location: string, x: number, z: number): void {
        for (let i = 0; i < this._arr.length; i++) {
            if (this._arr[i].location === location && this._arr[i].inScene) {
                return
            }
        }

        const floor = this._getAvailableFloor()
        if (!floor) return

        floor.location = location
        this._addToScene(floor, x, z)
    }

    removeFloorForLocation(location: string) {
        for (const elem of this._arr) {
            if (elem.location === location) {
                elem.location = null
                this._removeFromScene(elem)
            }
        }
    }

    removeBaseFloor(): void {
        this._removeFromScene(this.baseFloor)
    }

    private _createFloor(): { mesh: THREE.Mesh; meshCollision: THREE.Mesh } {
        const halfSize = SIZE_QUADRANT * 0.5

        const collisionVertices = _M.createPolygon(
            [-halfSize, 0, halfSize],
            [halfSize, 0, halfSize],
            [halfSize, 0, -halfSize],
            [-halfSize, 0, -halfSize],
        )

        const meshCollision = _M.createMesh({ v: collisionVertices })
        meshCollision.position.y = 0

        const vertices: number[] = []
        const colors: number[] = []
        const uvs: number[] = []

        const cellSize = SIZE_QUADRANT / FLOOR_GRID_N
        const halfGrid = FLOOR_GRID_N * 0.5

        for (let i = halfGrid; i > -halfGrid; i--) {
            for (let j = -halfGrid; j < halfGrid; j++) {
                vertices.push(
                    ..._M.createPolygon(
                        [(i + 1) * cellSize, 0, j * cellSize],
                        [i * cellSize, 0, j * cellSize],
                        [i * cellSize, 0, (j + 1) * cellSize],
                        [(i + 1) * cellSize, 0, (j + 1) * cellSize],
                    ),
                )

                uvs.push(
                    ..._M.createUv(
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                    ),
                )

                colors.push(..._M.fillColorFace([1, 1, 1]))
            }
        }

        const mesh = _M.createMesh({
            v: vertices,
            c: colors,
            uv: uvs,
            material: this._root.materials.floorMatGreen,
        })

        return { mesh, meshCollision }
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

    private _getAvailableFloor(): any {
        const elem = this._arr.find((item: any) => !item.inScene)
        if (!elem) return null
        return elem
    }
}