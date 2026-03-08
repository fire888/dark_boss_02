import { Root } from '../index'
import { update } from '@tweenjs/tween.js'
import { IS_DEV_START_ORBIT } from '../constants/CONSTANTS'
import { PLAYER_POS_START } from '../constants/CONSTANTS'
import { pause } from '_CORE/helpers/htmlHelpers'

export const pipelineInit = async (root: Root) => {
    const {
        studio,
        controls,
        ui,
        ticker,
        loader,
        texturesCanvas,
        phisics,
        lab,
        backTower,
        audio,
        materials,
    } = root

    loader.init()
    await loader.loadAssets()

    await texturesCanvas.init()

    ticker.start()

    ticker.on((t: number) => {
        update()
    })

    materials.init(root)

    studio.init(root)
    ticker.on(studio.render.bind(studio))

    phisics.init(root)
    phisics.createPlayer()
    phisics.setPlayerPosition(PLAYER_POS_START[0], PLAYER_POS_START[1], PLAYER_POS_START[2])
    
    await lab.init(root)
    await lab.buildNext('fast')

    await backTower.init(root)
    const TOWER_OFFSET = 900
    root.backTower.setPositionX(phisics.playerBody.position.x + TOWER_OFFSET)
    let n = 100
    ticker.on(() => {
        --n
        if (n < 0) {
            n = 100
            root.backTower.setPositionX(phisics.playerBody.position.x + TOWER_OFFSET)
        }

    })

    ui.init(root)
    ui.setTransparentBackground()

    if (IS_DEV_START_ORBIT) {
        await ui.hideStartScreenForce()
    } else {
        root.studio.addFog()
        await ui.hideStartScreen().then()
    }

    ticker.on(phisics.update.bind(phisics))

    audio.init(root)
    ticker.on(audio.update.bind(audio))
    audio.playAmbient()
    
    controls.init(root, IS_DEV_START_ORBIT)
    controls.setRotation(0, PLAYER_POS_START[3], 0)
    ticker.on(controls.update.bind(controls))
}
