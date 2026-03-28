import { Root } from '../index'
import * as THREE from 'three'
import { pause } from '_CORE/helpers/htmlHelpers'
import { Tween, Easing, Interpolation } from '@tweenjs/tween.js'
import { createCheckerChangeLocationKey } from './checkerLocationKey'
import { SIZE_QUADRANT } from 'chapter05/entities/Lab03/Lab03'

export const LOCATIONS_QUADRANTS = {
    //'-4_-1': 'location01',
    '3_-3': 'location01',
    '-3_-3': 'location02',
    '3_3': 'location03',
    '100_1000': 'locationToFinish',
}


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

    const { phisics, ui, keyboard, lab, ticker, studio, controls, car } = root

    let isVisibleDriveCar = false
    phisics.addListenPlayer('collisionCheckerPlayerDrive', 'beginContact', () => {
        ui.showDriveButton()
        isVisibleDriveCar = true
    })
    phisics.addListenPlayer('collisionCheckerPlayerDrive', 'endContact', () => {
        ui.hideDriveButton()
        isVisibleDriveCar = false
    })

    let isInCar = false
    let isAllInGreen = false
    const onEnterCar = async (isPress: boolean) => {
        if (isPress) { 
            return 
        }
        if (!isVisibleDriveCar) { 
            return
        }
        if (!isAllInGreen) {
            isAllInGreen = true
            await toGreenTheme(root)
        }

        if (!isInCar) {
            //controls.disable()
            isInCar = true
            controls.disable()
            phisics.playerBody.position.x = 1000
            phisics.carBody.position.y = 5
            phisics.sleepPlayerBody()
            studio.toggleToCarCamera()
            car.isFreeze = false
        }

        //console.log('enter car', is)
    }
    const unsubscr = keyboard.on('E', onEnterCar)

    const carMesh = car.getModel()
    const checkerChangeLocation = createCheckerChangeLocationKey(SIZE_QUADRANT, 0, 0)
    ticker.on((t: number) => {
        const l = checkerChangeLocation.checkChanged(carMesh.position.x, carMesh.position.z)
        if (!l) { return;  }
        lab.updateBigElems(l.removedQs, l.addedQs)
    })




















            // update: (carX, carZ) => {
            // if (!isEnabled) {
            //     return;
            // }

            // unit.update()
            // systemSprites.update()
            // const l = checkerChangeLocation.checkChanged(carX, carZ)
            // if (l) {
            //     //console.log('quadrants data', l)
            //     /** arr/remove level tresh **********************/
            //     changerLevelArea.updateAreas(l.removedQs, l.addedQs)

                /** add/remove  locations ************************/
                // if (LOCATIONS_QUADRANTS[l.oldKey]) {
                //     changerGalleries.removeLocationFromScene(LOCATIONS_QUADRANTS[l.oldKey])
                // }
                // if (LOCATIONS_QUADRANTS[l.newKey]) {
                //     //console.log('add', l.newKey)
                //     const strArr = l.newKey.split('_')
                //     const locationX = +strArr[0] * SIZE_QUADRANT + SIZE_QUADRANT / 2
                //     const locationZ = +strArr[1] * SIZE_QUADRANT + SIZE_QUADRANT / 2
                //     changerGalleries.addLocationToScene(LOCATIONS_QUADRANTS[l.newKey], locationX, locationZ)
                // }

        //     }
        // }





    //setTimeout(unsubscr, 10000)
}
