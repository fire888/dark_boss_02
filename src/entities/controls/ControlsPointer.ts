import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import * as THREE from 'three'
import { Tween, Interpolation } from '@tweenjs/tween.js'
import { Root } from 'index'
import { Body } from 'cannon-es'
import { _M } from 'geometry/_m'


export class ControlsPointer {
    isEnabled = false
    camera: THREE.PerspectiveCamera
    domElem: HTMLElement

    velocity: THREE.Vector3
    direction: THREE.Vector3

    savedPosition: THREE.Vector3
    diffVec: THREE.Vector3
    savedRotation: THREE.Quaternion
    raycaster: THREE.Raycaster

    controls: PointerLockControls

    _root: Root

    _isMoveDisabled = false
    _mouseEnable = true

    _prevTime: number

    _timeLastLocked: number = null
    _delayNextLock = 2000

    _currentSpeedForward = 0.
    _maxSpeedForward = 5.
    _tweenSpeedForward: Tween<any> | null = null

    _currentSpeedLeft = 0.
    _maxSpeedLeft = 5.
    _tweenSpeedLeft: Tween<any> | null = null

    _moveForward = false
    _moveBackward = false
    _moveLeft = false
    _moveRight = false
    _isJumping = false

    _dirForward = new THREE.Vector3()
    _dirLeft = new THREE.Vector3()
    _resultDir = new THREE.Vector3()
    _topVec = new THREE.Vector3(0, 1, 0)

    _timeRot = 0 
    _eulerRot = new THREE.Euler(0, 0, 0, 'YXZ')

    _strengthIdle = 0.


    init (root: Root) {
        this._root = root

        this.camera = root.studio.camera
        this.domElem = root.studio.containerDom

        this._prevTime = performance.now()
        this.velocity = new THREE.Vector3()
        this.direction = new THREE.Vector3()

        this.savedPosition = new THREE.Vector3()
        this.diffVec = new THREE.Vector3()
        this.savedRotation = new THREE.Quaternion().setFromAxisAngle(this._topVec,-Math.PI * .5)

        this.controls = new PointerLockControls(this.camera, this.domElem)
        this.controls.maxPolarAngle = Math.PI - .01
        this.controls.minPolarAngle = .01
        const rotY = _M.getAngleDirY(this._root.studio.camera)
        this.controls.getObject().rotation.set(0, rotY, 0)
        this.controls.addEventListener('lock', () => {
            this.isEnabled = true
        })
        this.controls.addEventListener('unlock', () => {
            this.isEnabled = false
            this._timeLastLocked = Date.now()
        })

        document.addEventListener('keydown', this._onKeyDown.bind(this))
        document.addEventListener('keyup', this._onKeyUp.bind(this))

        this.raycaster = new THREE.Raycaster(new THREE.Vector3(), this._topVec, 0, 1)
    }

    update (delta: number, playerCollision: Body) {
        if (this._mouseEnable === false) {
            return;
        }

        if (!this.isEnabled) {
            return;
        }

        if (!this.controls.isLocked) {
            return;
        }

        if (!this.camera) {
            return;
        }
        
        this._resultDir.x = 0
        this._resultDir.z = 0
        
        this.camera.getWorldDirection(this._dirForward)
        this._dirForward.y = 0
        this._dirForward.normalize()

        this._dirLeft.copy(this._dirForward).applyAxisAngle(this._topVec, Math.PI * .5)

        if (this._moveForward || this._moveBackward || this._tweenSpeedForward) {
            if (!this._isMoveDisabled) {
                this._dirForward.x *= this._currentSpeedForward
                this._dirForward.z *= this._currentSpeedForward
                this._resultDir.add(this._dirForward)
            }
        }
        if (this._moveLeft || this._moveRight || this._tweenSpeedLeft) {
            if (!this._isMoveDisabled) {
                this._dirLeft.x *= this._currentSpeedLeft
                this._dirLeft.z *= this._currentSpeedLeft
                this._resultDir.add(this._dirLeft)
            }
        }

        if (!this._isMoveDisabled) {
            playerCollision.velocity.x = this._resultDir.x
            playerCollision.velocity.z = this._resultDir.z
        }

        if (this._isJumping) {
            this._isJumping = false 
            if (this._root.phisics.isGround) playerCollision.velocity.y += 6
        }

        this.camera.position.x = playerCollision.position.x
        this.camera.position.y = playerCollision.position.y
        this.camera.position.z = playerCollision.position.z

        // camera debounce
        this._timeRot += delta
        const walkingDebounce = Math.sin(this._timeRot * 0.015) * 0.001 * this._currentSpeedForward
        const idleDebounce = 
            Math.sin(this._timeRot * 0.001) * 0.0001 * (this._maxSpeedForward - Math.abs(this._currentSpeedForward)) * this._strengthIdle
        this._eulerRot.setFromQuaternion(this.camera.quaternion)
        this._eulerRot.z = walkingDebounce + idleDebounce
        this.camera.quaternion.setFromEuler(this._eulerRot)
    }

