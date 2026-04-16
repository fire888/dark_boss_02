import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from 'three'

export class ControlsOrbit {
    isEnabled = false
    controls: OrbitControls | null = null
    constructor () {}

    init (camera: THREE.PerspectiveCamera, domElem: HTMLElement) {
        this.controls = new OrbitControls(camera, domElem)
        this.controls.target.set( 0, 0.5, 0 )
        this.controls.update()
        //this.controls.autoRotate = true
        this.controls.enablePan = true
        this.controls.enableDamping = true
        this.controls.enabled = false
    }

    enable () {
        if (!this.controls) {
            return
        }
        this.isEnabled = true
        this.controls.enabled = true
        this.controls.object.up.set( 0, 1, 0 )
    }

    disable () {
        if (!this.controls) {
            return
        }
        this.isEnabled = false
        this.controls.enabled = false
    }

    update () {
        if (!this.controls) {
            return
        }
        if (!this.controls.enabled) {
            return;
        }
        if (!this.isEnabled) {
            return
        }
        this.controls.update()
    }
}
