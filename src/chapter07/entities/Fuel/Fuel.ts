import * as THREE from 'three'
import { createElemCylinder } from '../../Structure03/geometries/geomElemCylinder'
import { createGeomFromBuffer } from '../../Structure03/geometries/createBufferGeom'
//import { translateArr } from "../helpers/geomHelpers";
import { Root  } from '../../index'
import { SCALE } from '../../Structure03/constants/const_structures'

export class Fuel {
    mesh: THREE.Mesh
    objectForCheck: THREE.Object3D

    init (root: Root) {
        const { structureMaterial, basicMat } = root.materials

        const v = []
        const c = []
        const u = []
        const col = []

        {
            const elem = createElemCylinder({
                color: [1, 1, 0],
            })
            v.push(...elem.v)
            c.push(...elem.c)
            u.push(...elem.u)
            col.push(...elem.col)
        }

        const viewGeom = createGeomFromBuffer({ v, c, u })
        viewGeom.scale(SCALE, SCALE, SCALE)
        const mesh = new THREE.Mesh(viewGeom, structureMaterial)
        root.studio.add(mesh)

        this.mesh = mesh
        this.objectForCheck = mesh
    }
}
