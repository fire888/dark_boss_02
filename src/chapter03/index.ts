import { Ticker } from "_CORE/Ticker"
import { Keyboard } from "_CORE/Keyboard"
import { Phisics } from "_CORE/Phisics"
import { ControlsSystem } from "_CORE/controls/ControlsSystem"
import { DeviceData } from "_CORE/DeviceData"
import { LoaderAssets } from "_CORE/Loader"

import { CONSTANTS, STUDIO_CONF, CONTROLS_CONF, LOAD_ASSETS } from "./constants/CONSTANTS"

import { Particles } from './entities/Particles'

import { UiCustom } from "./entities/UiCustom"

//import { Labyrinth } from './entityLabyrinth/Labyrinth'
import { Labyrinth } from './entities/Lab03/Lab03'
import { AudioManagerCustom } from "./entities/AudioManagerCustom"
import { Materials } from "./entities/Materials"
import { pipeInit_03 } from "./pipelines/pipeInit_03"
import { pipePlay_03 } from "./pipelines/pipePlay_03"
import { pipeEnd_03 } from "./pipelines/pipeEnd_03"
import { Core } from '_CORE/types'

//import { Car } from "./entities/Car"
import { Body } from "./entities/Body"
import { Pers } from './entities/Pers'
import { StudioCustom } from "./entities/StudioCustom"

export interface Root extends Core {
    studio: StudioCustom
    CONSTANTS: typeof CONSTANTS,
    ui: UiCustom,
    controls: ControlsSystem,
    particles: Particles,

    LOAD_ASSETS: typeof LOAD_ASSETS,
    loader: LoaderAssets,

    lab: Labyrinth,
    audio: AudioManagerCustom,
    materials: Materials,
    assets: {
        [key: string]: any
    },
    // car: Car,
    body: Body
    pers: Pers
}


window.addEventListener("DOMContentLoaded", async () => {
    // @ts-ignore:next-line
    console.log("branch:" + __GIT_CURRENT_BRANCH__ + ' commit:' + __HASH_COMMIT__)

    const root: Root = {
        CONSTANTS,
        assets: {},
        ticker: new Ticker(),
        studioConf: STUDIO_CONF, 
        studio: new StudioCustom(),
        keyboard: new Keyboard(),

        controlsConf: CONTROLS_CONF,
        controls: new ControlsSystem(),
        
        ui: new UiCustom(),
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
        // car: new Car(),
        body: new Body(),
        pers: new Pers(),
    }

    await pipeInit_03(root)
    await pipePlay_03(root)
    await pipeEnd_03(root)
})
