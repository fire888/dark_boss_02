import { Root } from '../index'
import { Tween, Interpolation, Easing, update } from '@tweenjs/tween.js'

export const pipelineInit = async (root: Root) => {
    const {
        CONSTANTS,
        studio,
        controls,
        ui,
        ticker,
        floor,
        smallTriangles,
        particles,
        loader,
        phisics,
        energySystem,
        lab,
        audio,
    } = root

    loader.init()
    await loader.loadAssets()

    ticker.start()

    ticker.on((t: number) => {
        update()
    })

    studio.init(root)
    //studio.addAxisHelper()
    ticker.on(studio.render.bind(studio))

    ui.init(root)
    ui.setEnergyLevel(0)

    phisics.init(root)
    ticker.on(phisics.update.bind(phisics))
    phisics.createPlayerPhisicsBody(CONSTANTS.PLAYER_START_POS)

    floor.init(root)
    studio.add(floor.mesh)

    await lab.init(root, CONSTANTS.LABS_CONF[0])
    studio.add(lab.mesh)

    energySystem.init(root, lab.posesSleepEnds)

    smallTriangles.init()
    studio.add(smallTriangles.m)
    smallTriangles.m.position.x = 3 * 5
    smallTriangles.m.position.z = 3 * 5

    particles.init(root)
    ticker.on(particles.update.bind(particles))
    studio.add(particles.m)

    audio.init(root)
    ticker.on(audio.update.bind(audio))

    await ui.hideStartScreen()

    audio.playAmbient()
    controls.init(root)
    ticker.on(controls.update.bind(controls))
}
