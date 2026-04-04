import { Ticker } from "_CORE/Ticker"
import { Keyboard } from "_CORE/Keyboard"
import { Phisics } from "_CORE/Phisics"
import { ControlsSystem } from "_CORE/controls/ControlsSystem"
import { DeviceData } from "_CORE/DeviceData"
import { Studio } from "_CORE/Studio"
import { LoaderAssets } from "_CORE/Loader"

import { CONSTANTS, STUDIO_CONF, CONTROLS_CONF, LOAD_ASSETS } from "./constants/CONSTANTS"

import { Particles } from './entities/Particles'
//import { LoaderAssets } from "./entities/Loader";

import { UiCustom } from "./entities/Ui"

import { Lab03 } from './EntLab03/Lab03'
import { AudioManagerCustom } from "./entities/AudioManagerCustom"
import { Materials } from "./entities/Materials"
import { pipeInit_04 } from "./pipelines/pipeInit_04"
import { pipePlay_04 } from "./pipelines/pipePlay_04"
import { pipeEnd_04 } from "./pipelines/pipeEnd_04"
import { Core } from '_CORE/types'

export interface Root extends Core {
    CONSTANTS: typeof CONSTANTS,
    ui: UiCustom,
    controls: ControlsSystem,
    particles: Particles,

    LOAD_ASSETS: typeof LOAD_ASSETS,
    loader: LoaderAssets,

    lab: Lab03,
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
        particles: new Particles(),

        LOAD_ASSETS,
        loader: new LoaderAssets(),
        
        deviceData: new DeviceData(),
        phisics: new Phisics(),
        lab: new Lab03(),

        audioConf: { 
            stepsSpeed: 1 
        },
        audio: new AudioManagerCustom(),
        
        materials: new Materials(),
    }

    await pipeInit_04(root)
    await pipePlay_04(root)
    await pipeEnd_04(root)
})
