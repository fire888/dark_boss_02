import { createMeshSuper } from './meshStairs'
import { createMeshBigElem } from './meshBigElem'
import { Root } from '../../index'
import * as THREE from 'three'
import { _M } from '_CORE/_M/_m'

export const SIZE_QUADRANT = 500
const N_ELEMS = 30
const N_STAIRS = 3




type M = {
    mesh: THREE.Mesh
    meshCollision: THREE.Mesh
    id: number
    inScene: boolean
    type?: string
    location?: string
}

export class Labyrinth {
    _root: Root
    stairs: any[] = []
    bigElems: any[] = []
    floors: M[] = []
    normalFloor: any
    _arrTrash: any[] = []
    meshFinish: THREE.Mesh

    constructor() {}
    async init (root: Root) {
        this._root = root

        this.floors = this._createFloors()

        this.normalFloor = this._createFloor()
        this.normalFloor.mesh.material = root.materials.floorMat1
        root.studio.add(this.normalFloor.mesh)
        root.phisics.addMeshToCollision(this.normalFloor.meshCollision)

        for (let i = 0; i < N_STAIRS; ++i) {
            const { mesh, meshCollision, meshFinish, lastXYZ } = createMeshSuper(root)
            meshCollision.name = 'collisionStairs_' + i
            this.stairs.push({ mesh, meshCollision, meshFinish, lastXYZ })
        }

        for (let i = 0; i < N_ELEMS; ++i) {
            const data = createMeshBigElem(root)
            const id = i
            this.bigElems.push({...data, id, inScene: false })
        }
    }

    addStairToScene(index: number, x: number, z: number) {
        const { mesh, meshCollision, meshFinish, lastXYZ } = this.stairs[index]

        const y = 0
        mesh.position.set(x, y, z)
        this._root.studio.add(mesh)

        meshCollision.position.set(x, y, z)
        meshCollision.name = 'collisionBuild_' + Math.floor(Math.random() * 1000)
        this._root.phisics.addMeshToCollision(meshCollision)
        // this._root.studio.add(meshCollision)
        
        meshFinish.position.set(x, y, z)
        meshFinish.position.x += lastXYZ[0]
        meshFinish.position.y += lastXYZ[1] + 3
        meshFinish.position.z += lastXYZ[2]
        this.meshFinish = meshFinish
    }

    removeStairFromScene(index: number) {
        const { mesh, meshCollision } = this.stairs[index]

        this._root.studio.remove(mesh)

        this._root.phisics.removeMeshFromCollision(meshCollision.name)
    }

    addBigElems(arr: string[]) {
        for (let i = 0; i < arr.length; ++i) {
            /** add floor */
            const p = arr[i].split('_')
            const x = +p[0] * SIZE_QUADRANT
            const z = +p[1] * SIZE_QUADRANT

            const floor = this._getRandomFloorNotInScene()
            if (floor) {
                floor.location = arr[i]
                floor.mesh.position.set(x, 0, z)
                this._root.studio.add(floor.mesh)

                floor.meshCollision.name = 'floor_' + Math.floor(Math.random() * 1000)
                floor.meshCollision.position.copy(floor.mesh.position)
                this._root.phisics.addMeshToCollision(floor.meshCollision)
            } else {
                console.log('no floor', this.floors)
            }


            /** add build ******************/
            const rCount = Math.floor(Math.random() * 8)
            for (let j = 0; j < rCount; ++j) {                
                const buildingData = this._getRandomItemNotInScene()
                if (!buildingData) {
                    break
                }

                const { mesh, meshCollision, id } = buildingData
                mesh.position.set(x + Math.random() * SIZE_QUADRANT, 0, z + Math.random() * SIZE_QUADRANT)
                this._root.studio.add(mesh)

                meshCollision.name = 'collisionBuild_' + Math.floor(Math.random() * 1000)
                meshCollision.position.copy(mesh.position)
                this._root.phisics.addMeshToCollision(meshCollision)
                //this._root.studio.add(meshCollision)

                this._arrTrash.push({ mesh, meshCollision, keyLocation: arr[i], type: 'build', id })
            }
        }
    }

