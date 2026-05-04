import * as THREE from 'three'
import { Root } from '../../index'
import { _M } from '_CORE/_M/_m'
export const SIZE_QUADRANT = 10

import { IArrayForBuffers } from 'geometry/GeomTypes'
import { createFloor01, T_Floor01 } from 'geometry/00_floor01/floor01'
import { studioConfig } from 'chapter05/entities/geometry/constants'

export class Labyrinth {
    private _root!: Root

    async init(root: Root): Promise<void> {
        this._root = root

        const { studio, phisics } = root

        studio.addAxisHelper()

        const W = 150
        const STEP = 7
        const MAX_H = 1
        const MAX_H_2 = 15

        const floors: T_Floor01[][] = []
        for (let i = -1; i < 2; ++i) {
            const arr: T_Floor01[] = []
            for (let j = -1; j < 2; ++j) {
                const floor = createFloor01({ w: W, wStep: STEP, maxH: (i === 0 && j === 0) ? MAX_H : MAX_H_2 })
                arr.push(floor)
            }
            floors.push(arr)
        }

        for (let i = 0; i < floors.length; ++i) {
            for (let j = 0; j < floors[i].length; ++j) {
                const f = floors[i][j]

                if (floors[i][j - 1]) {
                    const { posXInd, v: vPrevX } = floors[i][j - 1]
                    const { negXInd, v: vCur } = f
                    for (let k = 0; k < posXInd.length; ++k) {
                        const prevInd = posXInd[k]
                        const currInd = negXInd[k]
                        vCur[currInd * 3] = vPrevX[prevInd * 3] - W
                        vCur[currInd * 3 + 1] = vPrevX[prevInd * 3 + 1]
                        vCur[currInd * 3 + 2] = vPrevX[prevInd * 3 + 2]
                    }
                }
                if (floors[i - 1] && floors[i - 1][j]) {
                    const { posZInd, v: vPrevZ } = floors[i - 1][j]
                    const { negZInd, v: vCur } = f
                    for (let k = 0; k < posZInd.length; ++k) {
                        const prevInd = posZInd[k]
                        const currInd = negZInd[k]
                        vCur[currInd * 3] = vPrevZ[prevInd * 3]
                        vCur[currInd * 3 + 1] = vPrevZ[prevInd * 3 + 1]
                        vCur[currInd * 3 + 2] = vPrevZ[prevInd * 3 + 2] - W
                    }
                }

                const m = _M.createMesh({
                    index: f.index || undefined,
                    v: f.v,
                    uv: f.uv,
                    c: f.c,
                    material: root.materials.floorMatNorm,
                })
                m.position.x = j * W - W
                m.position.y = -2.5
                m.position.z = i * W - W
                root.studio.add(m)

                if (i === 1 && j === 1) {
                    const geom = m.geometry.clone().toNonIndexed()
                    const mN = new THREE.Mesh(geom, root.materials.floorMatNorm)
                    mN.position.copy(m.position) 
                    phisics.addMeshToCollision(mN, true)
                }

            }
        }



        // const f0 = createFloor01({ w: W, wStep: STEP, maxH: MAX_H })
        // const f1 = createFloor01({ w: W, wStep: STEP, maxH: MAX_H })
        // const f2 = createFloor01({ w: W, wStep: STEP, maxH: MAX_H })

        // const { posXInd, posZInd, v: vFrom } = f0
        // const { negXInd, v: vTarget } = f1
        // const { negZInd, v: vTarget2 } = f2

        // for (let i = 0; i < posXInd.length; ++i) {
        //     const indFromX = posXInd[i]
        //     const indToX = negXInd[i]
        //     vTarget[indToX * 3] = vFrom[indFromX * 3] - W
        //     vTarget[indToX * 3 + 1] = vFrom[indFromX * 3 + 1]
        //     vTarget[indToX * 3 + 2] = vFrom[indFromX * 3 + 2]
        // }

        // for (let i = 0; i < posZInd.length; ++i) {
        //     const indFromZ = posZInd[i]
        //     const indToZ = negZInd[i]
        //     vTarget2[indToZ * 3] = vFrom[indFromZ * 3]
        //     vTarget2[indToZ * 3 + 1] = vFrom[indFromZ * 3 + 1]
        //     vTarget2[indToZ * 3 + 2] = vFrom[indFromZ * 3 + 2] - W
        // }

        // const m = _M.createMesh({
        //     index: f0.index || undefined,
        //     v: f0.v,
        //     uv: f0.uv,
        //     c: f0.c,
        //     material: root.materials.floorMatNorm,
        // })
        // m.position.x =0
        // m.position.y = -2.5
        // m.position.z = 0
        // root.studio.add(m)

        // const m1 = _M.createMesh({
        //     index: f1.index || undefined,
        //     v: f1.v,
        //     uv: f1.uv,
        //     c: f1.c,
        //     material: root.materials.floorMatNorm,
        // })
        // m1.position.x = W
        // m1.position.y = -2.5
        // m1.position.z = 0
        // root.studio.add(m1)

        // const m2 = _M.createMesh({
        //     index: f2.index || undefined,
        //     v: f2.v,
        //     uv: f2.uv,
        //     c: f2.c,
        //     material: root.materials.floorMatNorm,
        // })
        // m2.position.x = 0
        // m2.position.y = -2.5
        // m2.position.z = W
        // root.studio.add(m2)





        //let floors: T_Floor01[][] = []

        // for (let i = -1; i < 2; ++i) {
        //     const arr = []
        //     for (let j = -1; j < 2; ++j) {
        //         const floor = createFloor01({ w: W, wStep: STEP, maxH: MAX_H })
        //         arr.push(floor)
        //     }
        //     floors.push(arr)
        // }


        // for (let i = 0; i < floors.length; ++i) {
        //     for (let j = 0; j < floors[i].length; ++j) {
        //         const f = floors[i][j]

        //         if (floors[i][j - 1]) {
        //             const { posZInd, v: vPrevX } = floors[i][j - 1]
        //             for (let k = 0; k < posZInd.length; ++k) {
        //                 const prevInd = posZInd[k]
        //                 const currInd = f.posZInd[k]
        //                 f.v[currInd * 3] = vPrevX[prevInd * 3] - W
        //                 f.v[currInd * 3 + 1] = vPrevX[prevInd * 3 + 1]
        //                 f.v[currInd * 3 + 2] = vPrevX[prevInd * 3 + 2]
        //             }
        //         }

        //         const m = _M.createMesh({
        //             v: f.v,
        //             uv: f.uv,
        //             c: f.c,
        //             material: root.materials.floorMatNorm,
        //         })
        //         m.position.x = j * W - W
        //         m.position.y = -2.5
        //         m.position.z = i * W - W
        //         root.studio.add(m)
        //         if (i === 1 && j === 1) {
        //             root.phisics.addMeshToCollision(m, true)
        //         }
        //     }
        // }
    }

}