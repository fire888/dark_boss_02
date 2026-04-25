import * as THREE from 'three'
import { ControlsSystem } from "../ControlsSystem"
import { ControlsOrbit } from "../ControlsOrbit"
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { Core } from "../../types"
import { createMeshArrow } from 'geometry/arrow/arrow'
import * as TWEEN from '@tweenjs/tween.js'

const box = new THREE.Mesh(
    new THREE.BoxGeometry(.05, .05, .05),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
)

const box2 = new THREE.Mesh(
    new THREE.BoxGeometry(.05, .05, .05),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
)

export class ControlsSystemWall extends ControlsSystem {
    _arrow: THREE.Mesh
    _arrow2: THREE.Mesh
    _arrowFaceNormal: THREE.Mesh
    _arrowDirProj: THREE.Mesh
    _gridHelper = new THREE.GridHelper(10, 10, 0x0000ff, 0xeeeeee)


    _zeroObject: THREE.Object3D
    _controlObj: THREE.Object3D

    _contrPointer: PointerLockControls
    _contrilsOrbit: ControlsOrbit | null = null
    _levelElems: THREE.Mesh[] = []
    _raycaster = new THREE.Raycaster()
    _currentMode: string = 'NONE' 
    
    _isUpdate = true
    
    constructor() {
        super()

        this._arrow = createMeshArrow()
        this._arrow.scale.set(.4, .1, -.1)
        this._arrow.position.set(0, 0, 0)
        this._arrow.rotation.set(0, 0, 0)

        this._arrow2 = createMeshArrow({ color: new THREE.Color().setRGB(1, 1, 1) })
        this._arrow2.scale.set(.4, .1, -.1)

        this._arrowFaceNormal = createMeshArrow({ color: new THREE.Color().setRGB(0, 1, 0) })
        this._arrowFaceNormal.scale.set(.2, .1, .1)
        
        this._arrowDirProj = createMeshArrow({ color: new THREE.Color().setRGB(1, 1, 0) })
        this._arrowDirProj.scale.set(.2, .1, -.1)


        //this.vLookAt = new THREE.Vector3(0, 0, -1)
        //this.dirUp = new THREE.Vector3(0, 1, 0)

        this._zeroObject = new THREE.Object3D()
        this._zeroObject.up.set(0, 1, 0)
        this._zeroObject.lookAt(0, 0, -1)
        this._controlObj = new THREE.Object3D()
        this._zeroObject.add(this._controlObj)
        
        // @ts-ignore
        this._contrPointer = new PointerLockControls(this._controlObj, document.body)
        this._contrilsOrbit = new ControlsOrbit()
    }

    init (root: Core, IS_DEV_START_ORBIT = false) {
        this._root = root
        const { ui, studio } = root

        root.keyboard.on('FORWARD', (is: boolean) => {
            this._currentSpeedForward = is ? this._maxSpeedForward : 0
            //this._changeForwardSpeedTo(is ? this._maxSpeedForward : 0)
        })
        root.keyboard.on('BACKWARD', (is: boolean) => {
            this._currentSpeedForward = is ? -this._maxSpeedForward : 0
            //this._changeForwardSpeedTo(is ? -this._maxSpeedForward : 0)
        })
        root.keyboard.on('LEFT', (is: boolean) => {
            this._currentSpeedLeft = is ? -this._maxSpeedLeft : 0
            //this._changeLeftSpeedTo(is ? this._maxSpeedLeft : 0)
        })
        root.keyboard.on('RIGHT', (is: boolean) => {
            this._currentSpeedLeft = is ? this._maxSpeedLeft : 0
            //this._changeLeftSpeedTo(is ? -this._maxSpeedLeft : 0)
        })
        
        ui.lockButton.onclick = () => {
            this._contrPointer.lock()
        }

        this._contrilsOrbit?.init(root.studio.camera, root.studio.containerDom)
        this._contrilsOrbit?.enable()

        studio.add(box)
        studio.add(this._arrow)
        studio.add(this._arrow2)
        this._zeroObject.add(this._gridHelper)
        studio.add(this._zeroObject)
        studio.add(this._arrowFaceNormal)
        studio.add(this._arrowDirProj)

        this.switchMode('POINTER')
        //this.switchMode('ORBIT')
    }

    switchMode(mode: string) {
        const { studio } = this._root

        if (mode === 'ORBIT') {
            if (this._currentMode !== 'ORBIT') {
                this._contrilsOrbit?.enable()

                const vPos = new THREE.Vector3().copy(studio.camera.position)
                const offset = new THREE.Vector3(0, 5, 15)
                studio.camera.position.add(offset)
                studio.camera.lookAt(vPos)

                this._contrilsOrbit?.update()

                this._currentMode = 'ORBIT'
            }
        }

        if (mode === 'POINTER') {
            if (this._currentMode !== 'POINTER') { 
                if (this._currentMode === 'ORBIT') {
                    this._contrilsOrbit?.disable()
                    const camPos = this._arrow.position.clone()
                    studio.camera.position.copy(camPos)
                    const q = this._arrow.quaternion.clone()
                    studio.camera.quaternion.copy(q)
                }

                this._contrPointer.lock()
                this._currentMode = 'POINTER'
            }
        }

    }

