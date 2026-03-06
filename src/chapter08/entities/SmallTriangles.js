import { Object3D, MeshBasicMaterial, BufferGeometry, BufferAttribute, Mesh } from 'three'

export class SmallTriangles {
    init () {
        this.m = new Object3D()
        this.material = new MeshBasicMaterial({ 
            color: 0xffffff,
        })

        for (let i = 0; i < 50; ++i) {
            const s = createS(this.material)
            s.position.x = 0
            s.position.z = 0
            this.m.add(s) 
        }
    }
}

const createS = m => {
    const v = []

    for (let i = 0; i < 20; ++i) {
        const angle = Math.random() * Math.PI * 2
        const d = Math.random() * 3 * 12 + 50

        const x = Math.cos(angle) * d
        const y = Math.random() * 150 + 10
        const z = Math.sin(angle) * d

        for (let i = 0; i < 3; ++i) {
            v.push(
                x + Math.random() * .5,
                y + Math.random() * .5,
                z + Math.random() * .5,
            )
        }
    } 

    const vertices = new Float32Array(v)
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(vertices, 3))
    geometry.computeVertexNormals()

    return new Mesh(geometry, m)
}
