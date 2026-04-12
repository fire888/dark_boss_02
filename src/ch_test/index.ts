import { _M } from '_CORE/_M/_m'
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createArrow } from '../geometry/arrow/arrow'

const scene = new THREE.Scene()
        
const camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, .1, 1000)
camera.position.set(30, 20, 0)
camera.lookAt(new THREE.Vector3(0, 1, -1))

scene.add(camera)

const amb = new THREE.AmbientLight(0xffffff, 1) 
scene.add(amb)

const dirLight = new THREE.DirectionalLight()
dirLight.position.set(100, 100, 0)
scene.add(dirLight)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
const containerDom = document.getElementById('container-game')
if (containerDom) containerDom.appendChild(renderer.domElement)
renderer.render(scene, camera)

const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener( 'resize', onWindowResize)
onWindowResize()

const axesHelper = new THREE.AxesHelper(10)
axesHelper.position.set(.1, .1, .1)
scene.add(axesHelper)

const animate = () => {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}
animate()

///////////////////////////////////////////////////

// const b = new THREE.Mesh(
//     new THREE.BoxGeometry(1, 1, 1),
//     new THREE.MeshNormalMaterial()
// )
// scene.add(b)

//////////////////////////////////////////////////

// const controls = new OrbitControls(camera, renderer.domElement)
// controls.target.set( 0, 0.5, 0 )
// controls.update()

/////////////////////////////////////////////////

const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide })
const arrowV = createArrow(15, 1)
const arrow = _M.createMesh({ v: arrowV.v, material: mat })
scene.add(arrow)

const floor = new THREE.GridHelper(100, 10, 0xbbbbbb, 0x808080)
floor.position.y = 0
floor.position.x = 0
scene.add(floor)

const createBox = (pos: THREE.Vector3) => {
    const b = new THREE.Mesh(
        new THREE.BoxGeometry(5, 5, 5),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    )
    b.position.copy(pos)
    scene.add(b)
}

for (let i = 0; i < 1000; i++) {
    const x = Math.random() * 1000 - 500
    const y = Math.random() * 1000 - 500
    const z = Math.random() * 1000 - 500
    createBox(new THREE.Vector3(x, y, z))
}

///////////////////////////////////////////////////

class Player extends THREE.Object3D {
    dirUp: THREE.Object3D
    dir1: THREE.Object3D
    dir2: THREE.Object3D
    
    zeroObj: THREE.Object3D
    camLocXZObjParent: THREE.Object3D
    camLocXZObj: THREE.Object3D
    camLocXZObjChild: THREE.Object3D
    finishObj: THREE.Object3D

    camArrow: THREE.Mesh
    camArrowChild: THREE.Object3D


    _controls: PointerLockControls

    spdForward = 0
    spdLeft = 0

    constructor() {
        super()

        const aV = createArrow(5, 1)
        const am = _M.createMesh({ v: aV.v, material: new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide }) })
        am.position.set(0, 1, 0)
        this.add(am)

        const floor = new THREE.GridHelper(10, 10, 0x0000ff, 0x808080)
        floor.position.y = -1
        floor.position.x = 0
        this.add(floor)

        const b = new THREE.Mesh(
            new THREE.BoxGeometry(.3, .3, .3),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        )
        this.add(b)

        const c = new THREE.Mesh(
            new THREE.CylinderGeometry(.05, .05, 5),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        )
        c.position.set(0, 2.5, 0)
        this.add(c)


        this.dir1 = new THREE.Object3D()
        this.dir1.position.set(0, 0, 1)
        this.dir2 = new THREE.Object3D()
        this.dir2.position.set(-1, 0, 0)
        this.dirUp = new THREE.Object3D()
        this.dirUp.position.copy(this.dir1.position).multiply(this.dir2.position)





        this.zeroObj = new THREE.Object3D()

        const camArrowV = createArrow(5, 1)
        this.camArrow = _M.createMesh({ v: camArrowV.v, material: new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }) })
        this.camArrow.position.set(0, 1.2, 0)
        this.add(this.camArrow)

        this.camArrowChild = new THREE.Object3D()
        this.camArrowChild.position.set(0, 0, 1)
        this.camArrow.add(this.camArrowChild)

        // @ts-ignore
        this._controls = new PointerLockControls(this.camArrow, renderer.domElement)
        this._controls.maxPolarAngle = Math.PI - .01
        this._controls.minPolarAngle = .01

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.code === 'KeyW') this.spdForward = -.5
            if (e.code === 'KeyS') this.spdForward = .5
            if (e.code === 'KeyA') this.spdLeft = -.5
            if (e.code === 'KeyD') this.spdLeft = .5
        })
        document.addEventListener('keyup', (e: KeyboardEvent) => {
            if (e.code === 'KeyW') this.spdForward = 0
            if (e.code === 'KeyS') this.spdForward = 0
            if (e.code === 'KeyA') this.spdLeft = 0
            if (e.code === 'KeyD') this.spdLeft = 0
        })

        this.camLocXZObjParent = new THREE.Object3D()
        this.camLocXZObj = new THREE.Object3D()
        this.camLocXZObjParent.add(this.camLocXZObj)
        this.camLocXZObjChild = new THREE.Object3D()
        this.camLocXZObjChild.position.z = 1
        this.camLocXZObj.add(this.camLocXZObjChild)

        this.finishObj = new THREE.Object3D()
    }

    update() {
        this.translateX(this.spdLeft)
        this.translateZ(this.spdForward)
    
        this.camArrow.up.copy(this.dirUp.quaternion)
        
        this.quaternion.copy(this.camArrow.quaternion)
        
        
        //const applyTo = camera        
        const applyTo = arrow                
        applyTo.quaternion.copy(this.quaternion)
        applyTo.position.copy(this.position)
    }

    lock() {
        this._controls.lock()
    }
    
    
}

