import * as THREE from "three";
//import { helper_CollisionsItems_v02 } from '../../../_CORE/helpers/helper_CollisionsItems_v02'
import { createCarCompas } from './CarCompas'
import { Root  } from '../index'
import { _M } from '_CORE/_M/_m'

export class Car {
    _root: Root
    _model: THREE.Object3D
    _modelM: THREE.Mesh
    _phase: number
    _battery: THREE.Mesh
    _camera: THREE.PerspectiveCamera
    _collision: THREE.Mesh
    _checkerPlayerDrive: THREE.Mesh 
    _frontObj: THREE.Object3D
    _backObj: THREE.Object3D
    _compass: any

    setTargetPosition: any
    _isFreeze: boolean = false
    _isMove: boolean = false

    _spd: number
    _acc: number
    _deceleration: number
    _maxSpdFront: number
    _maxSpdBack: number
    _spdRot: number

    _isCarStay: boolean
    update: any

    init (root: Root) {
        const {
            assets,
            materials,
        } = root
        this._root = root

        this._model = new THREE.Object3D()
        
        this._modelM = assets['levelObj'].children.filter((item: THREE.Mesh) => item.name === 'CAR_102G')[0]
        this._modelM.material = materials.carNorm
        this._modelM.scale.set(.05, .05, .05)
        this._modelM.position.set(0, .5, 0)
        this._model.add(this._modelM)

        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(45, 70), root.materials.carShadow)
        shadow.rotation.x = -Math.PI / 2
        shadow.position.x = -1
        shadow.position.y = -9.5
        shadow.position.z = 2
        this._modelM.add(shadow)

        const part = assets['levelObj'].children.filter((item: THREE.Mesh) => item.name === 'CAR_102')[0]
        part.material = materials.testBlack
        this._modelM.add(part)

        this._phase = 0
        this._battery = assets['levelObj'].children.filter((item: THREE.Mesh) => item.name === 'battary')[0]
        this._battery.material = materials.carBattery
        this._battery.position.add(new THREE.Vector3(0, .5, -2.5))
        this._battery.material.opacity = 0
        this._modelM.add(this._battery)

        this._createCarCollision()

        this._compass = null
        setTimeout(() => {
            this._compass = createCarCompas(root)
            this._compass.addToParent(this._model)
            this._compass.setArrowPosition(0, .71, -1.3)
            this.setTargetPosition = (val: THREE.Vector3) => {
                this._compass.setTargetPosition(val)
                this._compass.update()
            }
        }) 

        this._isFreeze = true

        this._spd = 0
        this._acc = 0.8
        this._deceleration = 0.0001
        this._maxSpdFront = -100
        this._maxSpdBack = 100
        this._spdRot = 0.03

        this._isCarStay = true

        const dir = new THREE.Vector3(0, 0, -1)
        const up = new THREE.Vector3(0, 1, 0)

        root.phisics.carBody.position.y = 1000
        root.phisics.addListen('collisionBuild_', 'beginContact', () => {
            this._spd = 0
        })

        this._isMove = false


        let isForward = false
        let isBackward = false
        let isLeft = false
        let isRight = false

        const { ui } = root

        if (!root.deviceData.isMobileDevice) {
            root.ticker.on(() => {
                if (root.keyboard.isForward !== isForward) {
                    isForward = root.keyboard.isForward
                }
                if (root.keyboard.isBackward !== isBackward) {
                    isBackward = root.keyboard.isBackward
                }
                if (root.keyboard.isLeft !== isLeft) {
                    isLeft = root.keyboard.isLeft
                }
                if (root.keyboard.isRight !== isRight) {
                    isRight = root.keyboard.isRight
                }
            })
        } else {
            ui.moveForwardDiv.addEventListener('pointerdown', () => { 
                console.log('forward')
                isForward = true 
            })
            ui.moveForwardDiv.addEventListener('pointerup', () => isForward = false)
            ui.moveBackDiv.addEventListener('pointerdown', () => isBackward = true)
            ui.moveBackDiv.addEventListener('pointerup', () => isBackward = false)  
            ui.moveLeftDiv.addEventListener('pointerdown', () => isLeft = true)
            ui.moveLeftDiv.addEventListener('pointerup', () => isLeft = false)  
            ui.moveRightDiv.addEventListener('pointerdown', () => isRight = true)
            ui.moveRightDiv.addEventListener('pointerup', () => isRight = false)
        }



