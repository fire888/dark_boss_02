import { Root } from '../index'
import { update } from '@tweenjs/tween.js'
import { IS_DEV_START_ORBIT } from '../constants/CONSTANTS'
import { Tween, Easing } from '@tweenjs/tween.js'
import { PLAYER_POS_START } from '../constants/CONSTANTS'

export const pipeInit_05 = async (root: Root) => {
    const {
        CONSTANTS, LOAD_ASSETS,
        studio, controls, ui, ticker,
        floor,
        loader, phisics, lab,
        audio, materials, particles, car, body
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
    //studio.addAxisHelper()
    //studio.fog.far = 5
    //studio.fog.near = .2 

    phisics.init(root)
    ticker.on(phisics.update.bind(phisics))
    phisics.createPlayer()
    const camera = studio.camera
    phisics.setPlayerPosition(camera.position.x, camera.position.y, camera.position.z)

    floor.init(root)
    floor.mesh.position.set(0, 0, 0)
    studio.add(floor.mesh)
    
    await lab.init(root)

    particles.init(root)
    ticker.on(particles.update.bind(particles))
    studio.add(particles.m)

    car.init(root)
    root.studio.add(car.getModel())
    phisics.addMeshToCollision(car.getCollision())


    body.init(root)
    
    ui.init(root)
    ui.hideBackgroundStartScreen()

    // const flyCameraToLevel = () => {
    //     const nearStart = 0
    //     const nearEnd = 5
    //     const farStart = .1
    //     const farEnd = 50
    //     return new Promise(res => {        
    //         const obj = { v: 0 }
    //         new Tween(obj)
    //             .easing(Easing.Exponential.InOut)
    //             .to({ v: 1 }, 3000)
    //             .onUpdate(() => {
    //                 studio.camera.position.z = PLAYER_POS_START[2] - (1 - obj.v) * 15
    //                 studio.camera.rotation.x = -Math.PI + (1 - obj.v) * .8
    //                 studio.setFogNearFar(nearStart + (nearEnd - nearStart) * obj.v, farStart + (farEnd - farStart) * obj.v)
    //             })
    //             .onComplete(() => {
    //                 res(true)
    //             })
    //             .start()
    //     })
    // }
    // await flyCameraToLevel()

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
