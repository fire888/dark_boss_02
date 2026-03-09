import * as THREE from 'three'
import { Tween, Interpolation } from '@tweenjs/tween.js'
import { Core } from '_CORE/types'
import { Body } from 'cannon-es'
import { _M } from '_CORE/_M/_m'

import {
    FORWARD, BACKWARD, LEFT, RIGHT, JUMP,
    T_Keys, T_Callbacks
} from '../types'

export class ControlsPhone {
    isEnabled = false

    _isLeft = false
    _isRight = false
    _isEnabled = false

    _currentSpeedLeft = 0.
    _maxSpeedLeft = .035
    _tweenSpeedLeft: Tween<any> | null = null

    _vecRotMovie = new THREE.Vector3(0, 0, 0)
    _root: Core
    _obj: THREE.Object3D

    _callbacks: T_Callbacks = {}

    init(root: Core) {
        this._root = root
        const { ui, keyboard } = this._root

        ui.moveForwardDiv.addEventListener("pointerdown", () => { 
            this._execCallbacks(FORWARD, true)
        })
        ui.moveForwardDiv.addEventListener("pointerup", () => {
            this._execCallbacks(FORWARD, false)
        })
        ui.moveForwardDiv.addEventListener("pointerout", () => {
            this._execCallbacks(FORWARD, false)
        })

        ui.moveBackDiv.addEventListener("pointerdown", () => { 
            this._execCallbacks(BACKWARD, true)
        })
        ui.moveBackDiv.addEventListener("pointerup", () => {
            this._execCallbacks(BACKWARD, false)
        })
        ui.moveBackDiv.addEventListener("pointerout", () => {
            this._execCallbacks(BACKWARD, false)
        })


        const execLeft = (is: boolean) => {
            if (is) {
                this._execCallbacks(LEFT, true)
                if (!this._isLeft) this._changeLeftSpeedTo(this._maxSpeedLeft)
                this._isLeft = true
            } else {
                this._execCallbacks(LEFT, false)
                if (this._isLeft) this._changeLeftSpeedTo(0)
                this._isLeft = false
            }
        }

        keyboard.on('LEFT', execLeft)
        ui.moveLeftDiv.addEventListener("pointerdown", () => { execLeft(true) })
        ui.moveLeftDiv.addEventListener("pointerup", () => { execLeft(false) })
        ui.moveLeftDiv.addEventListener("pointerout", () => { execLeft(false) })

        const execRight = (is: boolean) => {
            if (is) {
                this._execCallbacks(RIGHT, true)
                if (!this._isRight) this._changeLeftSpeedTo(-this._maxSpeedLeft)
                this._isRight = true
            } else {
                this._execCallbacks(RIGHT, false)
                if (this._isRight) this._changeLeftSpeedTo(0)
                this._isRight = false
            }
        }

        keyboard.on('RIGHT', execRight)
        ui.moveRightDiv.addEventListener("pointerdown", () => { execRight(true) })
        ui.moveRightDiv.addEventListener("pointerup", () => { execRight(false) })
        ui.moveRightDiv.addEventListener("pointerout", () => { execRight(false) })

        this._obj = new THREE.Object3D()
        const rotY = _M.getAngleDirY(this._root.studio.camera) + Math.PI
        this._obj.rotation.y = rotY
    }

    setRotation(y: number) {
        this._obj.rotation.y = y
    }

    update() {
        if (!this.isEnabled) {
            return
        }
        this._obj.position.x = 0
        this._obj.position.z = 0
        this._obj.rotation.y += this._currentSpeedLeft

        this._root.studio.camera.quaternion.x = this._obj.quaternion.x
        this._root.studio.camera.quaternion.y = this._obj.quaternion.y
        this._root.studio.camera.quaternion.z = this._obj.quaternion.z
        this._root.studio.camera.quaternion.w = this._obj.quaternion.w
    }

    enable() {
        const { ui } = this._root
        ui.moveForwardDiv.style.display = 'block'
        ui.moveBackDiv.style.display = 'block'
        ui.moveLeftDiv.style.display = 'block'
        ui.moveRightDiv.style.display = 'block'

        this._obj.rotation.x = 0
        this._obj.rotation.z = 0
        const rotY = _M.getAngleDirY(this._root.studio.camera) + Math.PI
        this._obj.rotation.y = rotY

        this._currentSpeedLeft = 0

        this.isEnabled = true
    }

    disable() {
        const { ui } = this._root
        ui.moveForwardDiv.style.display = 'none'
        ui.moveBackDiv.style.display = 'none'
        ui.moveLeftDiv.style.display = 'none'
        ui.moveRightDiv.style.display = 'none'

        this.isEnabled = false
    }

    on(key: string, callback: (is: boolean) => void) {
        if (!this._callbacks[key]) this._callbacks[key] = []
        this._callbacks[key].push(callback)
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

    _execCallbacks(key: string, is: boolean) {
        if (this._callbacks[key]) this._callbacks[key].forEach(cb => cb(is))
    }
}
