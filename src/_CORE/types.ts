import * as THREE from "three";
import { Studio } from "./Studio";
import { Phisics } from "./Phisics";
import { Ticker } from "./Ticker";
import { DeviceData } from "./DeviceData";
import { Ui } from "./Ui";

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

export type StudioConf = {
    cameraPos: THREE.Vector3
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
    studioConf: StudioConf
    studio: Studio
    
    phisics: Phisics
    ticker: Ticker
    deviceData: DeviceData
    ui: Ui
}
