import * as THREE from 'three'
import { Tween, Interpolation } from '@tweenjs/tween.js'
import { Root } from 'chapter10'
import { Body } from 'cannon-es'
import { _M } from '_CORE/_M/_m'

export class ControlsPhone {
    _isForward = false
    _isBack = false
    _isLeft = false
    _isRight = false
    _isJumping = false
    _isEnabled = false

    _isDisabledMovie = false

    _currentSpeedForward = 0.
    _maxSpeedForward = 5.
    _tweenSpeedForward: Tween<any> | null = null

    _currentSpeedLeft = 0.
    _maxSpeedLeft = .035
    _tweenSpeedLeft: Tween<any> | null = null

    _vecRotMovie = new THREE.Vector3(0, 0, 0)
    _strengthIdle = 0.
    _timeRot = 0

    _root: Root
    _moveForwardDiv: HTMLElement
    _moveBackDiv: HTMLElement
    _moveLeftDiv: HTMLElement
    _moveRightDiv: HTMLElement
    _obj: THREE.Object3D

    init(root: Root) {
        this._root = root

        this._moveForwardDiv = document.createElement('div')
        this._moveForwardDiv.classList.add('control')
        this._moveForwardDiv.classList.add('butt-front')
        this._moveForwardDiv.addEventListener("pointerdown", () => {
            if (this._isDisabledMovie) {
                return
            }
            if (!this._isForward) this._changeForwardSpeedTo(-this._maxSpeedForward)
            this._isForward = true
        })
        this._moveForwardDiv.addEventListener("pointerup", () => {
            if (this._isForward) this._changeForwardSpeedTo(0.)
            this._isForward = false
        })
        this._moveForwardDiv.addEventListener("pointerout", () => {
            if (this._isForward) this._changeForwardSpeedTo(0.)
            this._isForward = false
        })
        document.body.appendChild(this._moveForwardDiv)

        this._moveBackDiv = document.createElement('div')
        this._moveBackDiv.classList.add('control')
        this._moveBackDiv.classList.add('butt-back')
        this._moveBackDiv.addEventListener("pointerdown", () => {
            if (this._isDisabledMovie) {
                return
            }
            if (!this._isBack) this._changeForwardSpeedTo(this._maxSpeedForward)
            this._isBack = true
        })
        this._moveBackDiv.addEventListener("pointerup", () => {
            if (this._isBack) this._changeForwardSpeedTo(0.)
            this._isBack = false
        })
        this._moveBackDiv.addEventListener("pointerout", () => {
            if (this._isBack) this._changeForwardSpeedTo(0.)
            this._isBack = false
        })
        document.body.appendChild(this._moveBackDiv)

        this._moveLeftDiv = document.createElement('div')
        this._moveLeftDiv.classList.add('control')
        this._moveLeftDiv.classList.add('butt-left')
        this._moveLeftDiv.addEventListener("pointerdown", () => {
            if (!this._isLeft) this._changeLeftSpeedTo(this._maxSpeedLeft)
            this._isLeft = true
        })
        this._moveLeftDiv.addEventListener("pointerup", () => {
            if (this._isLeft) this._changeLeftSpeedTo(0.)
            this._isLeft = false
        })
        this._moveLeftDiv.addEventListener("pointerout", () => {
            if (this._isLeft) this._changeLeftSpeedTo(0.)
            this._isLeft = false
        })
        document.body.appendChild(this._moveLeftDiv)

        this._moveRightDiv = document.createElement('div')
        this._moveRightDiv.classList.add('control')
        this._moveRightDiv.classList.add('butt-right')
        this._moveRightDiv.addEventListener("pointerdown", () => {
            if (!this._isRight) this._changeLeftSpeedTo(-this._maxSpeedLeft)
            this._isRight = true
        })
        this._moveRightDiv.addEventListener("pointerup", () => {
            if (this._isRight) this._changeLeftSpeedTo(0.)
            this._isRight = false
        })
        this._moveRightDiv.addEventListener("pointerout", () => {
            if (this._isRight) this._changeLeftSpeedTo(0.)
            this._isRight = false
        })
        document.body.appendChild(this._moveRightDiv)

        this._moveForwardDiv.style.display = 'none'
        this._moveBackDiv.style.display = 'none'
        this._moveLeftDiv.style.display = 'none'
        this._moveRightDiv.style.display = 'none'

        window.addEventListener('keydown', this._onKeyDown.bind(this))
        window.addEventListener('keyup', this._onKeyUp.bind(this))


        this._obj = new THREE.Object3D()
        const rotY = _M.getAngleDirY(this._root.studio.camera) + Math.PI
        this._obj.rotation.y = rotY
    }

