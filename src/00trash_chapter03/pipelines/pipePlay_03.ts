import { Root } from '../index'
import { pause } from '_CORE/helpers/htmlHelpers'

export const pipePlay_03 = async (root: Root, currentIndexLevel = 0) => {

    console.log('[MESSAGE:] START PLAY LEVEL: ', currentIndexLevel)

    const { ui } = root

    await pause(3000000)

    ui.showFinalPage()
}
