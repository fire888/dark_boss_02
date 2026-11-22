import { update as updateTweens } from '@tweenjs/tween.js'
import { Root } from '../index'
import { IS_DEV_START_ORBIT } from '../constants/CONSTANTS'

export const pipelineInit = async (root: Root) => {
    const { studio, controls, ui, ticker, loader, phisics, audio, materials, level } = root

    loader.init(root)
    await loader.loadAssets()

    ticker.start()
    // твины: на них ControlsSystem разгоняет скорость ходьбы
    ticker.on(() => updateTweens())

    materials.init()

    studio.init(root)
    ticker.on(studio.render.bind(studio))

    phisics.init(root)
    phisics.createPlayer()

    // первый кусок строится до кнопки старта, игрок ставится в него
    level.init(root)
    await level.start()

    ui.init(root)
    ui.setTransparentBackground()
    if (IS_DEV_START_ORBIT) {
        await ui.hideStartScreenForce()
    } else {
        await ui.hideStartScreen()
    }

    ticker.on(phisics.update.bind(phisics))

    audio.init(root)
    ticker.on(audio.update.bind(audio))
    audio.playAmbient()

    controls.init(root, IS_DEV_START_ORBIT)
    // лицом по +x — туда уходит цепочка комплексов
    controls.setRotation(0, Math.PI * 1.5, 0)
    ticker.on(controls.update.bind(controls))
}
