import * as THREE from 'three'
import { StudioConf, ControlsConf } from "_CORE/types"
import { LoadConf } from '_CORE/Loader'

import audioAmbient from '../assets/audio/ambient_loop.mp3'
import steps from '../assets/audio/steps.mp3'
import symbol from '../assets/audio/symbol.mp3'
//import audioBzink from '../assets/bzink.mp3'
//import audioDoor from '../assets/door.mp3'
//import audioFly from '../assets/fly.mp3'

import roadImg from '../assets/road_stone.webp'
import wallTile from '../assets/tiles_wall.webp'
import noise00 from '../assets/noise00.webp'
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

import mapTop from '../assets/mapGround.jpg'

import floorOuterMap from '../assets/floor_outer_map3.jpg'
import floorOuterMap2 from '../assets/floor_outer_map2.jpg'

//import level from '../assets/level02.obj'
import level from '../assets/level03.obj'


// DEBUG FLAGS ************************************* / 
//export const IS_DEV_START_ORBIT = true
export const IS_DEV_START_ORBIT = false

const PHISICS_CONF = {
    IS_DEBUG: false
}

export const IS_DEBUG_SHOW_BUILD_HOUSES_EXAMPLES: boolean = false
//export const IS_DEBUG_SHOW_BUILD_HOUSES_EXAMPLES: boolean = true

export const IS_OLD_GAMES_INFO = true
//export const IS_OLD_GAMES_INFO = false

// ************************************************/ 

export const PLAYER_POS_START = [0, -2.5, 0]
//export const PLAYER_POS_START = [-65.36023754162309,78.82307855723435,-11.683569743268201]

//const BACK_COLOR = 0x505f68 
const BACK_COLOR = '#1e2053'
export const STUDIO_CONF: StudioConf = {
    spotLightParams: {
        color: new THREE.Color().setStyle('#ffffff'),
        intensity: 1,
        pos: new THREE.Vector3(0, 3, 5),
        angle: Math.PI * .2,
        penumbra: 1,
        decay: .1,
        distance: 300,
        targetPos: new THREE.Vector3(0, 0, -5)
    },
    directionalLightParams: { 
        color: new THREE.Color().setStyle('#777777'), intensity: 6,
        pos: new THREE.Vector3(0, 5, 0)
    },
    cameraPos: new THREE.Vector3().fromArray(PLAYER_POS_START),
    cameraLookAt: new THREE.Vector3(30, 1, 0).fromArray(PLAYER_POS_START).add(new THREE.Vector3(0, 0, 10)),
    cameraFov: 55,
    ambientLightParams: { color: new THREE.Color().setStyle('#a6cfe6'), intensity: 2 },
    sceneBackground: new THREE.Color().setStyle(BACK_COLOR),
    fogParams: { color: new THREE.Color().setStyle(BACK_COLOR), near: 1, far: 30 },
    saturatePass: true,
}

export const CONTROLS_CONF: ControlsConf = {
    playerSpeedForward: 10,
    amplitudeLeftRightWalk: 0.0002,
    jumpSpeed: 8,
    isCanJump: false
}

// ************************************************/

export const CONSTANTS = {
    PHISICS_CONF,
}

export const LOAD_ASSETS: LoadConf = [
    { key: 'soundAmbient', src: audioAmbient, loader: 'audio' },
    { key: 'soundStepsMetal', src: steps, loader: 'audio' },
    { key: 'soundSymbol', src: symbol, loader: 'audio' },
    { key: 'sprite', src: sprite, loader: 'texture' },
    { key: 'ironNormal', src: ironNormal, loader: 'texture' },
    { key: 'ironAO', src: ironAO, loader: 'texture' },
    { key: 'ironAlbedo', src: ironAlbedo, loader: 'texture' },
    { key: 'mapGround', src: mapTop, loader: 'texture' },
    { key: 'matIronBox', src: [pX, nX, pY, nY, pZ, nZ], loader: 'cubeTexture' },
    { key: 'level', src: level, loader: 'obj' },
    { key: 'floorOuterMap', src: floorOuterMap, loader: 'texture' },
    { key: 'floorOuterMap2', src: floorOuterMap2, loader: 'texture' },
] 
