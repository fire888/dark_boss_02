import * as THREE from 'three'
import { StudioConf, ControlsConf } from '_CORE/types'

type LevelCof = {
    TILES_X: number,
    TILES_Z: number,
    FLOORS_NUM: number  
}

export const vC_H = 4.5

const PHISICS_CONF = {
    IS_DEBUG: false
}

const PLAYER_START_POS: number[] = [15.076315508474185, .7, -10, Math.PI]
const ENERGY_FIRST_POS: number[] = [15.076315508474185, 0, -4]
const ENERGY_PERCENTAGE_MUST_GET: number = .3


export const STUDIO_CONF: StudioConf = {
    hemisphereLightParams: {
        skyColor: new THREE.Color().setHex(0x6767f3),
        groundColor: new THREE.Color().set(0xffffff),
        intensity: 5,
        pos: new THREE.Vector3(0, 20, 0)
    },
    cameraPos: new THREE.Vector3().fromArray(PLAYER_START_POS),
    cameraLookAt: new THREE.Vector3().fromArray(PLAYER_START_POS).add(new THREE.Vector3(0, 0, 1)),
    cameraFov: 75,
    //cameraPos: new THREE.Vector3(1, 30, 70),
    //cameraLookAt: new THREE.Vector3(1, 30, 73),
    // cameraLookAt: new THREE.Vector3().fromArray(PLAYER_START_POS)
    //     .add(new THREE.Vector3(0, 0, 1)
    //     .applyAxisAngle(new THREE.Vector3(0, 1, 0), PLAYER_START_POS[3])),
    SSMA: true,
    bokehPass: { focus: 50, aperture: 0.00002, maxblur: 0.01 }
}

export const CONTROLS_CONF: ControlsConf = {
    playerSpeedForward: 6.5,
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