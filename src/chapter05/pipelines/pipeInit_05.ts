import { Root } from '../index'
import { update } from '@tweenjs/tween.js'
import { IS_DEV_START_ORBIT } from '../constants/CONSTANTS'

export const pipeInit_05 = async (root: Root) => {
    const {
        LOAD_ASSETS,
        studio, controls, ui, ticker,
        loader, phisics, lab,
        audio, materials, particles, car, body, pers
    } = root

    loader.init(root)
    await loader.loadAssets(LOAD_ASSETS)

    ticker.start()

    ticker.on((t: number) => {
        update()
    })

    materials.init(root)

    studio.init(root)
    ticker.on(studio.render.bind(studio))

    studio.setFogNearFar(0, .1)
    //studio.addAxisHelper()

    phisics.init(root)
    ticker.on(phisics.update.bind(phisics))
    phisics.createPlayer()
    phisics.createCar()
    const camera = studio.camera
    phisics.setPlayerPosition(camera.position.x, camera.position.y, camera.position.z)
    
    await lab.init(root)

    particles.init(root)
    ticker.on(particles.update.bind(particles))
    studio.add(particles.m)

    body.init(root)

    pers.init(root)
    pers.mesh.position.set(10000, 0, 0)
    ticker.on(pers.update.bind(pers))
    
    ui.init(root)

    car.init(root)
    root.studio.add(car.getModel())
    car.add(studio.carCamera)
    phisics.addMeshToCollision(car.getCollision())
    phisics.addMeshToCollision(car.getCheckerPlayerDrive(), false)

    ui.hideBackgroundStartScreen()

    const fogNear = 5
    const fogFar = 80
    studio.animateFog({ endFogNear: fogNear, endFogFar: fogFar, time: 3000 })

    if (IS_DEV_START_ORBIT) {
        await ui.hideStartScreenForce()
    } else {
        await ui.hideStartScreen()
    }

    controls.init(root, IS_DEV_START_ORBIT)
    controls.setRotation(0, Math.PI * .25, 0)
    ticker.on(controls.update.bind(controls))

    audio.init(root)
    ticker.on(audio.update.bind(audio))
    audio.playAmbient()
}
