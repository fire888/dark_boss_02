import { Root } from '../index'
import { update } from '@tweenjs/tween.js'
import { IS_DEV_START_ORBIT } from '../constants/CONSTANTS'
import { PLAYER_POS_START } from '../constants/CONSTANTS'
import { STRUCTURES } from '../Structure03/constants/constants_elements'
import { SCALE } from 'chapter07/Structure03/constants/const_structures'

export const pipeInit_07 = async (root: Root) => {
    const {
        studio,
        controls,
        ui,
        ticker,
        loader,
        phisics,
        lab,
        audio,
        materials,
        flyer,
        fuel,
    } = root

    loader.init(root)
    await loader.loadAssets()

    ticker.start()

    ticker.on((t: number) => {
        update()
    })

    materials.init(root)

    studio.init(root)
    studio.setSceneBackground(STRUCTURES[0].ENV_COLOR.toArray())
    ticker.on(studio.render.bind(studio))

    phisics.init(root)
    phisics.createPlayer()
    phisics.setPlayerPosition(PLAYER_POS_START[0], PLAYER_POS_START[1], PLAYER_POS_START[2])

    lab.init(root)
    const dataS = STRUCTURES[0]
    await lab.generateStructure(dataS)

    flyer.init(root)
    studio.add(flyer.mesh)

    fuel.init(root)
    fuel.mesh.position.set(0, 0, 1000)
    studio.add(fuel.mesh)

    ui.init(root)
    ui.setTransparentBackground()
    ui.setEnergyLevel(1)

    root.studio.addFog()
    const { color, near, far } = STRUCTURES[0].FOG
    root.studio.fog.color.set(color)
    root.studio.fog.near = near * SCALE
    root.studio.fog.far = far * SCALE

    if (IS_DEV_START_ORBIT) {
        await ui.hideStartScreenForce()
    } else {
        await ui.hideStartScreen().then()
    }

    ticker.on(phisics.update.bind(phisics))

    audio.init(root)
    ticker.on(audio.update.bind(audio))
    audio.playAmbient()
    
    controls.init(root, IS_DEV_START_ORBIT)
    //controls.setRotation(0, 0, 0)
    ticker.on(controls.update.bind(controls))
}
