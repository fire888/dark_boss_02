import "_CORE/stylesheets/controls.css"
import { Core } from '_CORE/types'

//import { Studio } from "./entities/Studio"
import { StudioCustom } from "./entities/Studio"
//import { Phisics } from "./entities/Phisics"
import { Phisics } from "_CORE/Phisics"
// import { Ui } from "./entities/Ui"
import { UiCustom } from "./entities/Ui"
import { Keyboard } from "_CORE/Keyboard"
import { ControlsSystem } from "_CORE/controls/ControlsSystem"

import { CONSTANTS, STUDIO_CONF } from "./constants/CONSTANTS"

import { Ticker } from "./entities/Ticker"
import { Floor } from "./entities/Floor"
import { SmallTriangles } from "./entities/SmallTriangles"
import { Particles } from './entities/Particles'
import { LoaderAssets } from "./entities/Loader";
import { DeviceData } from "./entities/DeviceData"


import { EnergySystem } from './entities/EnergySystem'
import { Lab } from './entities/labyrinth/Lab'
import { AudioManager } from "./entities/AudioManager"

import { pipelineInit } from "./pipelines/pipelineInit"
import { pipelinePlay } from "./pipelines/pipelinePlay"
import { pipelineEnd } from "./pipelines/pipelineEnd"

export interface Root extends Core {
    CONSTANTS: typeof CONSTANTS,
    ticker: Ticker,
    studio: StudioCustom,
    controls: ControlsSystem,
    floor: Floor,
    smallTriangles: SmallTriangles,
    particles: Particles,
    loader: LoaderAssets,
    deviceData: DeviceData,
    ui: UiCustom,
    phisics: Phisics,
    energySystem: EnergySystem,
    lab: Lab,
    audio: AudioManager,
}


window.addEventListener("DOMContentLoaded", async () => {
    // @ts-ignore:next-line
    console.log("branch:" + __GIT_CURRENT_BRANCH__ + ' commit:' + __HASH_COMMIT__)

    const root: Root = {
        assets: {},
        studioConf: STUDIO_CONF,
        CONSTANTS,
        ticker: new Ticker(),
        studio: new StudioCustom(),
        keyboard: new Keyboard(),
        controls: new ControlsSystem(),
        ui: new UiCustom(),
        floor: new Floor(),
        smallTriangles: new SmallTriangles(),
        particles: new Particles(),
        loader: new LoaderAssets(),
        deviceData: new DeviceData(),
        phisics: new Phisics(),
        energySystem: new EnergySystem(),
        lab: new Lab(),
        audio: new AudioManager(),
    }

    await pipelineInit(root)
    await pipelinePlay(root)
    await pipelineEnd(root)
})
