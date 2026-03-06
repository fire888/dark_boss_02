import { _M, A3 } from "../geometry/_m"
import { ILevelConf } from "../types/GeomTypes"
import { THEMES, THEMES_START} from "./THEMES"
import * as THREE from 'three'

// DEBUG FLAGS ************************************* / 

export const IS_DEV_START_ORBIT = false
//export const IS_DEV_START_ORBIT = true

const PHISICS_CONF = {
    IS_DEBUG: false
}

const PERCENT_ENERGY: number = 0.2
//const PERCENT_ENERGY: number = 0.0001

export const IS_DEBUG_SHOW_BUILD_HOUSES_EXAMPLES: boolean = false
//export const IS_DEBUG_SHOW_BUILD_HOUSES_EXAMPLES: boolean = true

export const IS_OLD_GAMES_INFO = true
//export const IS_OLD_GAMES_INFO = false

// ************************************************/ 

const PLAYER_START_POS_BIG_LEVEL: number[] = [-1, .7, -200]
const PLAYER_START_POS_SMALL_LEVEL: number[] = [-1, .7, -50]

export const CONSTANTS = {
    PHISICS_CONF, 
    PLAYER_START_POS_BIG_LEVEL,
    PLAYER_START_POS_SMALL_LEVEL,
}

export const COLOR_FOG_START = new THREE.Color().setHex(0x0e2535) 
export const COLOR_FOG_PLAY = new THREE.Color().setHex(0x2b2241) 

export const COLOR_WINDOW_INNER_D: A3 = [.25, .25, .5]
export const COLOR_WHITE: A3 = _M.hexToNormalizedRGB('222222') 
export const COLOR_BLUE_L: A3 = _M.hexToNormalizedRGB('5f6569') 
export const COLOR_BLUE: A3 = _M.hexToNormalizedRGB('555f67') 
export const COLOR_BLUE_D: A3 = _M.hexToNormalizedRGB('5d6c77') 
export const COLOR_DARK: A3 = _M.hexToNormalizedRGB('000000') 
export const COLOR_DARK_INTERIOR: A3 = _M.hexToNormalizedRGB('000000') 

export const INNER_HOUSE_FORCE: number = 0
export const OUTER_HOUSE_FORCE: number = 1.5

