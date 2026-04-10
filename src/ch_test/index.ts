import { _M } from '_CORE/_M/_m'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createArrow } from '../geometry/arrow/arrow'

const scene = new THREE.Scene()
        
const camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, .1, 1000)
camera.position.set(0, 1, 20)
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
axesHelper.position.set(0, 0, 0)
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

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set( 0, 0.5, 0 )
controls.update()

/////////////////////////////////////////////////

const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
const arrowV = createArrow()
const arrow = _M.createMesh({ v: arrowV.v, material: mat })
scene.add(arrow)
arrow.up.set(0, 0, 1)

const animate2 = () => {
    requestAnimationFrame(animate2)
    arrow.rotation.y += 0.01
}
animate2()

///////////////////////////////////////////////////










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
