import { Ticker } from "_CORE/Ticker"
import { Keyboard } from "_CORE/Keyboard"
import { Phisics } from "_CORE/Phisics"
import { ControlsSystem } from "_CORE/controls/ControlsSystem"
import { DeviceData } from "_CORE/DeviceData"
import { Studio } from "_CORE/Studio"
import { LoaderAssets } from "_CORE/Loader"

import { CONSTANTS, STUDIO_CONF, CONTROLS_CONF, LOAD_ASSETS } from "./constants/CONSTANTS"

import { Floor } from "./entities/Floor"
import { Particles } from './entities/Particles'
//import { LoaderAssets } from "./entities/Loader";

import { UiCustom } from "./entities/Ui"

//import { Labyrinth } from './entityLabyrinth/Labyrinth'
import { Labyrinth } from './EntityLab02/Lab02'
import { AudioManagerCustom } from "./entities/AudioManagerCustom"
import { Materials } from "./entities/Materials"
import { pipeInit_05 } from "./pipelines/pipeInit_05"
import { pipePlay_05 } from "./pipelines/pipePlay_05"
import { pipeEnd_05 } from "./pipelines/pipeEnd_05"
import { Core } from '_CORE/types'

export interface Root extends Core {
    CONSTANTS: typeof CONSTANTS,
    ui: UiCustom,
    controls: ControlsSystem,
    floor: Floor,
    particles: Particles,

    LOAD_ASSETS: typeof LOAD_ASSETS,
    loader: LoaderAssets,

    lab: Labyrinth,
    audio: AudioManagerCustom,
    materials: Materials,
    assets: {
        [key: string]: any
    }
}


window.addEventListener("DOMContentLoaded", async () => {
    // @ts-ignore:next-line
    console.log("branch:" + __GIT_CURRENT_BRANCH__ + ' commit:' + __HASH_COMMIT__)

    const root: Root = {
        CONSTANTS,
        assets: {},
        ticker: new Ticker(),
        studioConf: STUDIO_CONF, 
        studio: new Studio(),
        keyboard: new Keyboard(),

        controlsConf: CONTROLS_CONF,
        controls: new ControlsSystem(),
        
        ui: new UiCustom(),
        floor: new Floor(),
        particles: new Particles(),

        LOAD_ASSETS,
        loader: new LoaderAssets(),
        
        deviceData: new DeviceData(),
        phisics: new Phisics(),
        lab: new Labyrinth(),

        audioConf: { 
            stepsSpeed: 1 
        },
        audio: new AudioManagerCustom(),
        
        materials: new Materials(),
    }

    await pipeInit_05(root)
    await pipePlay_05(root)
    await pipeEnd_05(root)
})
