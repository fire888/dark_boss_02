import { 
    BufferGeometry, 
    SRGBColorSpace, 
    Float32BufferAttribute, 
    PointsMaterial,
    Points,
    AdditiveBlending,
    Vector3,
} from 'three'
import { Root } from '../index'

enum ModeUpdate {
    NORMAL = 'NORMAL',
    ANTIGRAV = 'ANTIGRAV'
}

export class Particles {
    _root: Root
    _geometry: BufferGeometry
    _vertices: number[]
    _speeds: number[]
    _timesLive: number[]
    _positionAntigrav: Vector3 = new Vector3()
    _mode: ModeUpdate = ModeUpdate.NORMAL 
    m: Points

    init (root: Root) {
        this._root = root

        this._geometry = new BufferGeometry()
        this._speeds = []
        this._timesLive = []
        const sprite = root.loader.assets.sprite
        sprite.colorSpace = SRGBColorSpace;

        const _vertices = []

        for ( let i = 0; i < 300; i ++ ) {
            const x = Math.random() * 100 - 50
            const y = Math.random() * 15
            const z = Math.random() * 100 - 50
            _vertices.push(x, y, z)

            const sX = Math.random() * .01 - .005
            const sY = Math.random() * .01 - .005
            const sZ = Math.random() * .01 - .005
            this._speeds.push(sX, sY, sZ)

            this._timesLive.push(Math.floor(Math.random() * 1000))
        }
        this._geometry.setAttribute('position', new Float32BufferAttribute(_vertices, 3))
        // @ts-ignore
        this._vertices = this._geometry.attributes.position.array

        const material = new PointsMaterial({ 
            size: .5, 
            map: sprite, 
            blending: AdditiveBlending, 
            transparent: true 
        })
        this.m = new Points(this._geometry, material) 
        this.m.frustumCulled = false
    }

    update () {
        if (!this._root.studio.camera) {
            return
        }

        if (this._mode === ModeUpdate.NORMAL) {
            this._updateByCamera()
        }

        if (this._mode === ModeUpdate.ANTIGRAV) {
            this._updateByAntigrav()
        }
    }

    startForcreMovieAntigrav(p: Vector3) {
        this._positionAntigrav.x = p.x
        this._positionAntigrav.y = p.y + 5
        this._positionAntigrav.z = p.z - 10
        
        this._mode = ModeUpdate.ANTIGRAV

        const poses = this._geometry.attributes.position.array
        for (let i = 0; i < this._speeds.length; i += 3) {
            const diffX = this._positionAntigrav.x - poses[i]
            const diffY = this._positionAntigrav.y - poses[i + 1]
            const diffZ = this._positionAntigrav.z - poses[i + 2]

            const d = Math.sqrt(diffX * diffX + diffY * diffY + diffZ * diffZ)

            this._speeds[i] = diffX / d / 3
            this._speeds[i + 1] = diffY / d / 3
            this._speeds[i + 2] = diffZ / d / 3
        }

        for (let i = 0; i < this._timesLive.length; ++i) {
            this._timesLive[i] = -1000
        }
    }

    startFlyPlayerAround() {
        for (let i = 0; i < this._vertices.length; i += 3) {
            this._vertices[i] += 5000   
        }
        this._geometry.attributes.position.needsUpdate = true
        
        for ( let i = 0; i < this._speeds.length; i += 3) {
            this._speeds[i] = Math.random() * .01 - .005
            this._speeds[i + 1] = Math.random() * .01 - .005
            this._speeds[i + 2] = Math.random() * .01 - .005
        }
        this._mode = ModeUpdate.NORMAL
    }

    _updateByCamera() {
        for (let i = 0; i < this._timesLive.length; ++i) {
            this._timesLive[i] -= 1
            if (this._timesLive[i] < 0) {
                this._timesLive[i] = 1000

                const pos = this._root.studio.camera.position
                this._vertices[i * 3] = pos.x + Math.random() * 100 - 50
                this._vertices[i * 3 + 1] = pos.y + Math.random() * 25
                this._vertices[i * 3 + 2] = pos.z + Math.random() * 100 - 50
            }
        }

        for (let i = 0; i < this._speeds.length; ++i) {
            if (Math.random() < .01) {
                this._speeds[i] *= -1
            }
        }

        for (let i = 0; i < this._speeds.length; i += 3) {
            this._vertices[i] += this._speeds[i]
            this._vertices[i + 1] += this._speeds[i + 1]
            this._vertices[i + 2] += this._speeds[i + 2]
        }

        this._geometry.attributes.position.needsUpdate = true
    }

    _updateByAntigrav() {
        for (let i = 0; i < this._speeds.length; i += 3) {
            this._vertices[i] += this._speeds[i]
            this._vertices[i + 1] += this._speeds[i + 1]
            this._vertices[i + 2] += this._speeds[i + 2]

            const j = i / 3

            // move to the antigrav
            if (this._timesLive[j] === -1000) {
                if (
                    Math.abs(this._positionAntigrav.x - this._vertices[i]) < Math.abs(this._speeds[i] * 3) &&
                    Math.abs(this._positionAntigrav.y - this._vertices[i + 1]) < Math.abs(this._speeds[i + 1] * 3) &&
                    Math.abs(this._positionAntigrav.z - this._vertices[i + 2]) < Math.abs(this._speeds[i + 2] * 3)
                ) {
                    this._timesLive[j] = 100 + Math.floor(Math.random() * 200)
                    this._speeds[i] = 0
                    this._speeds[i + 1] = 0
                    this._speeds[i + 2] = .6

                    this._vertices[i] = Math.random() * 1 - .5 + this._positionAntigrav.x
                    this._vertices[i + 1] = Math.random() * 1 - .5 + this._positionAntigrav.y
                }
            }

            // move from the antigrav
            if (this._timesLive[j] > 0) {
                this._timesLive[j] -= 1
            }
            // reset to the antigrav
            if (this._timesLive[j] === 0) {
                this._timesLive[j] = 100 + Math.floor(Math.random() * 200)
                this._vertices[i] = Math.random() * 1 - .5 + this._positionAntigrav.x
                this._vertices[i + 1] = Math.random() * 1 - .5 + this._positionAntigrav.y
                this._vertices[i + 2] = Math.random() * -50 + this._positionAntigrav.z
            }
        }


        this._geometry.attributes.position.needsUpdate = true
    }
}
