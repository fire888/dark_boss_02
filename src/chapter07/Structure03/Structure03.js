/* eslint-disable */
import { STRUCTURES } from './constants/constants_elements'
import { createDataTiles } from './tilesMakerData'
import { createMap } from './map3SCreaterFromTiles'
import { createrMesh } from './threeMesh'
import * as THREE from 'three'
// http://cr31.co.uk/stagecast/wang/3corn.html
// MUST DO: central to top

export class Structure {
    init(root) {
        this.tiles = createDataTiles()
        this.dataStructure = createMap(this.tiles)
        this.makerMesh = createrMesh(root)
        this.map = null
    } 

    generateStructure (structure = STRUCTURES[Math.floor(Math.random()* STRUCTURES.length)]) {
        return new Promise(res => {
            this.dataStructure.generateMap(structure).then(m => {
                this.map = m
                console.log('map', this.map)
                this.makerMesh.generateMeshes(this.map, structure).then(result => {
                    res()
                })
            })
        })
    }
    generateStructureFinal (map, structure) {
        return new Promise(res => {
            this.makerMesh.generateMeshes(map, structure).then(result => {
                res()
            })
        })
    }
    destroyStructure () {
        this.dataStructure.destroyMap()
        this.makerMesh.destroyStructure()
    }
    getCoordsForItem (key) {
        let x, y, z

        const map = this.map

        let count = 100
        const iterate = () => {

            const rY = Math.floor(Math.random() * (map.sizeY - 2) + 1)
            const rZ = Math.floor(Math.random() * map.sizeZ)
            const rX = Math.floor(Math.random() * map.sizeX)

            --count
            if (
                map.items[rY][rZ][rX] &&
                map.items[rY][rZ][rX].tileData &&
                (
                    count < 0 ||
                    map.items[rY][rZ][rX].tileData.keyModel === 't_L' ||
                    map.items[rY][rZ][rX].tileData.keyModel === 't_T' ||
                    map.items[rY][rZ][rX].tileData.keyModel === 't_I' ||
                    map.items[rY][rZ][rX].tileData.keyModel === 't_X'
                )
            ) {
                y = rY
                x = rX
                z = rZ
            } else {
                iterate()
            }
        }
        iterate()
        return [x, y, z]
    }
}




// export const createStructure3 = (
//     root,
// ) => {
//     const tiles = createDataTiles()
//     const dataStructure = createMap(tiles)
//     const makerMesh = createrMesh(root)
//     let map = null



//     return {
//         generateStructure: (structure = STRUCTURES[Math.floor(Math.random()* STRUCTURES.length)]) => {
//           return new Promise(res => {
//               dataStructure.generateMap(structure).then(m => {
//                   map = m
//                   console.log('map', map)
//                   makerMesh.generateMeshes(map, structure).then(result => {
//                       res()
//                   })
//               })
//           })
//         },
//         generateStructureFinal: (map, structure) => {
//             return new Promise(res => {
//                 makerMesh.generateMeshes(map, structure).then(result => {
//                     res()
//                 })
//             })
//         },
//         destroyStructure: () => {
//             dataStructure.destroyMap()
//             makerMesh.destroyStructure()
//         },
//         getCoordsForItem: (key) => {
//             let x, y, z

//             let count = 100
//             const iterate = () => {

//                 const rY = Math.floor(Math.random() * (map.sizeY - 2) + 1)
//                 const rZ = Math.floor(Math.random() * map.sizeZ)
//                 const rX = Math.floor(Math.random() * map.sizeX)

//                 --count
//                 if (
//                     map.items[rY][rZ][rX] &&
//                     map.items[rY][rZ][rX].tileData &&
//                     (
//                         count < 0 ||
//                         map.items[rY][rZ][rX].tileData.keyModel === 't_L' ||
//                         map.items[rY][rZ][rX].tileData.keyModel === 't_T' ||
//                         map.items[rY][rZ][rX].tileData.keyModel === 't_I' ||
//                         map.items[rY][rZ][rX].tileData.keyModel === 't_X'
//                     )
//                 ) {
//                     y = rY
//                     x = rX
//                     z = rZ
//                 } else {
//                     iterate()
//                 }
//             }
//             iterate()
//             return [x, y, z]
//         },
//     }
// }
