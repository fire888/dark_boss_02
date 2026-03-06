import { MeshBasicMaterial, Mesh } from 'three'
import { Root } from "../index";
import { _M } from '../geometry/_m';
export class Floor {
    mesh: Mesh
    constructor() {}

    init (root: Root) {

        const v = []
        const c: number[] = []

        const SIZE = 70
        const SIZE_H = SIZE * .5
        const S = .05
        const N = 90
        const COLOR = [.2, .7, 2.]

        const centers = []
        for (let i = 0; i < N; ++i) {
            for (let j = 0; j < N; ++j) {
                centers.push([j / N * SIZE - SIZE_H, 0, i / N * SIZE - SIZE_H])
            }
        }

        for (let i = 0; i < centers.length; ++i) {
            const center = centers[i]
            const dist = Math.sqrt(center[0] * center[0] + center[2] * center[2])
            const cc = 1. - dist / SIZE_H
            if (cc < 0.05) { 
                continue
            }

            v.push(
                ..._M.createPolygon(
                    [center[0] - S, center[1], center[2] + S],
                    [center[0] + S, center[1], center[2] + S],
                    [center[0] + S, center[1], center[2] - S],
                    [center[0] - S, center[1], center[2] - S],
                )
            )

            c.push(..._M.fillColorFace([cc * COLOR[0], cc * COLOR[1], cc * COLOR[2]]))
        }

        const material = new MeshBasicMaterial({
            color: 0xFFFFFF,
            vertexColors: true,
        })

        this.mesh = _M.createMesh({ v, c, material })
        this.mesh.position.x = 15
        this.mesh.position.y = -.3
    }
}
