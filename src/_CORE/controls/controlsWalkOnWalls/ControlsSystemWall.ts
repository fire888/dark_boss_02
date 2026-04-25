import * as THREE from 'three'
import { ControlsSystem } from "../ControlsSystem"
import { ControlsOrbit } from "../ControlsOrbit"
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { Core } from "../../types"
import { createMeshArrow } from 'geometry/arrow/arrow'
import * as TWEEN from '@tweenjs/tween.js'

const boxResultDir = new THREE.Mesh(
    new THREE.BoxGeometry(.05, .05, .05),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
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

        studio.add(boxResultDir)
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

        const { phisics } = this._root

        if (!phisics.isUpdate) { 
            return
        }

        this._updateCamera()

        // ОСНОВНОЙ
        // ставится позиция после апдейта физики
        this._zeroObject.position.set(
            phisics.playerBody.position.x,
            phisics.playerBody.position.y,
            phisics.playerBody.position.z
        )
        // зануляем контролсы и сдвигаем в сторону движения
        this._controlObj.position.set(0, 0, 0)
        this._contrPointer.moveForward(this._currentSpeedForward * 0.01)
        this._contrPointer.moveRight(this._currentSpeedLeft * 0.01)

        // Направление движения 
        // берется из новой мировой позиции контролсов минус текущее направление
        const vNewWorldPos = this._controlObj.getWorldPosition(new THREE.Vector3())
        const vDir = vNewWorldPos.clone().sub(this._zeroObject.position).normalize().multiplyScalar(.2)
        // Задаем направление для физики
        phisics.playerBody.velocity.x += vDir.x
        phisics.playerBody.velocity.y += vDir.y
        phisics.playerBody.velocity.z += vDir.z

        // чекаем есть ли впереди стенка на которую можно повернуть
        const vDirArrow = new THREE.Vector3(0, 0, 1)
        vDirArrow.applyQuaternion(this._arrow.quaternion)
        this._raycaster.set(this._arrow.position, vDirArrow.negate())
        const intersects = this._raycaster.intersectObjects(this._levelElems)
        if (intersects[0]) {
            const intercept = intersects[0]
            boxResultDir.position.copy(intercept.point)
            if (
                intercept.distance < .6 && 
                intercept.face && 
                !intercept.face.normal.equals(this._zeroObject.up)
            ) {
                // если пересечение со стенкой есть поворачиваем камеру на стенку
                this._isDisabled = true
                this._rotateToWall(vDirArrow, intercept).then(() => {
                    this._isDisabled = false
                })
            }
        }
    }

    addLevelElem(elem: THREE.Mesh) {
        this._levelElems.push(elem)
    }

    _updateCamera() {
        // СТРЕЛКА
        // поворот из контролсов мирового направления
        const wQ = new THREE.Quaternion()
        this._controlObj.getWorldQuaternion(wQ)
        this._arrow.quaternion.copy(wQ)
        // позиция позиция из контролсов мирового положения
        const vWorldPosControls = new THREE.Vector3()
        this._controlObj.getWorldPosition(vWorldPosControls)
        this._controlObj.position.set(0, 0, 0)
        this._arrow.position.copy(vWorldPosControls)

        // КАМЕРА
        const camera = this._root.studio.camera
        if (this._currentMode !== 'ORBIT') {
            camera.position.copy(this._arrow.position)
            camera.quaternion.copy(this._arrow.quaternion)
        }
    }

    async _rotateToWall(vDirArrow: THREE.Vector3, intercept: THREE.Intersection) {
        if (intercept && intercept.face) {
            const v3NewUp = intercept.face.normal.clone()
            const v3NewPos = intercept.point.clone()

            this._arrowFaceNormal.position.copy(intercept.point)
            this._arrowFaceNormal.lookAt(v3NewPos.clone().add(v3NewUp))

            // СТРЕЛКА2 (для проекции направления на полигоне)
            // ставится чуть выше обычной стрелки
            // чекается пересечение со стеной
            // из разности перевого и второго пересечения берется направление куда пользователь будет смотреть 
            this._arrow2.position.copy(this._arrow.position)
            this._arrow2.quaternion.copy(this._arrow.quaternion)
            this._arrow2.translateY(.1)
            this._raycaster.set(this._arrow2.position, vDirArrow)
            const intercepts2 = this._raycaster.intersectObjects(this._levelElems)
            if (intercepts2[0]) {
                const intercept2 = intercepts2[0]

                const vAddOverFace = v3NewUp.clone().multiplyScalar(.6)

                // чекаем куда смотреть на новом полигоне
                const dir = intercept.point.clone().sub(intercept2.point)
                const newLookAt = intercept.point.clone().add(dir).add(vAddOverFace)    

                this._arrowDirProj.position.copy(v3NewPos).add(vAddOverFace)
                this._arrowDirProj.lookAt(v3NewPos.clone().add(dir).add(vAddOverFace))

                // зануляем контролсы и ставим обьект в новую позицию
                this._zeroObject.position.copy(v3NewPos).add(vAddOverFace)
                this._controlObj.position.set(0, 0, 0)
                this._controlObj.rotation.set(0, 0, 0)

                const { phisics } = this._root
                phisics.setGravity(new THREE.Vector3(0, 0, 0))

                await this._alignToNewDirAnimate(newLookAt, v3NewUp.clone())
                
                phisics.setGravity(v3NewUp.clone().negate().multiplyScalar(9.82))
            }
        }
    }

    _alignToNewDirAnimate(vDirEnd: THREE.Vector3, vUpEnd: THREE.Vector3) {
        return new Promise((resolve) => {
            const vStartLookAt = new THREE.Vector3()
            this._arrow.getWorldDirection(vStartLookAt)
            vStartLookAt.negate().add(this._arrow.position)
            const vStartUp = this._zeroObject.up.clone()

            const TIME = 300

            const obj = { v: 0 }
            new TWEEN.Tween(obj)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .to({ v: 1 }, TIME)
                .onUpdate(() => {
                    const vUp = vStartUp.clone().lerp(vUpEnd, obj.v)
                    const vDir = vStartLookAt.clone().lerp(vDirEnd, obj.v)
                    this._zeroObject.up.copy(vUp)
                    this._zeroObject.lookAt(vDir)

                    this._updateCamera()
                })
                .onComplete(() => {
                    resolve(true)
                })
                .start()
        })
    }

}