        this.update = (d: number) => {
            if (this._isFreeze) {
                return;
            }

            /** move car *************/
            if (this._spd < 0) {
                this._compass.update()
            }
            if (this._spd > 0) {
                this._compass.update()
            }


            /** acceleration update speed *********/
            if (isForward) {
                this._spd -= this._acc
            }
            if (isBackward) {
                this._spd += this._acc
            }


            /** slowdown update speed *********/
            if (Math.abs(this._spd) < 0.001) { 
                this._spd = 0
            } else {
                this._spd += Math.sign(this._spd) * (-1) * 0.1

                if (this._spd > 0) {
                    this._spd -= this._deceleration
                    if (this._spd < 0) {
                        this._spd = 0
                    }
                }
                if (this._spd < 0) {
                    this._spd += this._deceleration
                    if (this._spd > 0) {
                        this._spd = 0
                    }
                }
                this._spd = Math.min(this._maxSpdBack, Math.max(this._maxSpdFront, this._spd))

                /** update car rotation ***********/
                const rotBySpeed = Math.min(1, Math.max(0, Math.abs(this._spd)))
                if (isLeft) {
                    if (this._spd < 0) {
                        dir.applyAxisAngle(up, this._spdRot * rotBySpeed)
                        this._model.rotation.y += (this._spdRot * rotBySpeed)
                    }
                    if (this._spd > 0) {
                        dir.applyAxisAngle(up, this._spdRot * rotBySpeed)
                        this._model.rotation.y += (this._spdRot * rotBySpeed)
                    }

                }
                if (isRight) {
                    if (this._spd < 0) {
                        dir.applyAxisAngle(up, -this._spdRot * rotBySpeed)
                        this._model.rotation.y -= (this._spdRot * rotBySpeed)
                    }
                    if (this._spd > 0) {
                        dir.applyAxisAngle(up, -this._spdRot * rotBySpeed)
                        this._model.rotation.y -= (this._spdRot * rotBySpeed)
                    }
                }
            }

            const { carBody } = this._root.phisics
            if (carBody) {
                carBody.velocity.x = Math.sin(this._model.rotation.y) * this._spd
                carBody.velocity.z = Math.cos(this._model.rotation.y) * this._spd
                //carBody.position.y = .5

                this._model.position.x = carBody.position.x
                this._model.position.z = carBody.position.z 
                //this._model.position.y = carBody.position.y
            }

            if (Math.abs(this._spd) < 0.05) {
                this._spd = 0
                this.setCollisionsPos(this._model.position.x, 0, this._model.position.z, this._model.rotation.y)
            }

            if (this._isMove && Math.abs(this._spd) === 0) {
                this._isMove = false
                root.audio.stopCar()
            }
            if (!this._isMove && Math.abs(this._spd) > 0) {
                this._isMove = true
                root.audio.playCar()
            }
        }
        
        root.ticker.on(this.update.bind(this))
    }

    freeze(is: boolean) {
        this._isFreeze = is
        if (this._isMove) {
            this.setCollisionsPos(this._model.position.x, 0, this._model.position.z, this._model.rotation.y)
            this._root.audio.stopCar()
            this._isMove = false
        }

        const { ui } = this._root
        if (is) {
            console.log('[MESSAGE:] FREEZE CAR')
            ui.moveBackDiv.style.display = 'none'
            ui.moveForwardDiv.style.display = 'none'
            ui.moveLeftDiv.style.display = 'none'
            ui.moveRightDiv.style.display = 'none'
        } else {
            ui.moveForwardDiv.style.display = 'block'
            ui.moveBackDiv.style.display = 'block'
            ui.moveLeftDiv.style.display = 'block'
            ui.moveRightDiv.style.display = 'block'
        }
    }

    setCollisionsPos(x: number, y: number, z: number, rotY = 0) { 
        this._root.phisics.setPositionByKey('collisionCheckerPlayerDrive', x, y, z, rotY)
        this._root.phisics.setPositionByKey('collisionCar', x, y, z, rotY)
    }

    setCompasTarget (v: THREE.Vector3) {
        this._compass.setTargetPosition(v)
    }

    getModel () {
        return this._model
    }

    getCollision () {
        return this._collision
    }

    getCheckerPlayerDrive () {
        return this._checkerPlayerDrive
    }

    getCamera () {
        return this._camera
    }

    toggleFreeze (val: boolean) {
        this._isFreeze = val
    }

    getPosition () {
        return this._model.position
    }

    getQuaternion () {
        return this._model.quaternion
    }

    subscribeOnMove () {

    }

    toggleMat (key: string) {
        const { materials } = this._root

        if (key === 'green') {
            this._compass.changeColor('green')
            this._modelM.material = materials.carGreen
        }
        if (key === 'red') {
            this._compass.changeColor('normal')
            this._modelM.material = materials.carNorm
        }

    }

    add(m: THREE.Object3D) {
        this._model.add(m)
    }

    updateBattary () {
        this._phase += 0.05
        // @ts-ignore
        this._battery.material.opacity = Math.sin(this._phase) + 1
    }

    hideBattery () {
        // @ts-ignore 
        this._battery.material.opacity = 0
        this._modelM.remove(this._battery)
    }

    _createCarCollision () {
        {
            const v: number[] = []

            const x0 = -1
            const x1 = 1
            const z0 = 1.9
            const z1 = -1.9
            const h = .4
            const _v = _M.createPolygon(
                [x0, h, z0],
                [x1, h, z0],
                [x1, h, z1],
                [x0, h, z1]
            )
            v.push(..._v)
            const m = _M.createMesh({ v })
            m.name = 'collisionCar'
            this._collision = m
        }

        {
            const v: number[] = []
            const x0 = -1.5
            const x1 = 1.5
            const z0 = 1.5
            const z1 = -1.5
            const h = 1
            const _v = _M.createPolygon(
                [x0, h, z0],
                [x1, h, z0],
                [x1, h, z1],
                [x0, h, z1]
            )
            v.push(..._v)
            const m = _M.createMesh({ v })
            m.name = 'collisionCheckerPlayerDrive'
            this._checkerPlayerDrive = m
        }
    }
    
}
