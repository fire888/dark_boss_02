import { ControlsOrbit } from "./ControlsOrbit"
import { ControlsPointer } from "./ControlsPointer"
import { ControlsPhone } from "./ControlsPhone"
import { Root } from "index"

export class ControlsSystem {
    _orbit: ControlsOrbit
    _pointer: ControlsPointer
    _phone: ControlsPhone
    _root: Root
    _currentWalkingControls: ControlsPointer | ControlsPhone | null
    _isDisabled = false
    
    init (root: Root, isStartOrbit: boolean) {
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
            ui.toggleVisibleButtonLock(true) 
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
    }

    update (delta: number) {
        this._orbit.update()
        this._pointer.update(delta, this._root.phisics.playerBody)
        this._phone.update(delta, this._root.phisics.playerBody)
    }

    disableRotation () {
        if (this._orbit.isEnabled) {
            return
        }
        this._pointer.mouseDisable()
        this._phone.disable()
    }

    enableRotation () {
        if (this._phone.constructor.name === this._currentWalkingControls.constructor.name) {
            this._phone.enable()
        }
        if (this._pointer.constructor.name === this._currentWalkingControls.constructor.name) {
            this._pointer.mouseEnable()
        }
    }

    disable () {
        this._isDisabled = true
        const { ui } = this._root
        this._currentWalkingControls = null
        this._pointer.disable()
        this._phone.disable()
        ui.toggleVisibleButtonLock(false) 
    }

    disableMove() {
        this._pointer.disableMove()
        this._phone.disableMove()
    }

    enableMove() {
        this._pointer.enableMove()
        this._phone.enableMove()
        if (this._currentWalkingControls.constructor.name === this._phone.constructor.name) { 
            this._phone.enable() 
        }
    }
}