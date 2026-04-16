import * as THREE from 'three'
import { ControlsSystem } from "../ControlsSystem"
import { ControlsOrbit } from "../ControlsOrbit"
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { Core } from "../../types"
import { createMeshArrow } from 'geometry/arrow/arrow'

const box = new THREE.Mesh(
    new THREE.BoxGeometry(.05, .05, .05),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
)

const box2 = new THREE.Mesh(
    new THREE.BoxGeometry(.05, .05, .05),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
)

export class ControlsSystemWall extends ControlsSystem {
    _meshArrow: THREE.Mesh
    _arrow2: THREE.Mesh
    _faceNormal: THREE.Mesh
    _dirPoligon: THREE.Mesh
    _gridHelper = new THREE.GridHelper(10, 10, 0x0000ff, 0xeeeeee)
    
    dir: THREE.Vector3
    dirUp: THREE.Vector3

    zeroObject: THREE.Object3D
    controlObj: THREE.Object3D

    _contrPointer: PointerLockControls
    _contrilsOrbit: ControlsOrbit | null = null
    _levelElems: THREE.Mesh[] = []
    _raycaster = new THREE.Raycaster()
    _currentMode: string = 'none' 
    
    
    constructor() {
        super()

        this._meshArrow = createMeshArrow()
        this._meshArrow.scale.set(.4, .1, -.1)

        this._arrow2 = createMeshArrow({ color: new THREE.Color().setRGB(1, 1, 1) })
        this._arrow2.scale.set(.4, .1, -.1)


        this._faceNormal = createMeshArrow({ color: new THREE.Color().setRGB(0, 1, 0) })
        this._faceNormal.scale.set(.2, .1, .1)
        this._dirPoligon = createMeshArrow({ color: new THREE.Color().setRGB(1, 1, 0) })
        this._dirPoligon.scale.set(.2, .1, .1)


        this.dir = new THREE.Vector3(.5, .5, 0)
        this.dirUp = new THREE.Vector3(0, .5, .5)

        this.zeroObject = new THREE.Object3D()
        this.controlObj = new THREE.Object3D()
        this.zeroObject.add(this.controlObj)
        
        // @ts-ignore
        this._contrPointer = new PointerLockControls(this.controlObj, document.body)

        this._contrilsOrbit = new ControlsOrbit()
    }

    init (root: Core, IS_DEV_START_ORBIT = false) {
        this._root = root
        const { ui, studio } = root

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

        this._contrilsOrbit?.init(root.studio.camera, root.studio.containerDom)
        this._contrilsOrbit?.enable()

        studio.add(box)
        studio.add(this._meshArrow)
        studio.add(this._arrow2)
        this.zeroObject.add(this._gridHelper)
        studio.add(this.zeroObject)
        studio.add(this._faceNormal)
        studio.add(this._dirPoligon)

        this.switchMode('ORBIT')
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

    }

    // setDir1setDirUp(dir1: THREE.Vector3, dirUp: THREE.Vector3) {
    //     this.dir.copy(dir1)
    //     this.dirUp.copy(dirUp)
    // }

    update(delta: number, ) {
        //this._orbit.update()

        if (this._isDisabled) {
            return
        }

        console.log('@@### update')

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
        this._meshArrow.quaternion.copy(wQ)
        const wDir = new THREE.Vector3(0, 0, 1)
        wDir.applyQuaternion(this._meshArrow.quaternion)

        const p = new THREE.Vector3()
        this.controlObj.getWorldPosition(p)
        this._meshArrow.position.copy(p)

        this._arrow2.position.copy(this._meshArrow.position)
        this._arrow2.quaternion.copy(this._meshArrow.quaternion)
        this._arrow2.translateY(.1)



        this._raycaster.set(this._meshArrow.position, wDir.negate())
        const intersects = this._raycaster.intersectObjects(this._levelElems)
        if (intersects[0]) {
            const intercept = intersects[0]
            box.position.copy(intercept.point)
            if (intercept.distance < .6 && intercept.face) {
                this._faceNormal.position.copy(intercept.point)
                this._faceNormal.lookAt(intercept.point.clone().add(intercept.face.normal))
                
                

                this.dirUp.copy(intercept.face.normal)
                
                this._raycaster.set(this._arrow2.position, wDir)
                const intercepts2 = this._raycaster.intersectObjects(this._levelElems)
                if (intercepts2[0]) {
                    const intercept2 = intercepts2[0]
                    const dir = intercept2.point.clone().sub(intercept.point)


                    this._dirPoligon.position.copy(intercept.point)
                    this._dirPoligon.lookAt(intercept2.point.clone())



                    this.dir.copy(dir).add(this.dirUp).add(intercept.face.normal)
                    this.zeroObject.position.copy(intercept.point).add(this.dirUp).add(intercept.face.normal)
                    this.zeroObject.lookAt(this.dir)
                    this.controlObj.position.set(0, 0, 0)
                    //this._dirPoligon.position.copy(intercept2.point)
                    //this._dirPoligon.lookAt(intercept2.point.clone().add(intercept2.face.normal))
                }

                // if (dir) {
                //     this.dir.copy(intercept.point).add(dir).add(intercept.face.normal)

                //     this._dirPoligon.position.copy(intercept.point)
                //     this._dirPoligon.lookAt(intercept.point.clone().add(this.dir))
                // }
            }
        }

        if (this._currentMode !== 'ORBIT') {
            camera.position.copy(this._meshArrow.position)
            camera.quaternion.copy(this._meshArrow.quaternion).conjugate()
        }
    }

    addLevelElem(elem: THREE.Mesh) {
        this._levelElems.push(elem)
    }

    _findDirLevelPoligon(pointOnLevel: THREE.Vector3): THREE.Vector3 | null {
        let resultVec = null 

        const camera = this._root.studio.camera
        const savedQ = new THREE.Quaternion().copy(camera.quaternion)
        camera.rotateX(.05)
        const wDir = new THREE.Vector3(0, 0, 1)
        wDir.applyQuaternion(camera.quaternion)
        this._raycaster.set(camera.position, wDir.negate())
        const intersects = this._raycaster.intersectObjects(this._levelElems)
        if (intersects[0]) {
            const point = intersects[0].point
            resultVec = pointOnLevel.clone().sub(point).normalize()
        }
        camera.quaternion.copy(savedQ)

        return resultVec
    }

}
