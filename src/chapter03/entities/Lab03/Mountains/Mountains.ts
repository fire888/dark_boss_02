import * as THREE from 'three'
import { Root } from '../../../index'
import { _M } from '_CORE/_M/_m'
export const SIZE_QUADRANT = 10

import { createFloor01, T_Floor01 } from 'geometry/00_floor01/floor01'

export class Mountains {
    private _root!: Root

    async init(root: Root): Promise<void> {
        this._root = root

        const { studio, phisics, materials } = root

        const W = 150
        const STEP = 7
        const MAX_H = 2
        const MAX_H_2 = 15
        const Y = -2.5

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

                // из левых дальних сегментов берем индексы передних и правых вершин и 
                // к к текущим левым и дальним индексам вершин присваиваем их значения,
                // чтобы сшить бесшовное продолжение без отверстий 

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
                    v: f.v, uv: f.uv,
                    material: materials.floorMatNorm,
                })
                m.position.x = j * W - W
                m.position.y = Y
                m.position.z = i * W - W
                studio.add(m)

                const geom = m.geometry.clone().toNonIndexed()
                const mN = new THREE.Mesh(geom, root.materials.floorMatNorm)
                mN.position.copy(m.position) 
                phisics.addMeshToCollision(mN, true)
            }
        }
    }

}