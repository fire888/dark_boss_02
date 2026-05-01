import { Root } from '../index'
import { pause } from '_CORE/helpers/htmlHelpers'

export const pipePlay_04 = async (root: Root) => {
    const { changerCurrentLevelPart, ticker, bots } = root

    console.log('[MESSAGE:] START PLAY LEVEL')

    let levelInd = 0
    ticker.on((t: number) => {
        if (changerCurrentLevelPart.currentLevel !== levelInd) {
            levelInd = changerCurrentLevelPart.currentLevel
            console.log('[MESSAGE:] level index:', levelInd)

            if (levelInd === 12) { 
                bots.moveToInLocation(13)
            }
            if (levelInd === 19) { 
                bots.moveToInLocation(19)
            }
        }
    })

    const waitEnd = () => { 
        return new Promise((resolve) => {
            const check = () => {
                if (changerCurrentLevelPart.currentLevel === 20) { 
                    resolve(true)
                } else { 
                    setTimeout(check, 1000)
                }
            }
            check()
        })
    }

    await waitEnd()

    await pause(10000)

    console.log('[MESSAGE:] COMPLETE SCENARIO')
}
