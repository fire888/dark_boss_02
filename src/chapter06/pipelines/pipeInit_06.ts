import { Root } from '../index'
import { update } from '@tweenjs/tween.js'
import { IS_DEV_START_ORBIT } from '../constants/CONSTANTS'

export const pipeInit_06 = async (root: Root) => {
    const {
        CONSTANTS,
        studio,
        controls,
        ui,
        ticker,
        floor,
        loader,
        phisics,
        lab,
        audio,
        materials,
        particles,
    } = root

    loader.init(root)
    await loader.loadAssets()

    ticker.start()

    ticker.on((t: number) => {
        update()
    })

    materials.init(root)

    studio.init(root)
    ticker.on(studio.render.bind(studio))

    phisics.init(root)
    ticker.on(phisics.update.bind(phisics))
    phisics.createPlayer()
    const camera = studio.camera
    phisics.setPlayerPosition(camera.position.x, camera.position.y, camera.position.z)

    floor.init(root)
    floor.mesh.position.set(0, -1.5, 0)
    studio.add(floor.mesh)
    
    await lab.init(root)

    particles.init(root)
    ticker.on(particles.update.bind(particles))
    studio.add(particles.m)

    ui.init()

    if (IS_DEV_START_ORBIT) {
        await ui.hideStartScreenForce()
    } else {
        //studio.animateFogTo(100, [,3, .3, .3], 4)
        await ui.hideStartScreen()
    }
    controls.init(root, IS_DEV_START_ORBIT)
    controls.setRotation(0, 0, 0)
    ticker.on(controls.update.bind(controls))

    audio.init(root)
    ticker.on(audio.update.bind(audio))
    audio.playAmbient()
}
