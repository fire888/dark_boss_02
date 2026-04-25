import * as THREE from 'three'
import { ControlsSystem } from "../ControlsSystem"
import { ControlsOrbit } from "../ControlsOrbit"
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { Core } from "../../types"
import { createMeshArrow } from 'geometry/arrow/arrow'
import * as TWEEN from '@tweenjs/tween.js'
import { _M } from '_CORE/_M/_m'

const boxResultDir = new THREE.Mesh(
    new THREE.BoxGeometry(.05, .05, .05),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
)

export class ControlsSystemWall extends ControlsSystem {
    _arrow: THREE.Mesh
    _arrowX0: THREE.Mesh
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

        this._arrowX0 = createMeshArrow({ color: new THREE.Color().setRGB(1, 0, 0) })
        this._arrowX0.scale.set(.4, .1, -.1)
        this._zeroObject.add(this._arrowX0)
        
        // @ts-ignore
        this._contrPointer = new PointerLockControls(this._controlObj, document.body)
        this._contrPointer.addEventListener('unlock', () => {
            this.switchMode('PHONE')
        })
        this._contrilsOrbit = new ControlsOrbit()
    }

    init (root: Core, IS_DEV_START_ORBIT = false) {
        this._root = root
        const { studio } = root

        this._addInputListeners()

        this._contrilsOrbit?.init(root.studio.camera, root.studio.containerDom)

        studio.add(boxResultDir)
        studio.add(this._arrow)
        studio.add(this._arrow2)
        this._zeroObject.add(this._gridHelper)
        studio.add(this._zeroObject)
        studio.add(this._arrowFaceNormal)
        studio.add(this._arrowDirProj)

        this.switchMode(IS_DEV_START_ORBIT ? 'ORBIT' : 'POINTER')
    }

    switchMode(mode: string) {
        const { studio, ui } = this._root

        if (mode === 'ORBIT') {
            if (this._currentMode !== 'ORBIT') {
                this._contrilsOrbit?.enable()

                const vPos = new THREE.Vector3().copy(studio.camera.position)
                const offset = new THREE.Vector3(0, 5, 15)
                studio.camera.position.add(offset)
                studio.camera.lookAt(vPos)

                this._contrilsOrbit?.update()

                this._currentMode = 'ORBIT'

                ui.toggleControlsArrows(false)                
            }
        }

        if (mode === 'PHONE') {
            if (this._currentMode !== 'PHONE') {
                this._contrPointer.unlock()
                this._contrilsOrbit?.disable()
                this._currentMode = 'PHONE'

                const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(this._controlObj.quaternion).setY(0).normalize()
                this._controlObj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
            
                ui.toggleVisibleButtonLock(true)
                ui.toggleControlsArrows(true)    
            }
        }

        if (mode === 'POINTER') {
            if (this._currentMode !== 'POINTER') { 
                ui.toggleVisibleButtonLock(false)
                this._contrPointer.lock()
                this._currentMode = 'POINTER'
                ui.toggleControlsArrows(false)
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
        
        // Если под игроком нет поверхности поворачиваемся вверх и падаем
        if (!this._zeroObject.up.equals(new THREE.Vector3(0, 1, 0))) {
            this._raycaster.set(this._arrow.position, this._zeroObject.up.clone().negate())
            const intersectsPlayerBottom = this._raycaster.intersectObjects(this._levelElems)
            let isWallUnderPlayer = true
            if (intersectsPlayerBottom.length === 0) {
                isWallUnderPlayer = false
            }
            if (
                intersectsPlayerBottom.length > 0 && 
                intersectsPlayerBottom[0].distance > .8
            ) {
                isWallUnderPlayer = false
            }
            if (!isWallUnderPlayer) {
                this._isDisabled = true
                this._resetGravitation().then(() => {
                    this._isDisabled = false
                })
                return
            }
        }
     
        if (this._currentMode === 'POINTER') {
            this._contrPointer.moveForward(this._currentSpeedForward * 0.01)
            this._contrPointer.moveRight(this._currentSpeedLeft * 0.01)
        }
        if (this._currentMode !== 'POINTER') {
            this._controlObj.translateZ(-this._currentSpeedForward * 0.01)
            this._controlObj.rotateY(-this._currentSpeedLeft * 0.01)
        }


        // Направление движения 
        // берется из новой мировой позиции контролсов минус текущее направление
        const vNewWorldPos = this._controlObj.getWorldPosition(new THREE.Vector3())
        const vDir = vNewWorldPos.clone().sub(this._zeroObject.position).normalize().multiplyScalar(.2)
        // Задаем направление для физики
        phisics.playerBody.velocity.x += vDir.x
        phisics.playerBody.velocity.y += vDir.y
        phisics.playerBody.velocity.z += vDir.z

        // чекаем есть ли впереди стенка на которую можно повернуть
        const vDirArrow = new THREE.Vector3(1, 0, 0)
        const angle = _M.angleFromCoords(this._controlObj.matrix.elements[8], this._controlObj.matrix.elements[10])
        this._arrowX0.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle)
        const q = new THREE.Quaternion()
        this._arrowX0.getWorldQuaternion(q)
        vDirArrow.applyQuaternion(q)
        this._raycaster.set(this._arrow.position, vDirArrow)
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

    async _resetGravitation() {
        const { phisics } = this._root
        phisics.setGravity(new THREE.Vector3(0, 0, 0))

        const vDirView = new THREE.Vector3()
        this._arrow.getWorldDirection(vDirView).setY(0).normalize()
        const vLookAt = this._arrow.position.clone().add(vDirView)
        
        await this._alignToNewDirAnimate(vLookAt, new THREE.Vector3(0, 1, 0))
        
        phisics.setGravity(new THREE.Vector3(0, -1, 0).multiplyScalar(9.82))
    }

    _alignToNewDirAnimate(newLookAt: THREE.Vector3, vUpEnd: THREE.Vector3) {
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
                    const vDir = vStartLookAt.clone().lerp(newLookAt, obj.v)
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

    _addInputListeners() {
        const { ui, studio, phisics, keyboard } = this._root

        keyboard.on('FORWARD', (is: boolean) => {
            this._currentSpeedForward = is ? this._maxSpeedForward : 0
        })
        keyboard.on('BACKWARD', (is: boolean) => {
            this._currentSpeedForward = is ? -this._maxSpeedForward : 0
        })
        keyboard.on('LEFT', (is: boolean) => {
            this._currentSpeedLeft = is ? -this._maxSpeedLeft : 0
        })
        keyboard.on('RIGHT', (is: boolean) => {
            this._currentSpeedLeft = is ? this._maxSpeedLeft : 0
        })
        keyboard.on('JUMP', (is: boolean) => {
            if (is) {
                const dir = this._zeroObject.up.clone().multiplyScalar(10)
                phisics.playerBody.velocity.set(dir.x, dir.y, dir.z)
            }
        })

        ui.moveForwardDiv.addEventListener("pointerdown", () => { 
            this._currentSpeedForward = this._maxSpeedForward
        })
        ui.moveForwardDiv.addEventListener("pointerup", () => {
            this._currentSpeedForward = 0
        })
        ui.moveForwardDiv.addEventListener("pointerout", () => {
            this._currentSpeedForward = 0
        })
        ui.moveBackDiv.addEventListener("pointerdown", () => { 
            this._currentSpeedForward = -this._maxSpeedForward
        })
        ui.moveBackDiv.addEventListener("pointerup", () => {
            this._currentSpeedForward = 0
        })
        ui.moveBackDiv.addEventListener("pointerout", () => {
            this._currentSpeedForward = 0
        })
        ui.moveLeftDiv.addEventListener("pointerdown", () => { 
            this._currentSpeedLeft = -this._maxSpeedLeft
        })
        ui.moveLeftDiv.addEventListener("pointerup", () => { 
            this._currentSpeedLeft = 0
        })
        ui.moveLeftDiv.addEventListener("pointerout", () => { 
            this._currentSpeedLeft = 0
        })
        ui.moveRightDiv.addEventListener("pointerdown", () => { 
            this._currentSpeedLeft = this._maxSpeedLeft
        })
        ui.moveRightDiv.addEventListener("pointerup", () => { 
            this._currentSpeedLeft = 0
        })
        ui.moveRightDiv.addEventListener("pointerout", () => { 
            this._currentSpeedLeft = 0
        })


        ui.lockButton.onclick = () => {
            this.switchMode('POINTER')
        }
        const onKeyUp = (event: KeyboardEvent ) => {
            if (event.code === 'KeyO') {
                if (this._currentMode === 'ORBIT') {
                    this.switchMode('POINTER')
                } else {
                    this.switchMode('ORBIT')
                }
            }
        }
        document.addEventListener('keyup', onKeyUp)
    }

}
