import "./stylesheets/controls.css"
import { CONSTANTS } from "./constants/CONSTANTS"
import { Studio } from "./entities/Studio"
import { ControlsSystem } from "./entities/controls/ControlsSystem"
import { Ticker } from "./entities/Ticker"
import { Floor } from "./entities/Floor"
import { Particles } from './entities/Particles'
import { LoaderAssets } from "./entities/Loader";
import { DeviceData } from "./entities/DeviceData"
import { Ui } from "./entities/Ui"
import { Phisics } from "./entities/Phisics"
import { Labyrinth } from './entityLabyrinth/Labyrinth'
import { EnergySystem } from "./entities/EnergySystem"
import { AntigravSystem } from "./entities/AntigravSystem"
import { AntigravLast } from "./entities/AntigravLast"
import { AudioManager } from "./entities/AudioManager"
import { Materials } from "./entities/Materials"
import { pipelineInit } from "./pipelines/pipelineInit"
import { pipelinePlay } from "./pipelines/pipelinePlay"
import { pipelineEnd } from "./pipelines/pipelineEnd"

export type Root = {
    CONSTANTS: typeof CONSTANTS,
    ticker: Ticker,
    studio: Studio,
    controls: ControlsSystem,
    floor: Floor,
    particles: Particles,
    loader: LoaderAssets,
    deviceData: DeviceData,
    ui: Ui,
    phisics: Phisics,
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
        studio: new Studio(),
        controls: new ControlsSystem(),
        ui: new Ui(),
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
