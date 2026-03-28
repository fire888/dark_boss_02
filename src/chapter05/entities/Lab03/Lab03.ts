import { createMeshSuper } from './meshStairs'
import { createMeshBigElem } from './meshBigElem'
import { Root } from '../../index'
import * as THREE from 'three'

export const SIZE_QUADRANT = 500

export class Labyrinth {
    _root: Root
    locations: any[] = []
    bigElems: any[] = []
    floors: any[] = []
    _arrTrash: any[] = []

    constructor() {}
    async init (root: Root) {
        this._root = root

        const groundC = new THREE.Mesh(
            new THREE.BoxGeometry(1500, 0.1, 1500),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        )
        groundC.name = 'collisionGround'
        groundC.position.y = 0
        groundC.position.z = 0
        groundC.position.x = 0
        root.phisics.addMeshToCollision(groundC)

        for (let i = 0; i < 3; ++i) {
            const { mesh, meshCollision, meshFinish, lastXYZ } = createMeshSuper(root)
            meshCollision.name = 'collisionStairs_' + i
            this.locations.push({ mesh, meshCollision, meshFinish, lastXYZ })
        }

        for (let i = 0; i < 30; ++i) {
            const data = createMeshBigElem(root)
            const id = i
            this.bigElems.push({...data, id, inScene: false })
        }
    }

    addLocationToScene(index: number, x: number, z: number) {
        const { mesh, meshCollision, meshFinish, lastXYZ } = this.locations[index]

        const y = 0
        mesh.position.set(x, y, z)
        this._root.studio.add(mesh)

        meshCollision.position.set(x, y, z)
        this._root.phisics.addMeshToCollision(meshCollision)
        //this._root.studio.add(meshCollision)
        
        //car.setCollisionForDraw(meshCollisionCar)
        //meshCollisionCar.visible = false
        //meshCollisionCar.position.set(x, y, z)
        //studio.addToScene(meshCollisionCar)

        meshFinish.position.set(x, y, z)
        meshFinish.position.x += lastXYZ[0]
        meshFinish.position.y += lastXYZ[1]
        meshFinish.position.z += lastXYZ[2]
        //studio.addToScene(root.unit.mesh)
        //root.unit.mesh.position.copy(meshFinish.position)
        //root.unit.mesh.position.y += 20
        //system_PlayerNearLevelItems.setItemToCheck(meshFinish, 'nearPerson_' + keyLocation, 80)
        return lastXYZ
    }

    removeLocationFromScene(index: number) {
        const { mesh, meshCollision, meshCollisionCar, meshFinish } = this.locations[index]

        this._root.studio.remove(mesh)

        this._root.phisics.removeMeshFromCollision(meshCollision.name)
    }

    addBigElems(arr: string[]) {
        for (let i = 0; i < arr.length; ++i) {
            /** add floor */
            const p = arr[i].split('_')
            const x = +p[0] * SIZE_QUADRANT
            const z = +p[1] * SIZE_QUADRANT
            //const floor = new THREE.Mesh(floorGeom, materials.floorMat)
            //floor.rotation.x = -Math.PI / 2
            //floor.position.set(x, y, z)
            //studio.addToScene(floor)
            //arrTrash.push({
            //    mesh: floor,
            //    keyLocation: arr[i],
            //    type: 'floor',
            //})
            //system_PlayerMoveOnLevel.addItemToPlayerCollision(floor)



            /** add build ******************/
            const rCount = Math.floor(Math.random() * 8)
            for (let j = 0; j < rCount; ++j) {                
                
                
                const buildingData = this._getRandomItemNotInScene()
                if (!buildingData) {
                    continue;
                }

                const { mesh, meshCollision, id } = buildingData
                mesh.position.set(x + Math.random() * SIZE_QUADRANT, 0, z + Math.random() * SIZE_QUADRANT)
                this._root.studio.add(mesh)

                //meshCollision.visible = false
                meshCollision.position.copy(mesh.position)
                //studio.addToScene(meshCollision)
                //system_PlayerMoveOnLevel.addItemToPlayerCollision(meshCollision)
                this._root.phisics.addMeshToCollision(meshCollision)

                //meshCollisionCar.visible = false
                //meshCollisionCar.position.copy(mesh.position)
                //studio.addToScene(meshCollisionCar)
                //car.setCollisionForDraw(meshCollisionCar)

                this._arrTrash.push({ mesh, meshCollision, keyLocation: arr[i], type: 'build', id })
            }
        }
    }

    removeBigElems(arr: string[]) {
        const arrToRemove = []
        for (let i = 0; i < arr.length; ++i) {
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
            //system_PlayerMoveOnLevel.removeItemFromPlayerCollision(mesh)
            this._root.phisics.removeMeshFromCollision(meshCollision.name)

            this._setItemIsNotInScene(id)
            //if (type === 'build') {
                //system_PlayerMoveOnLevel.removeItemFromPlayerCollision(meshCollision)
                //studio.removeFromScene(meshCollision)

                //car.removeCollisionForDraw(meshCollisionCar)
                //studio.removeFromScene(meshCollisionCar)

                //managerBuilds.setFlagAsFree(id)

            //    this.bigElems[id].inScene = false
            //}

            // if (type === 'floor') {
            //     arrToRemove[i].mesh.geometry.dispose()
            //     delete arrToRemove[i].mesh
            // }
        }
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
                //system_PlayerMoveOnLevel.removeItemFromPlayerCollision(mesh)
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

    _setItemIsNotInScene (id: number) {
        for (let i = 0; i < this.bigElems.length; ++i) {
            if (this.bigElems[i].id === id) {
                this.bigElems[i].inScene = false
                break;
            }
        }
    }
}



// const createManagerBuilds = (root) => {
//     const arr = []
//     for (let i = 0; i < 30; ++i) {
//         const data = createMeshGallery(root)
//         const id = 'build_' + i
//         arr.push({...data, id, inScene: false })
//     }

//     return {
//         getItem: () => {
//             for (let i = 0; i < arr.length; ++i) {
//                 if (!arr[i].inScene) {
//                     arr[i].inScene = true
//                     return arr[i]
//                 }
//             }

//             return null
//         },
//         setFlagAsFree: id => {
//             for (let i = 0; i < arr.length; ++i) {
//                 if (arr[i].id === id) {
//                     arr[i].inScene = false
//                     break;
//                 }
//             }

//         }
//     }
// }