    enable() {
        return new Promise(res => {
            if (this.isEnabled) { 
                return res(false)
            }
            if (this._timeLastLocked + this._delayNextLock > Date.now()) { 
                return res(false)
            }

            const rotY = _M.getAngleDirY(this.camera) + Math.PI
            this.controls.getObject().rotation.set(0, rotY, 0)
            this.controls.lock()
            this.isEnabled = true

            const obj = { v: 0 }
            new Tween(obj)
                .interpolation(Interpolation.Linear)
                .to({ v: 1}, 5000)
                .onUpdate(() => {
                    this._strengthIdle = obj.v
                })
                .start()

            res(true)
        })
    }

    disable() {
        if (!this.isEnabled) { 
            return 
        }
        this.isEnabled = false
        this.controls.unlock()
    }

    mouseDisable() {
        this._mouseEnable = false
    } 

    mouseEnable() {
        this._mouseEnable = true
    }

    onUnlock (cb: () => void) {
        this.controls.addEventListener('unlock', cb)
    }

    disableMove () {
        this._isMoveDisabled = true
        this._moveForward = false
        this._moveBackward = false
        this._moveLeft = false
        this._moveRight = false
        this._changeForwardSpeedTo(0)
        this._changeLeftSpeedTo(0)
    }

    enableMove () {
        this._isMoveDisabled = false
    }

    _changeForwardSpeedTo(v: number) {
        if (this._tweenSpeedForward) {
            this._tweenSpeedForward.stop()
        }

        const obj = { speed: this._currentSpeedForward }
        this._tweenSpeedForward = new Tween(obj)
            .interpolation(Interpolation.Linear)
            .to({ speed: v }, 200)
            .onUpdate(() => {
                this._currentSpeedForward = obj.speed
            })
            .onComplete(() => {
                this._tweenSpeedForward = null
            })
            .start()
    }

    _changeLeftSpeedTo(v: number) {
        if (this._tweenSpeedLeft) {
            this._tweenSpeedLeft.stop()
        }

        const obj = { speed: this._currentSpeedLeft }
        this._tweenSpeedLeft = new Tween(obj)
            .interpolation(Interpolation.Linear)
            .to({ speed: v }, 200)
            .onUpdate(() => {
                this._currentSpeedLeft = obj.speed
            })
            .onComplete(() => {
                this._tweenSpeedLeft = null
            })
            .start()
    }

    _onKeyDown (event: KeyboardEvent) {
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                if (!this._isMoveDisabled) {
                    if (!this._moveForward) this._changeForwardSpeedTo(this._maxSpeedForward)
                    this._moveForward = true
                }
                break

            case 'ArrowDown':
            case 'KeyS':
                if (!this._isMoveDisabled) {
                    if (!this._moveBackward) this._changeForwardSpeedTo(-this._maxSpeedForward)
                    this._moveBackward = true
                }
                break    

            case 'ArrowLeft':
            case 'KeyA':
                if (!this._isMoveDisabled) {
                    if (!this._moveLeft) this._changeLeftSpeedTo(this._maxSpeedLeft)
                    this._moveLeft = true
                }
                break

            case 'ArrowRight':
            case 'KeyD':
                if (!this._isMoveDisabled) {
                    if (!this._moveRight) this._changeLeftSpeedTo(-this._maxSpeedLeft)
                    this._moveRight = true
                }
                break

            case 'Space':
                this._isJumping = true
                break    
        }
    }

    _onKeyUp (event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (this._moveForward) this._changeForwardSpeedTo(0)
                this._moveForward = false
                break

            case 'ArrowDown':
            case 'KeyS':
                if (this._moveBackward) this._changeForwardSpeedTo(0)
                this._moveBackward = false
                break    

            case 'ArrowLeft':
            case 'KeyA':
                if (this._moveLeft) this._changeLeftSpeedTo(0)
                this._moveLeft = false
                break

            case 'ArrowRight':
            case 'KeyD':
                if (this._moveRight) this._changeLeftSpeedTo(0)
                this._moveRight = false
                break

            case 'Space':
                this._isJumping = false
                break    
        }
    }
}
