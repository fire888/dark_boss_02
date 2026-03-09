import { Studio } from "../_CORE/Studio"
import { Keyboard } from "_CORE/Keyboard"
import { ControlsSystem } from "../_CORE/controls/ControlsSystem"
import { Ticker } from "../_CORE/Ticker"
import { LoaderAssets } from "./entities/Loader"
import { DeviceData } from "../_CORE/DeviceData"
import { UiCustom } from "./entities/UiCustom"
import { Phisics } from "../_CORE/Phisics"
import { Structure } from "./Structure03/Structure03"
import { AudioManagerCustom } from "./entities/AudioManagerCustom"
import { Materials } from "./entities/Materials"
import { Flyer } from "./entities/Flyer/Flyer"
import { Fuel } from "./entities/Fuel/Fuel"
import { pipeInit_07 } from "./pipelines/pipeInit_07"
import { pipePlay_07 } from "./pipelines/pipePlay_07"
import { pipeEnd_07 } from "./pipelines/pipeEnd_07"

import { Core } from '_CORE/types'

import { STUDIO_CONF } from "./constants/CONSTANTS"

export interface Root extends Core {
    controls: ControlsSystem,
    loader: LoaderAssets,
    deviceData: DeviceData,
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
        studio: new Studio(),
        keyboard: new Keyboard(),
        ticker: new Ticker(),
        ui: new UiCustom(),
        controls: new ControlsSystem(),

        loader: new LoaderAssets(),
        deviceData: new DeviceData(),
        phisics: new Phisics(),
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
