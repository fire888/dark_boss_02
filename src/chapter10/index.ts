import { Studio } from "../_CORE/Studio"
import { Keyboard } from "_CORE/Keyboard"
import { ControlsSystem } from "../_CORE/controls/ControlsSystem"
import { Ticker } from "../_CORE/Ticker"
import { LoaderAssets } from "./entities/Loader"
import { TexturesCanvas } from "chapter10/entities/TexturesCanvas"
import { DeviceData } from "../_CORE/DeviceData"
import { Ui } from "../_CORE/Ui"
import { Phisics } from "../_CORE/Phisics"
import { Labyrinth } from './entityLab01/Lab'
import { BackTower } from "./entities/BackTower"
import { AudioManager } from "../_CORE/AudioManager"
import { Materials } from "./entities/Materials"
import { pipelineInit } from "./pipelines/pipelineInit"
import { pipelinePlay } from "./pipelines/pipelinePlay"
import { pipelineEnd } from "./pipelines/pipelineEnd"

import { Core } from '_CORE/types'

import { STUDIO_CONF } from "./constants/CONSTANTS"

export interface Root extends Core {
    controls: ControlsSystem,
    loader: LoaderAssets,
    texturesCanvas: TexturesCanvas,
    deviceData: DeviceData,
    lab: Labyrinth,
    backTower: BackTower,
    audio: AudioManager,
    materials: Materials,
}


window.addEventListener("DOMContentLoaded", async () => {
    // @ts-ignore:next-line
    console.log("branch:" + __GIT_CURRENT_BRANCH__ + ' commit:' + __HASH_COMMIT__)

    const root: Root = {
        assets: {},
        studioConf: STUDIO_CONF,
        studio: new Studio(),
        ticker: new Ticker(),
        keyboard: new Keyboard(),
        ui: new Ui(),
        controls: new ControlsSystem(),

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
