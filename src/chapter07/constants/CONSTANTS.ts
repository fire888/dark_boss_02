import * as THREE from 'three'
import { StudioConf } from "_CORE/types"

export const IS_DEV_START_ORBIT = false
export const IS_SHOW_INFO = true
export const IS_USE_WORKER = true
export const PLAYER_POS_START = [0, 10, 0]

const GRAY_GRAY = {
    "colorB":[0.8199156888754634,0.7804203432654724,0.8838621899028638],
    "colorF":[0.45376361205333049,0.409019673691427,0.4964499205082738],
}

export const STUDIO_CONF: StudioConf = {
    cameraPos: new THREE.Vector3().fromArray(PLAYER_POS_START),
    cameraFov: 90,
    cameraLookAt: new THREE.Vector3().fromArray(PLAYER_POS_START).add(new THREE.Vector3(0, 0, -1)),
    sceneBackground: new THREE.Color().fromArray(GRAY_GRAY.colorB),
    fogParams: { color: new THREE.Color().fromArray(GRAY_GRAY.colorF), near: 0, far: 5},
    directionalLightParams: { 
        color: new THREE.Color(0xffffff), intensity: 8.5,
        pos: new THREE.Vector3(-3, 3, -2)
    }
}