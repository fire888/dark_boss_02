import * as THREE from 'three'
import { ControlsSystem } from "../ControlsSystem"
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { Core } from "../../types"

export class ControlsSystemWall extends ControlsSystem {
    dir1: THREE.Vector3
    dirUp: THREE.Vector3

    zeroObject: THREE.Object3D
    controlObj: THREE.Object3D

    _contrPointer: PointerLockControls 
    
    constructor() {
        super()

        this.dir1 = new THREE.Vector3(.5, .5, 0)
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
            console.log('lock') 
            this._contrPointer.lock()            
        }
        this._contrPointer.lock()
    }

    setDir1setDirUp(dir1: THREE.Vector3, dirUp: THREE.Vector3) {
        this.dir1.copy(dir1)
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
        this.zeroObject.lookAt(this.dir1)

        this._contrPointer.moveForward(this._currentSpeedForward * 0.01)
        this._contrPointer.moveRight(-this._currentSpeedLeft * 0.01)



        const wQ = new THREE.Quaternion()
        this.controlObj.getWorldQuaternion(wQ)
        camera.quaternion.copy(wQ)
        const p = new THREE.Vector3()
        this.controlObj.getWorldPosition(p)
        camera.position.copy(p)



        // const v3Result = new THREE.Vector3()
        
        // двигаем достаем плучившиеся направления из камеры и применяем движения клавиш
        // const dirForward = new THREE.Vector3()
        // camera.getWorldDirection(dirForward)
        // dirForward.setY(0).normalize()
        // const dirLeft = dirForward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5)

        //dirForward.x *= this._currentSpeedForward
        //dirForward.z *= this._currentSpeedForward
        //v3Result.add(dirForward)

        //if (this._currentWalkingControls.constructor.name === this._pointer.constructor.name) {
        //    dirLeft.x *= this._currentSpeedLeft
        //    dirLeft.z *= this._currentSpeedLeft
        //    v3Result.add(dirLeft)
        //}

        // // обновляем физику игрока направлениями
        // const { playerBody } = this._root.phisics
        // playerBody.velocity.x = v3Result.x
        // playerBody.velocity.z = v3Result.z

        // // применяем результат физики к позиции камеры
        // camera.position.x = playerBody.position.x
        // camera.position.y = playerBody.position.y
        // camera.position.z = playerBody.position.z

        // // camera debounce
        // this._timeRot += delta
        // // качаем камеру влево-вправо если есть скорость вперед
        // const walkingDebounce = Math.sin(this._timeRot * 0.015) * this._amplitudeLeftRightWalk * this._currentSpeedForward
        // // качаем медленно камеру если стоим 
        // const idleDebounceStrength = Math.sin(this._timeRot * 0.001) * 0.01
        // const idleDebounce = idleDebounceStrength * (1 - (Math.abs(this._currentSpeedForward) / this._maxSpeedForward))
        // // применяем оба качения
        // this._eulerRot.setFromQuaternion(camera.quaternion)
        // this._eulerRot.z = walkingDebounce + idleDebounce
        // camera.quaternion.setFromEuler(this._eulerRot)
    }

    // updateOld (delta: number) {
    //     this._orbit.update()

    //     if (this._isDisabled) {
    //         return
    //     }

    //     if (!this._currentWalkingControls.isEnabled) {
    //         return
    //     }

    //     this._phone.update()

    //     const camera = this._root.studio.camera

    //     if (!this._root.phisics.isUpdate) { 
    //         return
    //     }
    //     const v3Result = new THREE.Vector3()

    //     // двигаем достаем плучившиеся направления из камеры и применяем движения клавиш
    //     const dirForward = new THREE.Vector3()
    //     camera.getWorldDirection(dirForward)
    //     dirForward.setY(0).normalize()
    //     const dirLeft = dirForward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5)

    //     dirForward.x *= this._currentSpeedForward
    //     dirForward.z *= this._currentSpeedForward
    //     v3Result.add(dirForward)

    //     if (this._currentWalkingControls.constructor.name === this._pointer.constructor.name) {
    //         dirLeft.x *= this._currentSpeedLeft
    //         dirLeft.z *= this._currentSpeedLeft
    //         v3Result.add(dirLeft)
    //     }

    //     // обновляем физику игрока направлениями
    //     const { playerBody } = this._root.phisics
    //     playerBody.velocity.x = v3Result.x
    //     playerBody.velocity.z = v3Result.z

    //     // применяем результат физики к позиции камеры
    //     camera.position.x = playerBody.position.x
    //     camera.position.y = playerBody.position.y
    //     camera.position.z = playerBody.position.z

    //     // camera debounce
    //     this._timeRot += delta
    //     // качаем камеру влево-вправо если есть скорость вперед
    //     const walkingDebounce = Math.sin(this._timeRot * 0.015) * this._amplitudeLeftRightWalk * this._currentSpeedForward
    //     // качаем медленно камеру если стоим 
    //     const idleDebounceStrength = Math.sin(this._timeRot * 0.001) * 0.01
    //     const idleDebounce = idleDebounceStrength * (1 - (Math.abs(this._currentSpeedForward) / this._maxSpeedForward))
    //     // применяем оба качения
    //     this._eulerRot.setFromQuaternion(camera.quaternion)
    //     this._eulerRot.z = walkingDebounce + idleDebounce
    //     camera.quaternion.setFromEuler(this._eulerRot)
    // }
}
