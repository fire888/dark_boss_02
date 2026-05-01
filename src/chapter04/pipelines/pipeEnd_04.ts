import { Root } from "../index"

export const pipeEnd_04 = async (root: Root) => {
    const { studio, ui, controls } = root

    await studio.animateFog({ endFogNear: .3, endFogFar: .5 , time: 5000 })

    controls.disable()
    controls.unlockPointer()
    setTimeout(() => ui.toggleControlsArrows(false), 500)
    
    await ui.showFinalPage()
}
