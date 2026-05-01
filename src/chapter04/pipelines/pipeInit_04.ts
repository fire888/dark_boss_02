import { Root } from '../index'
import { update } from '@tweenjs/tween.js'
import { IS_DEV_START_ORBIT } from '../constants/CONSTANTS'
import { Tween, Easing } from '@tweenjs/tween.js'
import { PLAYER_POS_START } from '../constants/CONSTANTS'
import * as THREE from 'three'
import { pause } from '_CORE/helpers/htmlHelpers'

export const pipeInit_04 = async (root: Root) => {
    const {
        LOAD_ASSETS,
        debug,
        studio, controls, ui, ticker,
        loader, phisics, lab, 
        audio, materials, particles,
        changerCurrentLevelPart,
        assets,
        bots
    } = root

    debug.init(root)

    loader.init(root)
    await loader.loadAssets(LOAD_ASSETS)

    ticker.start()

    ticker.on((t: number) => {
        update()
    })

    materials.init(root)

    studio.init(root)
    studio.scene.background = assets.skybox
    ticker.on(studio.render.bind(studio))
    //studio.addAxisHelper()
    studio.fog.far = .8
    studio.fog.near = .1 

    phisics.init(root)
    ticker.on(phisics.update.bind(phisics))
    phisics.createPlayer()
    const camera = studio.camera
    phisics.setPlayerPosition(camera.position.x, camera.position.y, camera.position.z)

    await lab.init(root)

    particles.init(root)
    ticker.on(particles.update.bind(particles))
    studio.add(particles.m)

    await bots.init(root)
    
    ui.init()
    ui.hideBackgroundStartScreen()

    if (IS_DEV_START_ORBIT) {
        await ui.hideStartScreenForce()
    } else {
        await ui.hideStartScreen()
    }

    controls.init(root, IS_DEV_START_ORBIT)
    ticker.on(controls.update.bind(controls))

    audio.init(root)
    ticker.on(audio.update.bind(audio))
    audio.playAmbient()

    changerCurrentLevelPart.init(root)

    await pause(2000)
    await studio.animateFog(({ endFogNear: .01, endFogFar: .02, time: 1000 }))

    bots.moveToInLocation(4)

    await studio.animateFog(({ endFogNear: 1, endFogFar: 30, time: 1000 }))

    bots.startCheckerNearPlayer()

}
