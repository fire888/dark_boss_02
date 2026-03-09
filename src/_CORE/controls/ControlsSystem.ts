import { ControlsOrbit } from "./ControlsOrbit"
import { ControlsPointer } from "./ControlsPointer"
import { ControlsPhone } from "./ControlsPhone"
import { Core } from "../types"
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

    _currentSpeedForward = 0.
    _maxSpeedForward = 5.
    _tweenSpeedForward: Tween<any> | null = null

    _currentSpeedLeft = 0.
    _maxSpeedLeft = 5.
    _tweenSpeedLeft: Tween<any> | null = null

    _timeRot = 0 
    _eulerRot = new THREE.Euler(0, 0, 0, 'YXZ')
    _strengthIdle = 1
    
    init (root: Core, isStartOrbit: boolean) {
        this._root = root
    
        const { 
            deviceData, 
            ui,
            studio,
        } = root

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
                    this._currentWalkingControls.enable()

                    root.studio.addFog()
                } else {
                    this._currentWalkingControls.disable()
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

        root.keyboard.on('JUMP', (is: boolean) => {
            if (is && root.phisics.isGround) {
                this._root.phisics.playerBody.velocity.y += 6
            }
        })

        this._phone.on('FORWARD', (is) => {
            this._changeForwardSpeedTo(is ? this._maxSpeedForward : 0) 
        })
        this._phone.on('BACKWARD', (is) => {
            this._changeForwardSpeedTo(is ? -this._maxSpeedForward : 0) 
        })
    }


    update (delta: number) {
        this._orbit.update()

        if (this._isDisabled) {
            return
        }

        if (!this._currentWalkingControls.isEnabled) {
            return
        }

        this._phone.update()

        const camera = this._root.studio.camera

        if (!this._root.phisics.isUpdate) { 
            return
        }
        const v3Result = new THREE.Vector3()

        // двигаем достаем плучившиеся направления из камеры и применяем движения клавиш
        const dirForward = new THREE.Vector3()
        camera.getWorldDirection(dirForward)
        dirForward.setY(0).normalize()
        const dirLeft = dirForward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5)

        dirForward.x *= this._currentSpeedForward
        dirForward.z *= this._currentSpeedForward
        v3Result.add(dirForward)

        if (this._currentWalkingControls.constructor.name === this._pointer.constructor.name) {
            dirLeft.x *= this._currentSpeedLeft
            dirLeft.z *= this._currentSpeedLeft
            v3Result.add(dirLeft)
        }

        // обновляем физику игрока направлениями
        const { playerBody } = this._root.phisics
        playerBody.velocity.x = v3Result.x
        playerBody.velocity.z = v3Result.z

        // применяем результат физики к позиции камеры
        camera.position.x = playerBody.position.x
        camera.position.y = playerBody.position.y
        camera.position.z = playerBody.position.z

        // camera debounce
        this._timeRot += delta
        // качаем камеру влево-вправо если есть скорость вперед
        const walkingDebounce = Math.sin(this._timeRot * 0.015) * 0.002 * this._currentSpeedForward
        // качаем медленно камеру если стоим 
        const idleDebounceStrength = Math.sin(this._timeRot * 0.001) * 0.01
        const idleDebounce = idleDebounceStrength * (1 - (Math.abs(this._currentSpeedForward) / this._maxSpeedForward))
        // применяем оба качения
        this._eulerRot.setFromQuaternion(camera.quaternion)
        this._eulerRot.z = walkingDebounce + idleDebounce
        camera.quaternion.setFromEuler(this._eulerRot)
    }

    setRotation(x: number, y: number, z: number) {
        this._pointer.setRotation(x, y, z)
        this._phone.setRotation(y)
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