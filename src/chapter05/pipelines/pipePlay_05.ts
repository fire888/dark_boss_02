import { Root } from '../index'
import * as THREE from 'three'
import { pause } from '_CORE/helpers/htmlHelpers'
import { Tween, Easing, Interpolation } from '@tweenjs/tween.js'


const toGreenTheme = async (root: Root) => {
    const { car, body, studio, floor } = root
    car.toggleMat('green')
    studio.setSceneBackgroundCube(root.assets['skyboxGreenStars'])
    studio.setFogColor([0, .8, 0])
    body.hide()
    floor.toGreen()
}


export const pipePlay_05 = async (root: Root, currentIndexLevel = 0) => {

    console.log('[MESSAGE:] START PLAY LEVEL: ', currentIndexLevel)
    // await environmentIterator(root)
    // console.log('[MESSAGE:] COMPLETE SCENARIO')

    const { phisics, ui, keyboard } = root

    let isVisibleDriveCar = false
    phisics.addListenPlayer('collisionCheckerPlayerDrive', 'beginContact', () => {
        ui.showDriveButton()
        isVisibleDriveCar = true
    })
    phisics.addListenPlayer('collisionCheckerPlayerDrive', 'endContact', () => {
        ui.hideDriveButton()
        isVisibleDriveCar = false
    })

    let isAllInGreen = false
    const onEnterCar = async (is: boolean) => {
        if (!isVisibleDriveCar) { 
            return
        }
        if (!isAllInGreen) {
            await toGreenTheme(root)
        }
    }
    const unsubscr = keyboard.on('E', onEnterCar)
    //setTimeout(unsubscr, 10000)


}
