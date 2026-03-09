import * as THREE from "three";
import { Studio } from "./Studio";
import { Phisics } from "./Phisics";
import { Ticker } from "./Ticker";
import { DeviceData } from "./DeviceData";
import { Keyboard } from "./Keyboard";
import { AudioManager } from "./AudioManager";
import { Ui } from "./Ui";
import { ControlsSystem } from "./controls/ControlsSystem";

export const FORWARD = 'FORWARD'
export const BACKWARD = 'BACKWARD'
export const LEFT = 'LEFT'
export const RIGHT = 'RIGHT'
export const JUMP = 'JUMP'

export type T_Keys = typeof FORWARD | typeof BACKWARD | typeof LEFT | typeof RIGHT | typeof JUMP

export type T_Callbacks = {
    [key: string]: ((is: boolean) => void)[]
}

type SpotLightConf = {
    color: THREE.Color
    pos: THREE.Vector3
    intensity: number
    angle: number
    penumbra: number
    decay: number
    distance: number
    targetPos: THREE.Vector3
}

type HemisphereLightConf = {
    skyColor: THREE.Color
    groundColor: THREE.Color
    intensity: number
    pos: THREE.Vector3
}

type T_assets = {
    [key: string]: any
}

export type StudioConf = {
    cameraPos: THREE.Vector3
    cameraFov?: number,
    cameraLookAt: THREE.Vector3
    spotLightParams?: SpotLightConf
    ambientLightParams?: { color?: THREE.Color, intensity?: number }
    directionalLightParams?: { color?: THREE.Color, intensity?: number, pos?: THREE.Vector3 }
    hemisphereLightParams?: HemisphereLightConf
    sceneBackground?: THREE.Color
    fogParams?: { color?: THREE.Color, near?: number, far?: number }
    SSAO?: {
        kernelRadius: number, minDistance: number, maxDistance: number, enabled: boolean
    },
    SSMA?: boolean
    bokehPass?: { focus: number, aperture: number, maxblur: number }
} 

export interface Core {
    assets: T_assets
    studioConf: StudioConf
    studio: Studio
    
    keyboard: Keyboard
    phisics: Phisics
    ticker: Ticker
    deviceData: DeviceData
    ui: Ui
    controls: ControlsSystem

    audioConf?: {
        stepsVolume?: number
        ambientVolume?: number
        [key: string]: any
    } 
    audio: AudioManager
}
