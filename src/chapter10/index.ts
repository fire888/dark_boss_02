import "_CORE/stylesheets/controls.css"
import { Studio } from "../_CORE/Studio"
import { ControlsSystem } from "../_CORE/controls/ControlsSystem"
import { Ticker } from "../_CORE/Ticker"
import { LoaderAssets } from "./entities/Loader"
import { TexturesCanvas } from "chapter10/entities/TexturesCanvas"
import { DeviceData } from "../_CORE/DeviceData"
import { Ui } from "../_CORE/Ui"
import { Phisics } from "../_CORE/Phisics"
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
