import { Root } from "../index"

export const pipeEnd_04 = async (root: Root) => {
    const {
        studio,
        ui,
    } = root

    await studio.animateFog({ endFogNear: .3, endFogFar: .5 , time: 5000 })

    root.controls.disable()
    setTimeout(() => ui.toggleControlsArrows(false), 500)
    await ui.showFinalPage()
}
