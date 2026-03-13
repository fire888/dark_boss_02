import { Root } from '../index'
import * as THREE from 'three'
import { pause } from '_CORE/helpers/htmlHelpers'
import { Tween, Easing, Interpolation } from '@tweenjs/tween.js'

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

    let currentArea: number = -1
    let isEffect = false
    let countRooms = 0 
    ticker.on(() => {
        const ihdArea = lab.checkArea(currentArea, studio.camera.position.x, studio.camera.position.z)
        if (ihdArea !== currentArea) {
            currentArea = ihdArea
            ++countRooms
        }
        if (countRooms > 3) {
            countRooms = 0            
            const obj = { v: 0 }
            const int = root.studioConf.spotLightParams.intensity
            new Tween(obj)
                .interpolation(Interpolation.Linear)
                .to({ v: 1 }, 1000)
                .onUpdate(() => {
                    studio.setSaturation(isEffect ? 1 - obj.v : obj.v)
                    studio.spotLight.intensity = (isEffect ? obj.v : 1 - obj.v) * int
                })
                .onComplete(() => {
                    isEffect = !isEffect
                })
                .start()
        }
    })

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
