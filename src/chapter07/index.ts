import * as CORE from '../_CORE'

import { LoaderAssets } from "./entities/Loader"
import { UiCustom } from "./entities/UiCustom"
import { Structure } from "./Structure03/Structure03"
import { AudioManagerCustom } from "./entities/AudioManagerCustom"
import { Materials } from "./entities/Materials"
import { Flyer } from "./entities/Flyer/Flyer"
import { Fuel } from "./entities/Fuel/Fuel"
import { pipeInit_07 } from "./pipelines/pipeInit_07"
import { pipePlay_07 } from "./pipelines/pipePlay_07"
import { pipeEnd_07 } from "./pipelines/pipeEnd_07"

import { STUDIO_CONF } from "./constants/CONSTANTS"

export interface Root extends CORE.Core {
    loader: LoaderAssets,
    lab: Structure,
    audio: AudioManagerCustom,
    materials: Materials,
    flyer: Flyer
    fuel: Fuel
    ui: UiCustom
}


window.addEventListener("DOMContentLoaded", async () => {
    // @ts-ignore:next-line
    console.log("branch:" + __GIT_CURRENT_BRANCH__ + ' commit:' + __HASH_COMMIT__)

    const root: Root = {
        assets: {},
        studioConf: STUDIO_CONF,
        studio: new CORE.Studio(),
        keyboard: new CORE.Keyboard(),
        ticker: new CORE.Ticker(),
        ui: new UiCustom(),
        controls: new CORE.ControlsSystem(),

        loader: new LoaderAssets(),
        deviceData: new CORE.DeviceData(),
        phisics: new CORE.Phisics(),
        lab: new Structure(),

        audioConf: {
            stepsVolume: .15, 
            ambientVolume: .06,
        }, 
        audio: new AudioManagerCustom(),
        materials: new Materials(),
        flyer: new Flyer(),
        fuel: new Fuel(),
    }

    await pipeInit_07(root)
    await pipePlay_07(root)
    await pipeEnd_07(root)
})
