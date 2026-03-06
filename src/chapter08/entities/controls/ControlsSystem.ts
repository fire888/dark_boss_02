import { ControlsOrbit } from "./ControlsOrbit"
import { ControlsPointer } from "./ControlsPointer"
import { ControlsPhone } from "./ControlsPhone"
import { Root } from "../../index"


export class ControlsSystem {
    _orbit: ControlsOrbit
    _pointer: ControlsPointer
    _phone: ControlsPhone
    _root: Root
    _currentWalkingControls: ControlsPointer | ControlsPhone | null
    _isDisabled = false

    init (root: Root) {
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
        this._currentWalkingControls.enable()

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
                ui.toggleVisibleLock(false) 
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
            ui.toggleVisibleLock(true) 
            this._phone.enable()
        }) 

        // key O: disable/enable orbitControls
        const onKeyUp = (event: KeyboardEvent ) => {
            if (event.code === 'KeyO') {
                if (this._orbit.isEnabled) {
                    //studio.scene.fog = studio.fog
                    this._orbit.disable()
                    this._currentWalkingControls.enable()
                } else {
                    //studio.scene.fog = null
                    this._currentWalkingControls.disable()
                    this._orbit.enable()
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

    disconnect () {
        if (this._orbit.isEnabled) {
            return
        }
        this._pointer.cameraDisconnect()
        this._phone.disable()
    }

    connect () {
        this._pointer.cameraConnect()
        if (this._phone.constructor.name === this._currentWalkingControls.constructor.name) {
            this._phone.enable()
        }
    }

    disable () {
        this._isDisabled = true
        const { ui } = this._root
        this._currentWalkingControls = null
        this._pointer.disable()
        this._phone.disable()
        ui.toggleVisibleLock(false) 
    }
}