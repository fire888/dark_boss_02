import { Root } from '../index'
import { pause } from '_CORE/helpers/htmlHelpers'
import * as THREE from 'three'



export const pipePlay_04 = async (root: Root) => {
    const { changerCurrentLevelPart, ticker, bots } = root

    console.log('[MESSAGE:] START PLAY LEVEL: ')

    let levelInd = 0
    ticker.on((t: number) => {
        if (changerCurrentLevelPart.currentLevel !== levelInd) {
            levelInd = changerCurrentLevelPart.currentLevel
            console.log('CHANGE LEVEL PART', levelInd)

            if (levelInd === 12) { 
                bots.moveToInLocation(13)
            }
            if (levelInd === 19) { 
                bots.moveToInLocation(19)
            }
        }
    })

    await pause(10000000)
    console.log('[MESSAGE:] COMPLETE SCENARIO')
}
