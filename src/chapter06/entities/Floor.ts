import { Mesh } from 'three'
import { Root } from "../index";
import { _M } from '_CORE/';

export class Floor {
    mesh: Mesh
    constructor() {}

    init (root: Root) {

        const v: number[] = []
        const c: number[] = []
        const uv: number[] = []

        const S = 100

        for (let i = 20; i > -20; --i) {
            for (let j = -20; j < 20; ++j) {
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

        this.mesh = _M.createMesh({ v, c, uv, material: root.materials.desert })
    }
}