    update(delta: number, playerBody: Body) {
        if (!this._isEnabled) {
            return
        }
        this._obj.position.x = 0
        this._obj.position.z = 0
        this._obj.rotation.y += this._currentSpeedLeft

        if (!this._isDisabledMovie) {
            this._obj.translateZ(this._currentSpeedForward)
            playerBody.velocity.x = this._obj.position.x
            playerBody.velocity.z = this._obj.position.z

            if (this._isJumping)  { 
                this._isJumping = false 
                if (this._root.phisics.isGround) playerBody.velocity.y += 6
            }
        }

        this._root.studio.camera.position.x = playerBody.position.x
        this._root.studio.camera.position.y = playerBody.position.y
        this._root.studio.camera.position.z = playerBody.position.z

        this._root.studio.camera.quaternion.x = this._obj.quaternion.x
        this._root.studio.camera.quaternion.y = this._obj.quaternion.y
        this._root.studio.camera.quaternion.z = this._obj.quaternion.z
        this._root.studio.camera.quaternion.w = this._obj.quaternion.w

        const summSpeed = Math.abs(this._currentSpeedLeft) + Math.abs(this._currentSpeedForward)
        this._timeRot += delta
        this._vecRotMovie.x = Math.sin(this._timeRot * 0.02) * .0005 * summSpeed * this._strengthIdle
        this._vecRotMovie.z = Math.sin(this._timeRot * 0.02) * .0005 * summSpeed * this._strengthIdle
        this._vecRotMovie.y = Math.sin(this._timeRot * 0.02) * .0005 * summSpeed * this._strengthIdle
        this._vecRotMovie.x += Math.sin(this._timeRot * 0.001) * .01 * this._strengthIdle
        this._vecRotMovie.z += Math.sin(this._timeRot * 0.0005) * .01 * this._strengthIdle
        this._vecRotMovie.y += Math.sin(this._timeRot * 0.0007) * .01 * this._strengthIdle

        this._root.studio.camera.rotation.x += this._vecRotMovie.x
        this._root.studio.camera.rotation.y += this._vecRotMovie.y
        this._root.studio.camera.rotation.z += this._vecRotMovie.z
    }

    enable() {
        this._moveForwardDiv.style.display = 'block'
        this._moveBackDiv.style.display = 'block'
        this._moveLeftDiv.style.display = 'block'
        this._moveRightDiv.style.display = 'block'

        this._obj.rotation.x = 0
        this._obj.rotation.z = 0
        const rotY = _M.getAngleDirY(this._root.studio.camera) + Math.PI
        this._obj.rotation.y = rotY

        this._currentSpeedLeft = 0
        this._timeRot = 1

        const obj = { v: 0 }
        new Tween(obj)
            .interpolation(Interpolation.Linear)
            .to({ v: 1 }, 1000)
            .onUpdate(() => {
                this._strengthIdle = obj.v
            })
            .start()

        this._isEnabled = true
    }

    disable() {
        this._moveForwardDiv.style.display = 'none'
        this._moveBackDiv.style.display = 'none'
        this._moveLeftDiv.style.display = 'none'
        this._moveRightDiv.style.display = 'none'

        this._isEnabled = false
    }

    disableMove() {
        this._isDisabledMovie = true
    }

    enableMove() {
        this._isDisabledMovie = false
    }

    _onKeyUp(event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (this._isForward) this._changeForwardSpeedTo(0.)
                this._isForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                if (this._isLeft) this._changeLeftSpeedTo(0.)
                this._isLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                if (this._isBack) this._changeForwardSpeedTo(0.)
                this._isBack = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                if (this._isRight) this._changeLeftSpeedTo(0.)
                this._isRight = false;
                break;
            
            case 'Space':
                this._isJumping = false
                break    
        }
    }

    _onKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (!this._isForward) this._changeForwardSpeedTo(-this._maxSpeedForward)
                this._isForward = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                if (!this._isBack) this._changeForwardSpeedTo(this._maxSpeedForward)
                this._isBack = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                if (!this._isLeft) this._changeLeftSpeedTo(this._maxSpeedLeft)
                this._isLeft = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                if (!this._isRight) this._changeLeftSpeedTo(-this._maxSpeedLeft)
                this._isRight = true;
                break;

            case 'Space':
                this._isJumping = true
                break    
        }
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