    update(delta: number, ) {
        if (this._isDisabled) {
            return
        }

        if (!this._root.phisics.isUpdate) { 
            return
        }

        const { phisics } = this._root

        // ОСНОВНОЙ  
        // выравнивается относительн полигона
        //this.zeroObject.up.copy(this.dirUp)
        //this.zeroObject.lookAt(this.vLookAt)
        // ставится позиция после апдейта физики
        this._zeroObject.position.set(
            phisics.playerBody.position.x,
            phisics.playerBody.position.y,
            phisics.playerBody.position.z
        )

        // СТРЕЛКА
        // поворот из контролсов
        const wQ = new THREE.Quaternion()
        this._controlObj.getWorldQuaternion(wQ)
        this._arrow.quaternion.copy(wQ)
        // позиция позиция из контролсов
        const vWorldPosControls = new THREE.Vector3()
        this._controlObj.getWorldPosition(vWorldPosControls)
        this._controlObj.position.set(0, 0, 0)
        this._arrow.position.copy(vWorldPosControls)

        // Направление движения 
        // берется из новой позиции контролсов минус текущее направление
        const vDir = vWorldPosControls.clone().sub(this._zeroObject.position).normalize().multiplyScalar(.2)
        // Задаем направление для физики
        phisics.playerBody.velocity.x += vDir.x
        phisics.playerBody.velocity.y += vDir.y
        phisics.playerBody.velocity.z += vDir.z

        // СТРЕЛКА2 (для проекции направления на полигоне)
        // ставится чуть выше обычной стрелки
        this._arrow2.position.copy(this._arrow.position)
        this._arrow2.quaternion.copy(this._arrow.quaternion)
        this._arrow2.translateY(.1)

        const wDir = new THREE.Vector3(0, 0, 1)
        wDir.applyQuaternion(this._arrow.quaternion)
        this._raycaster.set(this._arrow.position, wDir.negate())
        const intersects = this._raycaster.intersectObjects(this._levelElems)
        if (intersects[0]) {
            const intercept = intersects[0]
            box.position.copy(intercept.point)
            if (intercept.distance < .6 && intercept.face && !intercept.face.normal.equals(this._zeroObject.up)) {
                this._arrowFaceNormal.position.copy(intercept.point)
                this._arrowFaceNormal.lookAt(intercept.point.clone().add(intercept.face.normal))
                
                this._raycaster.set(this._arrow2.position, wDir)
                const intercepts2 = this._raycaster.intersectObjects(this._levelElems)
                if (intercepts2[0]) {
                    const intercept2 = intercepts2[0]

                    const vAddOverFace = intercept.face.normal.clone().multiplyScalar(.6)

                    const dir = intercept.point.clone().sub(intercept2.point)
                    const newLookAt = intercept.point.clone().add(dir).add(vAddOverFace)    

                    this._arrowDirProj.position.copy(intercept.point).add(vAddOverFace)
                    this._arrowDirProj.lookAt(intercept.point.clone().add(dir).add(vAddOverFace))

                    this._zeroObject.position.copy(intercept.point).add(vAddOverFace)
                                        
                    this._controlObj.position.set(0, 0, 0)
                    this._controlObj.rotation.set(0, 0, 0)

                    phisics.setGravity(new THREE.Vector3(0, 0, 0))

                    this._alignToNewDirAnimate(newLookAt, intercept.face.normal.clone())
                }
            }
        }

        const camera = this._root.studio.camera
        if (this._currentMode !== 'ORBIT') {
            camera.position.copy(this._arrow.position)
            camera.quaternion.copy(this._arrow.quaternion)
        }
        if (this._currentMode === 'POINTER') {
            this._contrPointer.moveForward(this._currentSpeedForward * 0.01)
            this._contrPointer.moveRight(-this._currentSpeedLeft * 0.01)
        }
    }

    addLevelElem(elem: THREE.Mesh) {
        this._levelElems.push(elem)
    }

    _alignToNewDirAnimate(vDirEnd: THREE.Vector3, vUpEnd: THREE.Vector3) {
        console.log('_alignToNewDirAnimate')
        
        const { studio, phisics } = this._root
        
        //this._isDisabled = true

        this._zeroObject.up.copy(vUpEnd)
        this._zeroObject.lookAt(vDirEnd)
        phisics.setGravity(vUpEnd.clone().negate().multiplyScalar(9.82))


        //const TIME = 1000


        //const neqQuaternion = 

        
        // const obj = { v: 0 }
        // new TWEEN.Tween(obj)
        //     .easing(TWEEN.Easing.Linear.In)
        //     .to({ v: 1 }, TIME)
        //     .onUpdate(() => {
        //         const vDir = vDirStart.clone().lerp(vDirEnd, obj.v)
        //         this.vLookAt.copy(vDir)
        //         this.zeroObject.lookAt(this.vLookAt)
        //         const vUp = vUpStart.clone().lerp(vUpEnd, obj.v)
        //         this.dirUp.copy(vUp)
        //         this.zeroObject.up.copy(this.dirUp)


        //         // СТРЕЛКА
        //         // поворот из контролсов
        //         const wQ = new THREE.Quaternion()
        //         this.controlObj.getWorldQuaternion(wQ)
        //         this._arrow.quaternion.copy(wQ)
        //         // позиция позиция из контролсов
        //         const vPosControls = new THREE.Vector3()
        //         this.controlObj.getWorldPosition(vPosControls)
        //         this.controlObj.position.set(0, 0, 0)
        //         this.controlObj.rotation.set(0, 0, 0)
        //         this._arrow.position.copy(vPosControls)


        //         if (this._currentMode !== 'ORBIT') {
        //             studio.camera.position.copy(this._arrow.position)
        //             studio.camera.quaternion.copy(this._arrow.quaternion)
        //         }
        //     })
        //     .onComplete(() => {
        //         this._isDisabled = false
        //         const vGraviti = vUpEnd.clone().multiplyScalar(9.81).negate()
        //         phisics.setGravity(vGraviti)
        //         //phisics.playerBody.quaternion
        //     })
        //     .start()
        

    }

}