export const LEVELS: ILevelConf[] = [
    // { // VVV огромный !!! повторить 4 раза
    //     playerStartPosition: [-1, -200],
    //     SX: 150,
    //     SY: 150,
    //     N: 70,
    //     repeats: [
    //         [-151, -151],           
    //         [1, -151],           
    //         [1, 1],           
    //         [-151, 1],           
    //     ],
    //     positionTeleporter: [0, -151],
    //     percentCompleteEnergy: PERCENT_ENERGY,
    //     fogFar: 100,
    //     theme: THEMES[Math.floor(Math.random() * THEMES.length)],
    // },


    // START  /////////////////////////////////////////////////////////
    // { // малый
    //     playerStartPosition: [-1, -30],
    //     SX: 18,
    //     SY: 18,
    //     N: 3,
    //     repeats: [
    //         [-19, -15],
    //     ],
    //     positionTeleporter: [0, 0],
    //     percentCompleteEnergy: PERCENT_ENERGY,
    //     fogFar: 30,
    //     theme: THEMES[Math.floor(Math.random() * THEMES.length)],
    // },

    { // VVV средний Y длинный 2
        playerStartPosition: [-1, -30],
        SX: 24,
        SY: 120,
        N: 60,
        repeats: [
            [1.7, -15],
            [-25.7, -15],
        ],
        positionTeleporter: [0, 0],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 30,
        theme: THEMES_START[Math.floor(Math.random() * THEMES_START.length)],
        isSetForceAntigravNearLastPortal: true,
    },

    {  // VVV квадрат средний
        playerStartPosition: [-22, -40],
        SX: 80,
        SY: 80,
        N: 50,
        repeats: [
            [-20, -20],
        ],
        positionTeleporter: [-22, -10],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 30,
        //theme: THEMES[Math.floor(Math.random() * THEMES.length)],
        theme: THEMES_START[Math.floor(Math.random() * THEMES_START.length)],
        isSetForceAntigravNearLastPortal: true,
    },



    { // VVVV большой
        playerStartPosition: [30, -40],
        SX: 150,
        SY: 150,
        N: 70,
        repeats: [
            [1, 0],
            [-151, 0],
        ],
        positionTeleporter: [0, 0],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 30,
        theme: THEMES_START[Math.floor(Math.random() * THEMES_START.length)],
    },

    { // VVV большой - супер много домов ====== focus
        playerStartPosition: [-1, -20],
        SX: 200,
        SY: 200,
        N: 700,
        repeats: [
            [-100, 0],
        ],
        positionTeleporter: [101, 100],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 100,
        theme: THEMES[Math.floor(Math.random() * THEMES.length)],
    },

    { // VVV супер узкий Y
        playerStartPosition: [-1, -20],
        SX: 10,
        SY: 300,
        N: 400,
        repeats: [
            [-5, 0],                      
        ],
        positionTeleporter: [-8, 300],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 100,
        theme: THEMES[Math.floor(Math.random() * THEMES.length)],
        isSetForceAntigravNearLastPortal: true,
    },

    { // VVV огромный !!! повторить 4 раза
        playerStartPosition: [-1, -200],
        SX: 150,
        SY: 150,
        N: 70,
        repeats: [
            [-151, -151],           
            [1, -151],           
            [1, 1],           
            [-151, 1],           
        ],
        positionTeleporter: [0, -151],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 100,
        theme: THEMES[Math.floor(Math.random() * THEMES.length)],
    },

    { // VVVV большой большие дома
        playerStartPosition: [30, -40],
        SX: 150,
        SY: 150,
        N: 10,
        repeats: [
            [-75, 0],
        ],
        positionTeleporter: [76, 25],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 30,
        theme: THEMES[Math.floor(Math.random() * THEMES.length)],
        isSetForceAntigravNearLastPortal: true,
    },

    { // VVVV малый малые дома
        playerStartPosition: [30, -40],
        SX: 50,
        SY: 50,
        N: 150,
        repeats: [
            [-25, 0],
        ],
        positionTeleporter: [-26, 25],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 30,
        theme: THEMES[Math.floor(Math.random() * THEMES.length)],
    },

    { // VVV средний-малый Y длинный 3
        playerStartPosition: [-1, -30],
        SX: 18,
        SY: 120,
        N: 60,
        repeats: [
            [2, -15],
            [-19, -15],
            [-39, -15],
        ],
        positionTeleporter: [0, 0],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 30,
        theme: THEMES_START[Math.floor(Math.random() * THEMES_START.length)],
    },

    { // VVVV супер огромный малые дома - ширина
        playerStartPosition: [30, -40],
        SX: 300,
        SY: 100,
        N: 300,
        repeats: [
            [-150, 0],
        ],
        positionTeleporter: [-153, 75],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 30,
        theme: THEMES[Math.floor(Math.random() * THEMES.length)],
    },

    { // VVVV длинный y x 2
        playerStartPosition: [30, -40],
        SX: 40,
        SY: 250,
        N: 100,
        repeats: [
            [-20, 0],
            [-61, 0],
        ],
        positionTeleporter: [-63, 200],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 30,
        theme: THEMES[Math.floor(Math.random() * THEMES.length)],
    },

    { // VVV супер узкий X
        playerStartPosition: [-1, -20],
        SX: 300,
        SY: 10,
        N: 4,
        repeats: [
            [-300, 0],                      
        ],
        positionTeleporter: [-302, 20],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 100,
        theme: THEMES[Math.floor(Math.random() * THEMES.length)],
        isSetForceAntigravNearLastPortal: true,
    },

    { // VVVV длинный х
        playerStartPosition: [30, -40],
        SX: 250,
        SY: 40,
        N: 100,
        repeats: [
            [0, 0],
        ],
        positionTeleporter: [252, 10],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 30,
        theme: THEMES[Math.floor(Math.random() * THEMES.length)],
    },
    
    { // VVVV средний
        playerStartPosition: [30, -40],
        SX: 130,
        SY: 80,
        N: 60,
        repeats: [
            [0, 0],
        ],
        positionTeleporter: [132, 95],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 30,
        theme: THEMES[Math.floor(Math.random() * THEMES.length)],
    },

    { // VVV огромный !!! повторить 4 раза
        playerStartPosition: [-1, -200],
        SX: 150,
        SY: 150,
        N: 70,
        repeats: [
            [-151, -151],           
            [1, -151],           
            [1, 1],           
            [-151, 1],           
        ],
        positionTeleporter: [0, -151],
        percentCompleteEnergy: PERCENT_ENERGY,
        fogFar: 100,
        theme: THEMES[Math.floor(Math.random() * THEMES.length)],
    },
]