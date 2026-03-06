import * as THREE from 'three'
import { StudioConf } from '_CORE/types'

type LevelCof = {
    TILES_X: number,
    TILES_Z: number,
    FLOORS_NUM: number  
}

export const vC_H = 4.5

const PHISICS_CONF = {
    IS_DEBUG: false
}

const PLAYER_START_POS: number[] = [15.076315508474185, 3, -10]
const ENERGY_FIRST_POS: number[] = [15.076315508474185, 0, -4]
const ENERGY_PERCENTAGE_MUST_GET: number = .3


export const STUDIO_CONF: StudioConf = {
    spotLightParams: {
        color: new THREE.Color().setHex(0xffffff),
        intensity: 15,
        pos: new THREE.Vector3(0, 3, 5),
        angle: Math.PI * .2,
        penumbra: 1,
        decay: 1,
        distance: 300,
        targetPos: new THREE.Vector3(0, 0, -50)
    },
    directionalLightParams: { 
        color: new THREE.Color(0x97e6eb), intensity: 30,
        pos: new THREE.Vector3(-3, 3, -2)
    },
    cameraPos: new THREE.Vector3(1, 30, 70),
    cameraLookAt: new THREE.Vector3(150, 1, 150),
    ambientLightParams: { color: new THREE.Color().setHex(0x897fa0), intensity: 3 },
    sceneBackground: new THREE.Color().setHex(0x0e2535),
    fogParams: { color: new THREE.Color().setHex(0x0e2535), near: .2, far: 1000 },
    SSAO: { kernelRadius: 5, minDistance: 2, maxDistance: 0, enabled: true },
}

const LABS_CONF: LevelCof[] = [
    { TILES_X: 0, TILES_Z: 0, FLOORS_NUM: 0 },
    //{TILES_X: 27, TILES_Z: 21, FLOORS_NUM: 10}
]

const N_LEVELS_START = 2
//const N_LEVELS_START = 4
const N_LEVELS = 10
//const N_LEVELS = 2
for (let i = N_LEVELS_START; i < N_LEVELS; i += 1) {
    let n = i * 2
    if (n % 2 === 0) {
        n += 1
    }
    LABS_CONF.push({ TILES_X: n, TILES_Z: n, FLOORS_NUM: i })
}


export const CONSTANTS = {
    PHISICS_CONF, 
    LABS_CONF,
    PLAYER_START_POS,
    ENERGY_FIRST_POS,
    ENERGY_PERCENTAGE_MUST_GET,
}