const p = new Player()
p.position.set(15, 0, 15)
scene.add(p)

const animate2 = () => {
    requestAnimationFrame(animate2)
    p.update()
}
animate2()

document.addEventListener('click', () => p.lock())













// alert('#$#$#$')

// import { Ticker } from "_CORE/Ticker"
// import { Keyboard } from "_CORE/Keyboard"
// import { Phisics } from "_CORE/Phisics"
// import { ControlsSystem } from "_CORE/controls/controlsWalkOnWalls/ControlsSystem"
// import { DeviceData } from "_CORE/DeviceData"
// import { Studio } from "_CORE/Studio"
// import { LoaderAssets } from "_CORE/Loader"

// import { CONSTANTS, STUDIO_CONF, CONTROLS_CONF, LOAD_ASSETS } from "./constants/CONSTANTS"

// import { Particles } from './entities/Particles'

// import { UiCustom } from "./entities/Ui"

// import { Lab03 } from './EntLab03/Lab03'
// import { AudioManagerCustom } from "./entities/AudioManagerCustom"
// import { Materials } from "./entities/Materials"
// import { pipeInit_04 } from "./pipelines/pipeInit_04"
// import { pipePlay_04 } from "./pipelines/pipePlay_04"
// import { pipeEnd_04 } from "./pipelines/pipeEnd_04"
// import { Core } from '_CORE/types'
// import { PlayerWallDirection } from "./entities/PlayerWallDirection"

// import "./moveTest"

// // @ts-ignore
// export interface Root extends Core {
//     CONSTANTS: typeof CONSTANTS,
//     ui: UiCustom,
//     controls: ControlsSystem,
//     particles: Particles,

//     LOAD_ASSETS: typeof LOAD_ASSETS,
//     loader: LoaderAssets,

//     lab: Lab03,
//     audio: AudioManagerCustom,
//     materials: Materials,
//     assets: {
//         [key: string]: any
//     },
//     playerWallDirection: PlayerWallDirection,
// }


// // window.addEventListener("DOMContentLoaded", async () => {
// //     // @ts-ignore:next-line
// //     console.log("branch:" + __GIT_CURRENT_BRANCH__ + ' commit:' + __HASH_COMMIT__)

// //     const root: Root = {
// //         CONSTANTS,
// //         assets: {},
// //         ticker: new Ticker(),
// //         studioConf: STUDIO_CONF, 
// //         studio: new Studio(),
// //         keyboard: new Keyboard(),

// //         controlsConf: CONTROLS_CONF,
// //         controls: new ControlsSystem(),
        
// //         ui: new UiCustom(),
// //         particles: new Particles(),

// //         LOAD_ASSETS,
// //         loader: new LoaderAssets(),
        
// //         deviceData: new DeviceData(),
// //         phisics: new Phisics(),
// //         lab: new Lab03(),

// //         audioConf: { 
// //             stepsSpeed: 1 
// //         },
// //         audio: new AudioManagerCustom(),
        
// //         materials: new Materials(),

// //         playerWallDirection: new PlayerWallDirection()
// //     }

// //     await pipeInit_04(root)
// //     await pipePlay_04(root)
// //     await pipeEnd_04(root)
// // })
