import { Root } from '../index'
import { update } from '@tweenjs/tween.js'
import { IS_DEV_START_ORBIT } from '../constants/CONSTANTS'
import { PLAYER_POS_START } from '../constants/CONSTANTS'
import { pause } from '_CORE/helpers/htmlHelpers'
import { STRUCTURES } from '../Structure03/constants/constants_elements'
import * as THREE from 'three'
import { W, H } from '../Structure03/constants/constants_elements'
import { SCALE } from '../Structure03/constants/const_structures'

export const pipeInit_07 = async (root: Root) => {
    const {
        studio,
        controls,
        ui,
        ticker,
        loader,
        phisics,
        lab,
        backTower,
        audio,
        materials,
        flyer,
        fuel,
    } = root

    loader.init()
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
    phisics.setPlayerPosition(PLAYER_POS_START[0], PLAYER_POS_START[1], PLAYER_POS_START[2], PLAYER_POS_START[3])

    // TEST MESH
    const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
    m.position.set(PLAYER_POS_START[0], PLAYER_POS_START[1], PLAYER_POS_START[2] + 3)
    studio.add(m)
    
    lab.init(root)
    const dataS = STRUCTURES[0]
    await lab.generateStructure(dataS)
    const coordsFuel = lab.getCoordsForItem('fuel')

    flyer.init(root)
    studio.add(flyer.mesh)

    fuel.init(root)
    fuel.mesh.position.set(0, 0, 1000)
    studio.add(fuel.mesh)

    // if (coordsFuel) {
    //     // @ts-ignore
    //     fuel.mesh.position.set(
    //         // @ts-ignore
    //         ((coordsFuel[0] + .5) * W + dataS.X) * SCALE,
    //         // @ts-ignore 
    //         ((coordsFuel[1] + .5) * H + dataS.Y) * SCALE,
    //         // @ts-ignore 
    //         ((coordsFuel[2] + .5) * W + dataS.Z) * SCALE
    //     )
    //     console.log('$$%$% coordsFuel', coordsFuel)
    // }


    ui.init(root)
    ui.setTransparentBackground()
    ui.setEnergyLevel(1)

    root.studio.addFog()
    const { color, near, far } = STRUCTURES[0].FOG
    root.studio.fog.color.set(color)
    root.studio.fog.near = near
    root.studio.fog.far = far

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

    ticker.on(controls.update.bind(controls))
}
