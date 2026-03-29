import * as THREE from 'three'
import { StudioConf, ControlsConf } from "_CORE/types"
import { LoadConf } from '_CORE/Loader'

import audioAmbient from '../assets/audio/ambient_loop.mp3'
import steps from '../assets/audio/steps.mp3'
import symbol from '../assets/audio/symbol.mp3'
import sprite from '../assets/sprite.webp'

import ironNormal from '../assets/concrete/broken_down_concrete2_Normal-dx.jpg'
import ironAO from '../assets/concrete/broken_down_concrete2_ao.jpg'
import ironAlbedo from '../assets/concrete/broken_down_concrete2_albedo.jpg'

import pX from '../assets/matIronBox/posx.jpg'
import nX from '../assets/matIronBox/negx.jpg'
import pY from '../assets/matIronBox/posy.jpg'
import nY from '../assets/matIronBox/negy.jpg'
import pZ from '../assets/matIronBox/posz.jpg'
import nZ from '../assets/matIronBox/negz.jpg'

import pX2 from "../assets/skybox/px.jpg"
import nX2 from "../assets/skybox/nx.jpg"
import pY2 from "../assets/skybox/py.jpg"
import nY2 from "../assets/skybox/ny.jpg"
import pZ2 from "../assets/skybox/pz.jpg"
import nZ2 from "../assets/skybox/nz.jpg"

import greenStars from '../assets/green_stars.jpg'
import groundPointsMap from '../assets/map02.jpg'

import mapTop from '../assets/floor_outer_map.jpg'
import shadowStatue from '../assets/mapShadowBody.jpg'

//import staueObj from '../assets/body.obj'
import levelObj from '../assets/level.obj'
import carShadow from '../assets/car_sh.jpg'
import mapBody from '../assets/botMap.png'
import bodyShadow from '../assets/body_sh_map.jpg'

import carCollide from '../assets/car_coll.glb'
import wallTexture from '../assets/txt1.jpg'


// DEBUG FLAGS ************************************* / 
//export const IS_DEV_START_ORBIT = true
export const IS_DEV_START_ORBIT = false

export const IS_DEBUG_SHOW_BUILD_HOUSES_EXAMPLES: boolean = false
//export const IS_DEBUG_SHOW_BUILD_HOUSES_EXAMPLES: boolean = true

// ************************************************/ 

//export const PLAYER_POS_START = [0, 1, -10]
export const PLAYER_POS_START = [10, 1, 10]

const BACK_COLOR = 0x17257d
export const STUDIO_CONF: StudioConf = {
    spotLightParams: {
        color: new THREE.Color().setHex(0xffffff),
        intensity: 1,
        pos: new THREE.Vector3(0, 3, 5),
        angle: Math.PI * .2,
        penumbra: 1,
        decay: .1,
        distance: 300,
        targetPos: new THREE.Vector3(0, 0, -50)
    },
    // // from SRC
    // color: 0x555555,
    // strength: 1,
    // dist: 0,
    // decay: .001,
    // pos: [0, 10, 0],
    directionalLightParams: { 
        //color: new THREE.Color(0x97e6eb), intensity: 30,
        color: new THREE.Color(0x777777), intensity: 10,
        pos: new THREE.Vector3(3, 3, 2)
    },
    cameraPos: new THREE.Vector3().fromArray(PLAYER_POS_START),
    //cameraLookAt: new THREE.Vector3().fromArray(PLAYER_POS_START).add(new THREE.Vector3(0, 0, 10)),
    cameraLookAt: new THREE.Vector3(0, 1, 0),
    cameraFov: 55,
    ambientLightParams: { color: new THREE.Color().setHex(BACK_COLOR), intensity: 3 },
    //sceneBackground: new THREE.Color().setHex(BACK_COLOR),
    sceneBackgroundCubeKeyAsset: 'skybox',
    fogParams: { color: new THREE.Color().setHex(BACK_COLOR), near: 5, far: 80 },
    //SSAO: { kernelRadius: 1, minDistance: 2, maxDistance: 0, enabled: true },
    saturatePass: true,
}

export const CONTROLS_CONF: ControlsConf = {
    playerSpeedForward: 8,
    amplitudeLeftRightWalk: 0.0002,
    jumpSpeed: 8,
    isCanJump: true
}

// ************************************************/

export const CONSTANTS = {}

export const LOAD_ASSETS: LoadConf = [
    { key: 'soundAmbient', src: audioAmbient, loader: 'audio' },
    { key: 'soundStepsMetal', src: steps, loader: 'audio' },
    { key: 'soundSymbol', src: symbol, loader: 'audio' },
    { key: 'sprite', src: sprite, loader: 'texture' },
    { key: 'ironNormal', src: ironNormal, loader: 'texture' },
    { key: 'ironAO', src: ironAO, loader: 'texture' },
    { key: 'ironAlbedo', src: ironAlbedo, loader: 'texture' },
    { key: 'mapGround', src: mapTop, loader: 'texture' },
    { key: 'groundPointsMap', src: groundPointsMap, loader: 'texture' },
    { key: 'shadowStatue', src: shadowStatue, loader: 'texture' },
    { key: 'matIronBox', src: [pX, nX, pY, nY, pZ, nZ], loader: 'cubeTexture' },
    { key: 'levelObj', src: levelObj, loader: 'obj' },
    { key: 'mapBody', src: mapBody, loader: 'texture' },
    { key: 'bodyShadow', src: bodyShadow, loader: 'texture' },
    { key: 'carShadow', src: carShadow, loader: 'texture' },
    { key: 'skybox', src: [pX2, nX2, pY2, nY2, pZ2, nZ2], loader: 'cubeTexture' },
    { key: 'skyboxGreenStars', src: [greenStars, greenStars, greenStars, greenStars, greenStars, greenStars], loader: 'cubeTexture' },
    { key: 'carCollide', src: carCollide, loader: 'glb' },
    { key: 'wallTexture', src: wallTexture, loader: 'texture' },
] 
