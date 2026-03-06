import { Studio } from "./Studio";
import { Phisics } from "./Phisics";
import { Ticker } from "./Ticker";
import { DeviceData } from "./DeviceData";
import { Ui } from "./Ui";

export interface Core {
    studio: Studio
    phisics: Phisics
    ticker: Ticker
    deviceData: DeviceData
    ui: Ui
}
