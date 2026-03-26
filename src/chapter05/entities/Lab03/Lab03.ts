import { createMeshSuper } from './meshStairs'
import { Root } from '../../index'
import * as THREE from 'three'

export class Labyrinth {
    _root: Root
    floors: {
        p0: number[]
        p1: number[]
        p2: number[]
        p3: number[]
    }[]  = []

    constructor() {}
    async init (root: Root) {
        // this._root = root

        const groundC = new THREE.Mesh(
            new THREE.BoxGeometry(1500, 0.1, 1500),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        )
        groundC.name = 'collisionGround'
        groundC.position.y = 0
        groundC.position.z = 0
        groundC.position.x = 0
        root.phisics.addMeshToCollision(groundC)

        const { mesh, meshCollision, meshCollisionCar, meshFinish, lastXYZ } = createMeshSuper(root)
        root.studio.add(mesh)

        // const { floors } = createTown2(root)
        // this.floors = floors
    }

    checkArea(indPrev: number, x: number, z: number) {
        // if (this.floors[indPrev]) {
        //     const p0 = this.floors[indPrev].p0
        //     const p1 = this.floors[indPrev].p1
        //     const p2 = this.floors[indPrev].p2
        //     const p3 = this.floors[indPrev].p3
        //     if (x >= p0[0] && x <= p1[0] && z <= p0[1] && z >= p3[1]) {
        //         return indPrev
        //     }
        // }

        // for (let i = 0; i < this.floors.length; ++i) {
        //     const p0 = this.floors[i].p0
        //     const p1 = this.floors[i].p1
        //     const p2 = this.floors[i].p2
        //     const p3 = this.floors[i].p3
        //     if (x >= p0[0] && x <= p1[0] && z <= p0[1] && z >= p3[1]) {
        //         return i
        //     }
        // }
        return -1
    }

    getRandomPosInRoom(indRoom: number) {
    //     const p0 = this.floors[indRoom].p0
    //     const p1 = this.floors[indRoom].p1
    //     const p2 = this.floors[indRoom].p2
    //     const p3 = this.floors[indRoom].p3

    //     return { x: Math.random() * (p1[0] - p0[0] - 2) + p0[0] + 1, z: Math.random() * (p0[1] - p3[1] - 2) + p3[1] + 1 }
    }
}

// export const createChangerGalleries = root => {
//     const {
//         studio,
//         car,
//         system_Level,
//         system_PlayerMoveOnLevel,
//         system_PlayerNearLevelItems,
//     } = root

//     // /** super */
//     const createSuper = () => {
//         const superP = createMeshSuper(root)    
//         superP.meshCollision.visible = false    
//         superP.meshCollisionCar.visible = false    
//         superP.meshFinish.position.copy(superP.mesh.position)
//         return superP
//     }

//     const s = {
//         'location01': createSuper(),
//         'location02': createSuper(),
//         'location03': createSuper(),
//     }


//     /** add/remove locations by key */
//     const addLocationToScene = (keyLocation, x, z) => {
//         const { mesh, meshCollision, meshCollisionCar, meshFinish, lastXYZ } = s[keyLocation]

//         const y = -42
//         mesh.position.set(x, y, z)
//         studio.addToScene(mesh)

//         system_PlayerMoveOnLevel.addItemToPlayerCollision(meshCollision)
//         //meshCollision.visible = false
//         meshCollision.position.set(x, y, z)
//         studio.addToScene(meshCollision)
        
//         car.setCollisionForDraw(meshCollisionCar)
//         meshCollisionCar.visible = false
//         meshCollisionCar.position.set(x, y, z)
//         studio.addToScene(meshCollisionCar)

//         meshFinish.position.set(x, y, z)
//         meshFinish.position.x += lastXYZ[0]
//         meshFinish.position.y += lastXYZ[1]
//         meshFinish.position.z += lastXYZ[2]
//         studio.addToScene(root.unit.mesh)
//         root.unit.mesh.position.copy(meshFinish.position)
//         root.unit.mesh.position.y += 20
//         system_PlayerNearLevelItems.setItemToCheck(meshFinish, 'nearPerson_' + keyLocation, 80)
//     }


//     const removeLocationFromScene = keyLocation => {
//         const { mesh, meshCollision, meshCollisionCar, meshFinish } = s[keyLocation]

//         studio.removeFromScene(mesh)

//         system_PlayerMoveOnLevel.removeItemFromPlayerCollision(meshCollision)
//         studio.removeFromScene(meshCollision)

//         studio.removeFromScene(meshCollisionCar)
//         car.removeCollisionForDraw(meshCollisionCar)

//         studio.removeFromScene(meshFinish)
//         system_PlayerNearLevelItems.removeItemFromCheck(meshFinish)
//     }


//     return {
//         removeLocationFromScene,
//         addLocationToScene,
//         removeAll: () => {
//             for (let k in s) {
//                 removeLocationFromScene(k)
//             }
//         }
//     }
// }