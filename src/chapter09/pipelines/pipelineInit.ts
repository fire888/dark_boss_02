import { pause } from '_CORE/helpers/htmlHelpers'
import { Root } from '../index'
import { update } from '@tweenjs/tween.js'
import { COLOR_FOG_PLAY, IS_DEV_START_ORBIT, LEVELS } from '../constants/CONSTANTS'
import * as THREE from 'three'
import { createChangerGameTheme } from '../helpers/changerGameTheme'

export const pipelineInit = async (root: Root) => {
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
        deviceData,
        particles,
        energySystem,
        antigravSystem,
        antigravLast,
    } = root

    loader.init()
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
    phisics.createPlayerPhisicsBody([0, 0, 0])

    floor.init(root)
    studio.add(floor.mesh)
    
    await lab.init(root)
    await lab.build(LEVELS[0])

    energySystem.init(root, lab.positionsEnergy)
    antigravSystem.init(root, lab.positionsAntigravs)
    antigravLast.init(root, new THREE.Vector3(
        LEVELS[0].positionTeleporter[0], 0, LEVELS[0].positionTeleporter[1]
    ))

    if (!IS_DEV_START_ORBIT) {
        studio.setFogNearFar(.2, 1)
    }

    particles.init(root)
    ticker.on(particles.update.bind(particles))
    studio.add(particles.m)

    ui.init(root)
    ui.setEnergyLevel(0)

    materials.changeWallMaterial(LEVELS[0].theme.materialWalls)
    materials.changeRoadMaterial(LEVELS[0].theme.materialRoad)
    materials.changeDesertMaterial(LEVELS[0].theme.materialGround)

    if (IS_DEV_START_ORBIT) {
        await ui.hideStartScreenForce()
    } else {
        await ui.hideStartScreen()
    }

    audio.init(root)
    ticker.on(audio.update.bind(audio))
    audio.playAmbient()
    
    controls.init(root, IS_DEV_START_ORBIT)
    ticker.on(controls.update.bind(controls))

    await pause(100)
    
    if (!IS_DEV_START_ORBIT) {
        controls.disconnect()
        const startPos = [LEVELS[0].playerStartPosition[0], .7, LEVELS[0].playerStartPosition[1]]
        await studio.cameraFlyToLevel(startPos)
        phisics.setPlayerPosition(...startPos)
        studio.animateFogTo(LEVELS[0].fogFar, LEVELS[0].theme.fogColor, 4000)
        studio.animateBackgroundTo(LEVELS[0].theme.sceneBackground, 3000)
        studio.animateLightTo(LEVELS[0].theme.dirLightColor, LEVELS[0].theme.ambientLightColor, 3000)
        controls.connect()
    }

    createChangerGameTheme(root)
}
