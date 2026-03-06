import "./stylesheets/controls.css"
import { Studio } from "./entities/Studio"
import { ControlsSystem } from "./entities/controls/ControlsSystem"
import { Ticker } from "./entities/Ticker"
import { LoaderAssets } from "./entities/Loader"
import { TexturesCanvas } from "entities/TexturesCanvas"
import { DeviceData } from "./entities/DeviceData"
import { Ui } from "./entities/Ui"
import { Phisics } from "./entities/Phisics"
import { Labyrinth } from './entityLab01/Lab'
import { BackTower } from "./entities/BackTower"
import { AudioManager } from "./entities/AudioManager"
import { Materials } from "./entities/Materials"
import { pipelineInit } from "./pipelines/pipelineInit"
import { pipelinePlay } from "./pipelines/pipelinePlay"
import { pipelineEnd } from "./pipelines/pipelineEnd"

export type Root = {
    ticker: Ticker,
    studio: Studio,
    controls: ControlsSystem,
    loader: LoaderAssets,
    texturesCanvas: TexturesCanvas,
    deviceData: DeviceData,
    ui: Ui,
    phisics: Phisics,
    lab: Labyrinth,
    backTower: BackTower,
    audio: AudioManager,
    materials: Materials,
}


window.addEventListener("DOMContentLoaded", async () => {
    // @ts-ignore:next-line
    console.log("branch:" + __GIT_CURRENT_BRANCH__ + ' commit:' + __HASH_COMMIT__)

    const root: Root = {
        ticker: new Ticker(),
        studio: new Studio(),
        controls: new ControlsSystem(),
        ui: new Ui(),
        loader: new LoaderAssets(),
        texturesCanvas: new TexturesCanvas(),
        deviceData: new DeviceData(),
        phisics: new Phisics(),
        lab: new Labyrinth(),
        backTower: new BackTower(),
        audio: new AudioManager(),
        materials: new Materials()
    }

    await pipelineInit(root)
    await pipelinePlay(root)
    await pipelineEnd(root)
})
