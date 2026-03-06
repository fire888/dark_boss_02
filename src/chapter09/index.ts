import { Ticker } from "_CORE/Ticker"
import { Phisics } from "_CORE/Phisics"
import { ControlsSystem } from "_CORE/controls/ControlsSystem"
import { DeviceData } from "_CORE/DeviceData"
import { Studio } from "_CORE/Studio"

import { CONSTANTS, STUDIO_CONF } from "./constants/CONSTANTS"



import { Floor } from "./entities/Floor"
import { Particles } from './entities/Particles'
import { LoaderAssets } from "./entities/Loader";

import { UiCustom } from "./entities/Ui"

import { Labyrinth } from './entityLabyrinth/Labyrinth'
import { EnergySystem } from "./entities/EnergySystem"
import { AntigravSystem } from "./entities/AntigravSystem"
import { AntigravLast } from "./entities/AntigravLast"
import { AudioManager } from "./entities/AudioManager"
import { Materials } from "./entities/Materials"
import { pipelineInit } from "./pipelines/pipelineInit"
import { pipelinePlay } from "./pipelines/pipelinePlay"
import { pipelineEnd } from "./pipelines/pipelineEnd"
import { Core } from '_CORE/types'

export interface Root extends Core {
    CONSTANTS: typeof CONSTANTS,
    ui: UiCustom,
    controls: ControlsSystem,
    floor: Floor,
    particles: Particles,
    loader: LoaderAssets,
    lab: Labyrinth,
    audio: AudioManager,
    materials: Materials,
    energySystem: EnergySystem,
    antigravSystem: AntigravSystem,
    antigravLast: AntigravLast,
}


window.addEventListener("DOMContentLoaded", async () => {
    // @ts-ignore:next-line
    console.log("branch:" + __GIT_CURRENT_BRANCH__ + ' commit:' + __HASH_COMMIT__)

    const root: Root = {
        CONSTANTS,
        ticker: new Ticker(),
        studioConf: STUDIO_CONF, 
        studio: new Studio(),
        controls: new ControlsSystem(),
        ui: new UiCustom(),
        floor: new Floor(),
        particles: new Particles(),
        loader: new LoaderAssets(),
        deviceData: new DeviceData(),
        phisics: new Phisics(),
        lab: new Labyrinth(),
        audio: new AudioManager(),
        materials: new Materials(),
        energySystem: new EnergySystem(),
        antigravSystem: new AntigravSystem(),
        antigravLast: new AntigravLast(),
    }

    await pipelineInit(root)
    await pipelinePlay(root)
    await pipelineEnd(root)
})
