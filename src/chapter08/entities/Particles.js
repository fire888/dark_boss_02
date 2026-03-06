import { 
    BufferGeometry, 
    SRGBColorSpace, 
    Float32BufferAttribute, 
    PointsMaterial,
    Points,
    AdditiveBlending,
} from 'three'

export class Particles {
    init (root) {
        this._root = root

        this._geometry = new BufferGeometry()
        this._vertices = []
        this._speeds = []
        const sprite = root.loader.assets.sprite
        sprite.colorSpace = SRGBColorSpace;

        for ( let i = 0; i < 500; i ++ ) {
            const x = Math.random() * 100 - 50
            const y = Math.random() * 100 - 50
            const z = Math.random() * 100 - 50
            this._vertices.push(x, y, z)

            const sX = Math.random() * .1 - .05
            const sY = Math.random() * .1 - .05
            const sZ = Math.random() * .1 - .05
            this._speeds.push(sX, sY, sZ)
        }
        this._geometry.setAttribute('position', new Float32BufferAttribute(this._vertices, 3))

        const material = new PointsMaterial({ 
            size: .5, 
            map: sprite, 
            blending: AdditiveBlending, 
            //depthTest: false, 
            transparent: true 
        })
        //material.color.setHSL( color[ 0 ], color[ 1 ], color[ 2 ], THREE.SRGBColorSpace );
        this.m = new Points(this._geometry, material) 
    }

    update () {
        for (let i = 0; i < this._speeds.length; i += 3) {
            this._vertices[i] += this._speeds[i]
            this._vertices[i + 1] += this._speeds[i + 1]
            this._vertices[i + 2] += this._speeds[i + 2]

            if (this._vertices[i] > 50 || this._vertices[i] < -50) {
                this._speeds[i] *= -1
            }
            if (this._vertices[i + 1] > 50 || this._vertices[i + 1] < -50) {
                this._speeds[i + 1] *= -1
            }
            if (this._vertices[i + 2] > 50 || this._vertices[i + 2] < -50) {
                this._speeds[i + 2] *= -1
            }
        }

        this._geometry.setAttribute('position', new Float32BufferAttribute(this._vertices, 3))
        this._geometry.needsUpdate = true
    }
}
