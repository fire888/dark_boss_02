import { Root } from "../index"

export const pipelineEnd = async (root: Root) => {
    const {
        CONSTANTS,
        studio,
        controls,
        ui,
        phisics,
        lab,
    } = root


    controls.disable()
    // setTimeout(() => {
    //     studio.showFinalView()
    // }, 600)
    await ui.showFinalPage()
}
