import { Root } from "../index"

export const pipelineEnd = async (root: Root) => {
    const {
        CONSTANTS,
        studio,
        controls,
        ui,
        phisics,
        energySystem,
        lab,
    } = root


    controls.disable()
    setTimeout(() => {
        studio.camera.position.set(17.5, 1, -6)
        studio.camera.lookAt(14, .5, 0)
        lab.init(root, CONSTANTS.LABS_CONF[0])
        energySystem.init(root, [])
    }, 600)
    await ui.showFinalPage()
}
