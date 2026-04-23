import { Root } from '../index'
import { pause } from '_CORE/helpers/htmlHelpers'

export const pipePlay_04 = async (root: Root, currentIndexLevel = 0) => {
    console.log('[MESSAGE:] START PLAY LEVEL: ', currentIndexLevel)
    await pause(10000000)
    console.log('[MESSAGE:] COMPLETE SCENARIO')
}
