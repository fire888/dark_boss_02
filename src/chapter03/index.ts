// Глава 03: бесконечный уровень из кусков geometry/06_complex02 — главный путь вперёд и тупиковые отростки; куски строятся в Web Worker.
// Каркас — как в chapter10: Studio, физика, ходьба, звук.

import { Studio } from "_CORE/Studio"
import { Keyboard } from "_CORE/Keyboard"
import { ControlsSystem } from "_CORE/controls/ControlsSystem"
import { Ticker } from "_CORE/Ticker"
import { DeviceData } from "_CORE/DeviceData"
import { Ui } from "_CORE/Ui"
import { Phisics } from "_CORE/Phisics"
import { AudioManager } from "_CORE/AudioManager"
import { Core } from '_CORE/types'

import { LoaderAssets } from "./entities/Loader"
import { Materials } from "./entities/Materials"
import { InfiniteLevel } from "./level/InfiniteLevel"
import { pipelineInit } from "./pipelines/pipelineInit"
import { pipelinePlay } from "./pipelines/pipelinePlay"
import { STUDIO_CONF, CONTROLS_CONF } from "./constants/CONSTANTS"

export interface Root extends Core {
    loader: LoaderAssets,
    materials: Materials,
    level: InfiniteLevel,
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
        controlsConf: CONTROLS_CONF,
        controls: new ControlsSystem(),
        deviceData: new DeviceData(),
        phisics: new Phisics(),
        audio: new AudioManager(),

        loader: new LoaderAssets(),
        materials: new Materials(),
        level: new InfiniteLevel(),
    }

    await pipelineInit(root)
    await pipelinePlay(root)
})
