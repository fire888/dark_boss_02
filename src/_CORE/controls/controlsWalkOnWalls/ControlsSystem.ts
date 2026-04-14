import * as THREE from 'three'
import { ControlsSystem } from "../ControlsSystem"
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { Core } from "../../types"

const box = new THREE.Mesh(
    new THREE.BoxGeometry(.3, .3, .3),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
)

export class ControlsSystemWall extends ControlsSystem {
    dir: THREE.Vector3
    dirUp: THREE.Vector3

    zeroObject: THREE.Object3D
    controlObj: THREE.Object3D

    _contrPointer: PointerLockControls 
    _levelElems: THREE.Mesh[] = []
    _raycaster = new THREE.Raycaster()
    
    
    constructor() {
        super()

        this.dir = new THREE.Vector3(.5, .5, 0)
        this.dirUp = new THREE.Vector3(0, .5, .5)

        this.zeroObject = new THREE.Object3D()
        this.controlObj = new THREE.Object3D()
        this.zeroObject.add(this.controlObj)

        // @ts-ignore
        this._contrPointer = new PointerLockControls(this.controlObj, document.body)
    }

    init (root: Core, IS_DEV_START_ORBIT = false) {
        this._root = root
        const { ui } = root   

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
        
        ui.lockButton.onclick = () => {
            this._contrPointer.lock()            
        }
        this._contrPointer.lock()

        root.studio.add(box)
    }

    setDir1setDirUp(dir1: THREE.Vector3, dirUp: THREE.Vector3) {
        this.dir.copy(dir1)
        this.dirUp.copy(dirUp)
    }

    update(delta: number, ) {
        //this._orbit.update()

        if (this._isDisabled) {
            return
        }

        // if (!this._currentWalkingControls.isEnabled) {
        //     return
        // }

        //this._phone.update()

        const camera = this._root.studio.camera

        if (!this._root.phisics.isUpdate) { 
            return
        }

        this.zeroObject.up.copy(this.dirUp)
        this.zeroObject.lookAt(this.dir)

        this._contrPointer.moveForward(this._currentSpeedForward * 0.01)
        this._contrPointer.moveRight(-this._currentSpeedLeft * 0.01)

        const wQ = new THREE.Quaternion()
        this.controlObj.getWorldQuaternion(wQ)
        camera.quaternion.copy(wQ)
        const wDir = new THREE.Vector3(0, 0, 1)
        wDir.applyQuaternion(camera.quaternion)

        const p = new THREE.Vector3()
        this.controlObj.getWorldPosition(p)
        camera.position.copy(p)

        this._raycaster.set(camera.position, wDir.negate())
        const intersects = this._raycaster.intersectObjects(this._levelElems)
        if (intersects[0] && intersects[0].distance) {
            const int = intersects[0]
            box.position.copy(int.point)
            console.log(int)
        }
    }

    addLevelElem(elem: THREE.Mesh) {
        this._levelElems.push(elem)
    }

}
