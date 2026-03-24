import {
    FORWARD, BACKWARD, LEFT, RIGHT, JUMP, E,
    T_Keys, T_Callbacks
} from './types'


export class Keyboard {
    isForward = false
    isBackward = false
    isLeft = false
    isRight = false
    isJump = false
    _callbacks: T_Callbacks = {}

    constructor () {
        document.addEventListener('keydown', this._onKeyDown.bind(this))
        document.addEventListener('keyup', this._onKeyUp.bind(this))
    }

    on (key: T_Keys, callback: (is: boolean) => void) {
        if (!this._callbacks[key]) this._callbacks[key] = []
        this._callbacks[key].push(callback)
        return () => {
            this._callbacks[key] = this._callbacks[key].filter(f => f !== callback)
        }
    }

    _onKeyDown (event: KeyboardEvent) {
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                this.isForward = true
                this._execCallbacks(FORWARD, true)
                break

            case 'ArrowDown':
            case 'KeyS':
                this.isBackward = true
                this._execCallbacks(BACKWARD, true)
                break    

            case 'ArrowLeft':
            case 'KeyA':
                this.isLeft = true
                this._execCallbacks(LEFT, true)
                break

            case 'ArrowRight':
            case 'KeyD':
                this.isRight = true
                this._execCallbacks(RIGHT, true)
                break

            case 'Space':
                this.isJump = true
                this._execCallbacks(JUMP, true)
                break

            case 'KeyE': 
                this._execCallbacks(E, true)    
        }
    }

    _onKeyUp (event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.isForward = false
                this._execCallbacks(FORWARD, false)
                break

            case 'ArrowDown':
            case 'KeyS':
                this.isBackward = false
                this._execCallbacks(BACKWARD, false)
                break    

            case 'ArrowLeft':
            case 'KeyA':
                this.isLeft = false
                this._execCallbacks(LEFT, false)
                break

            case 'ArrowRight':
            case 'KeyD':
                this.isRight = false
                this._execCallbacks(RIGHT, false)
                break

            case 'Space':
                this.isJump = false
                this._execCallbacks(JUMP, false)
                break
                        
            case 'KeyE': 
                this._execCallbacks(E, false)
                break
        }
    }

    _execCallbacks(key: T_Keys, is: boolean) {
        if (this._callbacks[key]) this._callbacks[key].forEach(cb => cb(is))
    }
}