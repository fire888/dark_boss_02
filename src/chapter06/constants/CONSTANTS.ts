import * as THREE from 'three'
import { StudioConf, ControlsConf } from "_CORE/types"

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

export const PLAYER_POS_START = [30, 1, -20]

const BACK_COLOR = 0x505f68 
export const STUDIO_CONF: StudioConf = {
    spotLightParams: {
        color: new THREE.Color().setHex(0xffffff),
        intensity: 2.3,
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
        color: new THREE.Color(0x777777), intensity: 7,
        pos: new THREE.Vector3(-3, 3, -2)
    },
    cameraPos: new THREE.Vector3().fromArray(PLAYER_POS_START),
    cameraLookAt: new THREE.Vector3(30, 1, 0).fromArray(PLAYER_POS_START).add(new THREE.Vector3(0, 0, 10)),
    cameraFov: 55,
    ambientLightParams: { color: new THREE.Color().setHex(BACK_COLOR), intensity: 2 },
    sceneBackground: new THREE.Color().setHex(BACK_COLOR),
    fogParams: { color: new THREE.Color().setHex(BACK_COLOR), near: 5, far: 80 },
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

// export const COLOR_FOG_START = new THREE.Color().setHex(0x0e2535) 
// export const COLOR_FOG_PLAY = new THREE.Color().setHex(0x2b2241) 

// export const COLOR_WINDOW_INNER_D: A3 = [.25, .25, .5]
// export const COLOR_WHITE: A3 = _M.hexToNormalizedRGB('222222') 
// export const COLOR_BLUE_L: A3 = _M.hexToNormalizedRGB('5f6569') 
// export const COLOR_BLUE: A3 = _M.hexToNormalizedRGB('555f67') 
// export const COLOR_BLUE_D: A3 = _M.hexToNormalizedRGB('5d6c77') 
// export const COLOR_DARK: A3 = _M.hexToNormalizedRGB('000000') 
// export const COLOR_DARK_INTERIOR: A3 = _M.hexToNormalizedRGB('000000') 

// export const INNER_HOUSE_FORCE: number = 0
// export const OUTER_HOUSE_FORCE: number = 1.5
