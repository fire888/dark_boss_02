import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import * as THREE from 'three'
import { Core } from '_CORE/types'
import { _M } from '_CORE/_M/_m'

export class ControlsPointer {
    isEnabled = false
    _camera: THREE.PerspectiveCamera
    _domElem: HTMLElement

    _raycaster: THREE.Raycaster

    _controls: PointerLockControls

    _root: Core

    _timeLastLocked: number = null
    _delayNextLock = 2000

    _topVec = new THREE.Vector3(0, 1, 0)

    init (root: Core) {
        this._root = root

        this._camera = root.studio.camera
        this._domElem = root.studio.containerDom
        const rotY = _M.getAngleDirY(this._camera) + Math.PI
        console.log('rotY', rotY)

        this._controls = new PointerLockControls(this._camera, this._domElem)
        this._controls.maxPolarAngle = Math.PI - .01
        this._controls.minPolarAngle = .01

        this._controls.getObject().rotation.set(0, rotY, 0)
        this._controls.addEventListener('lock', () => {
            this.isEnabled = true
        })
        this._controls.addEventListener('unlock', () => {
            this.isEnabled = false
            this._timeLastLocked = Date.now()
        })

        this._raycaster = new THREE.Raycaster(new THREE.Vector3(), this._topVec, 0, 1)
    }

    setRotation(x: number, y: number, z: number) {
        this._controls.getObject().rotation.set(x, y, z)
    }

    enable() {
        return new Promise(res => {
            if (this.isEnabled) { 
                return res(false)
            }
            if (this._timeLastLocked + this._delayNextLock > Date.now()) { 
                return res(false)
            }

            const rotY = _M.getAngleDirY(this._camera) + Math.PI
            this._controls.getObject().rotation.set(0, rotY, 0)
            this._controls.lock()
            this.isEnabled = true

            res(true)
        })
    }

    disable() {
        if (!this.isEnabled) { 
            return 
        }
        this.isEnabled = false
        this._controls.unlock()
    }

    onUnlock (cb: () => void) {
        this._controls.addEventListener('unlock', cb)
    }
}
