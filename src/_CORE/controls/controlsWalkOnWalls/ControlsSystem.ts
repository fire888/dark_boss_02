import { ControlsOrbit } from "../ControlsOrbit"
import { ControlsPointer } from "./ControlsPointer"
import { ControlsPhone } from "../ControlsPhone"
import { Core } from "../../types"
import { Tween, Interpolation } from '@tweenjs/tween.js'
import * as THREE from 'three'

export class ControlsSystem {
    _orbit: ControlsOrbit
    _pointer: ControlsPointer
    _phone: ControlsPhone
    _root: Core
    _currentWalkingControls: ControlsPointer | ControlsPhone | null
    
    _isDisabled = false
    _isMoveDisabled = false

    _jumpSpeed = 6

    _amplitudeLeftRightWalk = 0.002
    _currentSpeedForward = 0.
    _maxSpeedForward = 5.
    _tweenSpeedForward: Tween<any> | null = null

    _currentSpeedLeft = 0.
    _maxSpeedLeft = 5.
    _tweenSpeedLeft: Tween<any> | null = null

    _timeRot = 0 
    _eulerRot = new THREE.Euler(0, 0, 0, 'YXZ')
    _strengthIdle = 1

    _objectPos = new THREE.Object3D()
    _objectDir = new THREE.Object3D()
    
    init (root: Core, isStartOrbit: boolean) {
        this._root = root
    
        const { 
            deviceData, ui, studio,
            controlsConf
        } = root

        if (controlsConf && controlsConf.playerSpeedForward) {
            this._maxSpeedForward = controlsConf.playerSpeedForward
        }
        if (controlsConf && controlsConf.amplitudeLeftRightWalk) {
            this._amplitudeLeftRightWalk = controlsConf.amplitudeLeftRightWalk
        }
        if (controlsConf && controlsConf.jumpSpeed) {
            this._jumpSpeed = controlsConf.jumpSpeed
        }

        this._orbit = new ControlsOrbit()
        this._orbit.init(studio.camera, studio.containerDom)

        this._pointer = new ControlsPointer()
        this._pointer.init(root)

        this._phone = new ControlsPhone()
        this._phone.init(root)

        this._currentWalkingControls = deviceData.device === 'desktop' 
            ? this._pointer
            : this._phone

        if (isStartOrbit) {
            this._orbit.enable()
            ui.toggleVisibleButtonLock(false) 
        } else {
            this._currentWalkingControls.enable()
        }
        
        // click on buttonPointerLock: enable pointerLock and hide phoneControls  
        ui.lockButton.onclick = () => {
            this._pointer.enable().then(isOn => {
                if (this._isDisabled) {
                    return
                }
                if (!isOn) { 
                    return 
                }

                this._currentWalkingControls = this._pointer
                this._phone.disable()
                this._orbit.disable()
                ui.toggleVisibleButtonLock(false) 

                root.studio.addFog()            
            })
        }
        // callback on pointerUnlock: enable phoneControls and show buttonPointerLock
        this._pointer.onUnlock(() => {
            if (this._isDisabled) {
                return
            }
            if (this._orbit.isEnabled) {
                return
            }
            this._currentWalkingControls = this._phone
            ui.toggleVisibleButtonLock(true) 
            this._phone.enable()
        }) 

        // key O: disable/enable orbitControls
        const onKeyUp = (event: KeyboardEvent ) => {
            if (event.code === 'KeyO') {
                if (this._orbit.isEnabled) {
                    this._orbit.disable()
                    if (this._currentWalkingControls) this._currentWalkingControls.enable()

                    root.studio.addFog()
                } else {
                    if (this._currentWalkingControls) this._currentWalkingControls.disable()
                    this._orbit.enable()

                    root.studio.removeFog()
                }
            }
        }
        document.addEventListener('keyup', onKeyUp)

        root.keyboard.on('FORWARD', (is: boolean) => {
            this._changeForwardSpeedTo(is ? this._maxSpeedForward : 0) 
        })
        root.keyboard.on('BACKWARD', (is: boolean) => {
            this._changeForwardSpeedTo(is ? -this._maxSpeedForward : 0) 
        })
        root.keyboard.on('LEFT', (is: boolean) => {
            this._changeLeftSpeedTo(is ? this._maxSpeedLeft : 0) 
        })
        root.keyboard.on('RIGHT', (is: boolean) => {
            this._changeLeftSpeedTo(is ? -this._maxSpeedLeft : 0) 
        })

        let isCanJump = true
        if (controlsConf && controlsConf.isCanJump !== undefined) isCanJump = controlsConf.isCanJump
        if (isCanJump) {
            root.keyboard.on('JUMP', (is: boolean) => {
                if (is && root.phisics.isGround) {
                    this._root.phisics.playerBody.velocity.y += this._jumpSpeed
                }
            })
        }

        this._phone.on('FORWARD', (is) => {
            this._changeForwardSpeedTo(is ? this._maxSpeedForward : 0) 
        })
        this._phone.on('BACKWARD', (is) => {
            this._changeForwardSpeedTo(is ? -this._maxSpeedForward : 0) 
        })
    }


    update (delta: number) {
        this._orbit.update()

        if (!this._currentWalkingControls) {
            return;
        }

        if (this._isDisabled) {
            return
        }

        if (this._currentWalkingControls && !this._currentWalkingControls.isEnabled) {
            return
        }


        if (!this._root.phisics.isUpdate) { 
            return
        }

        //this._phone.update()


        const { camera } = this._root.studio
        const { playerBody } = this._root.phisics

        camera.position.x = playerBody.position.x
        camera.position.y = playerBody.position.y
        camera.position.z = playerBody.position.z


        this._objectDir.translateZ(this._currentSpeedForward * delta * .03)
        this._objectDir.translateX(this._currentSpeedLeft * delta * .03)


        playerBody.velocity.x = this._objectDir.position.x
        playerBody.velocity.y = this._objectDir.position.y
        playerBody.velocity.z = this._objectDir.position.z
        
        this._objectDir.position.set(0, 0, 0)
    }

    setFrontDirTopDir(forward: THREE.Vector3, top: THREE.Vector3) {
        this._objectDir.matrix.lookAt(new THREE.Vector3(), forward, top)
        this._objectDir.updateMatrix()
        this._objectDir.updateMatrixWorld()
        this._pointer.setDirMatrix(this._objectDir.matrix)
    }

    setRotation(x: number, y: number, z: number) {
        //this._pointer.setRotation(x, y, z)
        //this._phone.setRotation(y)
    }

    disable () {
        this._isDisabled = true
        this._currentWalkingControls = null
        this._pointer.disable()
        this._phone.disable()
        this._root.ui.toggleVisibleButtonLock(false) 
    }

    enable () {
        this._currentWalkingControls = this._root.deviceData.device === 'desktop' 
            ? this._pointer
            : this._phone
        this._currentWalkingControls.enable()    
        this._isDisabled = false
    }

    disableMove() {
        if (this._isMoveDisabled) {
            return;
        }
        this._isMoveDisabled = true
        this._changeForwardSpeedTo(0)
    }

    enableMove() {
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
}