    removeBigElems(arr: string[]) {
        const arrToRemove = []

        for (let i = 0; i < arr.length; ++i) {
            for (let j = 0; j < this.floors.length; ++j) {
                if (arr[i] === this.floors[j].location) {
                    this.floors[j].inScene = false
                    this.floors[j].location = null
                    this._root.studio.remove(this.floors[j].mesh)
                    this._root.phisics.removeMeshFromCollision(this.floors[j].meshCollision.name)
                }
            }
            
            for (let j = 0; j < this._arrTrash.length; ++j) {
                if (arr[i] === this._arrTrash[j].keyLocation) {
                    arrToRemove.push(this._arrTrash[j])
                }
            }
        }

        this._arrTrash = this._arrTrash.filter(item => {
            for (let i = 0; i < arr.length; ++i) {
                if (item.keyLocation === arr[i]) {
                    return false;
                }
            }
            return true;
        })

        for (let i = 0; i < arrToRemove.length; ++i) {
            const { mesh, meshCollision, meshCollisionCar, type, id } = arrToRemove[i]
            this._root.studio.remove(mesh)
            this._root.phisics.removeMeshFromCollision(meshCollision.name)
            this._setItemIsNotInScene(id)
        }
    }

    removeNormalFloor() {
        this._root.studio.remove(this.normalFloor.mesh)
        this._root.phisics.removeMeshFromCollision(this.normalFloor.meshCollision.name)
    }

    updateBigElems (removeArr: string[], addArr: string[]) {
        this.removeBigElems(removeArr)
        this.addBigElems(addArr)
    }

    removeAll () {
        const { studio, car, phisics } = this._root
        for (let i = 0; i < this._arrTrash.length; ++i) {
            const { mesh, meshCollision } = this._arrTrash[i]

            studio.remove(mesh)
            phisics.removeMeshFromCollision(meshCollision.name)
            this._arrTrash[i].mesh.geometry.dispose()
            delete this._arrTrash[i].mesh
        }
    }

    _getRandomItemNotInScene() {
        for (let i = 0; i < this.bigElems.length; ++i) {
            if (this.bigElems[i].inScene) {
                continue;
            }
            this.bigElems[i].inScene = true
            return this.bigElems[i]
        }

        return null
    }

    _getRandomFloorNotInScene() {
        for (let i = 0; i < this.floors.length; ++i) {
            if (this.floors[i].inScene) {
                continue;
            }
            this.floors[i].inScene = true
            return this.floors[i]
        }

        return null
    }

    _setItemIsNotInScene (id: number) {
        for (let i = 0; i < this.bigElems.length; ++i) {
            if (this.bigElems[i].id === id) {
                this.bigElems[i].inScene = false
                break;
            }
        }
    }

    _createFloors() {
        const floors = []
        for (let i = 0; i < 12; ++i) {
            const { mesh, meshCollision } = this._createFloor()
            floors.push({ mesh, meshCollision, id: i, inScene: false })
        }
        return floors
    }

    _createFloor() {
        const s = SIZE_QUADRANT * .5 
        const _v = _M.createPolygon(
            [-s, 0, s],
            [s, 0, s],
            [s, 0, -s],
            [-s, 0, -s],
        )
        const groundC = _M.createMesh({ v: _v })
        groundC.name = 'collisionGround_' + Math.floor(Math.random() * 1000)
        groundC.position.y = 0
        this._root.phisics.addMeshToCollision(groundC)

        const v: number[] = []
        const c: number[] = []
        const uv: number[] = []

        const N = 40
        const S = SIZE_QUADRANT / N

        for (let i = N * .5; i > -N * .5; --i) {
            for (let j = -N * .5; j < N * .5; ++j) {
                v.push(..._M.createPolygon(
                    [(i + 1) * S, 0, j * S],
                    [i * S, 0, j * S],
                    [i * S, 0, (j + 1) * S],
                    [(i + 1) * S, 0, (j + 1) * S],
                ))
                uv.push(..._M.createUv(
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                ))
                c.push(..._M.fillColorFace([1, 1, 1]))
            }
        }

        const mesh = _M.createMesh({ v, c, uv, material: this._root.materials.floorMatGreen })

        return { mesh, meshCollision: groundC }
    }
}
