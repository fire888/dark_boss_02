import { Root } from '../index'
import * as THREE from 'three'
import { pause } from '_CORE/helpers/htmlHelpers'

export const pipePlay_06 = async (root: Root, currentIndexLevel = 0) => {
    console.log('[MESSAGE:] START PLAY LEVEL: ', currentIndexLevel)
    
    const {
        phisics,
        ticker,
        ui,
        controls,
        studio,
        particles,
        lab,
        audio,
        materials,
    } = root

    //studio.setFogNearFar(.2, 1)
    //ui.toggleVisibleDark(false)
    //particles.startFlyPlayerAround()
    //phisics.stopPlayerBody()
    //ui.setEnergyLevel(0)
    //phisics.switchToGravity()

    //controls.setRotation(0, Math.PI, 0)
    //controls.enableMove()
    //ui.toggleVisibleEnergy(true)

    await pause(100000000)
    //await ui.hideStartScreen()
    
}
