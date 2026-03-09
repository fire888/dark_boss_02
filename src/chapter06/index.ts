import { Ticker } from "_CORE/Ticker"
import { Keyboard } from "_CORE/Keyboard"
import { Phisics } from "_CORE/Phisics"
import { ControlsSystem } from "_CORE/controls/ControlsSystem"
import { DeviceData } from "_CORE/DeviceData"
import { Studio } from "_CORE/Studio"

import { CONSTANTS, STUDIO_CONF } from "./constants/CONSTANTS"

import { Floor } from "./entities/Floor"
import { Particles } from './entities/Particles'
import { LoaderAssets } from "./entities/Loader";

import { UiCustom } from "./entities/Ui"

//import { Labyrinth } from './entityLabyrinth/Labyrinth'
import { Labyrinth } from './EntityLab02/Lab02'
import { AudioManagerCustom } from "./entities/AudioManagerCustom"
import { Materials } from "./entities/Materials"
import { pipeInit_06 } from "./pipelines/pipeInit_06"
import { pipePlay_06 } from "./pipelines/pipePlay_06"
import { pipeEnd_06 } from "./pipelines/pipeEnd_06"
import { Core } from '_CORE/types'
import { T_Assets } from "./types/GeomTypes"

export interface Root extends Core {
    CONSTANTS: typeof CONSTANTS,
    ui: UiCustom,
    controls: ControlsSystem,
    floor: Floor,
    particles: Particles,
    loader: LoaderAssets,
    lab: Labyrinth,
    audio: AudioManagerCustom,
    materials: Materials,
    assets: T_Assets
}


window.addEventListener("DOMContentLoaded", async () => {
    // @ts-ignore:next-line
    console.log("branch:" + __GIT_CURRENT_BRANCH__ + ' commit:' + __HASH_COMMIT__)

    const root: Root = {
        CONSTANTS,
        assets: {
            sprite: null,
            soundAmbient: null,
            soundStepsMetal: null,
            soundBzink: null,
            soundDoor: null,
            soundFly: null,
            roadImg: null,
            lightMap: null,
            mapWall_01: null,
            noise00: null,
        },
        ticker: new Ticker(),
        studioConf: STUDIO_CONF, 
        studio: new Studio(),
        keyboard: new Keyboard(),
        controls: new ControlsSystem(),
        ui: new UiCustom(),
        floor: new Floor(),
        particles: new Particles(),
        loader: new LoaderAssets(),
        deviceData: new DeviceData(),
        phisics: new Phisics(),
        lab: new Labyrinth(),
        audio: new AudioManagerCustom(),
        materials: new Materials(),
    }

    await pipeInit_06(root)
    await pipePlay_06(root)
    await pipeEnd_06(root)
})
