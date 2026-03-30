import { Root } from '../index'
import * as THREE from 'three'
import { pause } from '_CORE/helpers/htmlHelpers'
import { Tween, Easing, Interpolation } from '@tweenjs/tween.js'
import { createCheckerChangeLocationKey } from './checkerLocationKey'
import { SIZE_QUADRANT } from 'chapter05/entities/Lab03/Lab03'

const LOCATIONS_QUADRANTS = [
    //{ loc: '3_-3' },
    { loc: '0_-1' },
    { loc: '-3_-3' },
    { loc: '3_3' },
    { loc: '100_1000' },
]

export const pipePlay_05 = async (root: Root, currentIndexLevel = 0) => {

    console.log('[MESSAGE:] START PLAY LEVEL: ', currentIndexLevel)

    const { phisics, ui, keyboard, lab, ticker, studio, controls, car, body, pers } = root

    let isVisibleDriveCar = false
    phisics.addListen('collisionCheckerPlayerDrive', 'beginContact', () => {
        ui.showDriveButton()
        isVisibleDriveCar = true
    })
    phisics.addListen('collisionCheckerPlayerDrive', 'endContact', () => {
        ui.hideDriveButton()
        isVisibleDriveCar = false
    })

    let isInCar = false
    let currentLocIndex = 0

    const carMesh = car.getModel()
    const checkerChangeLocation = createCheckerChangeLocationKey(SIZE_QUADRANT, 0, 0)
    ticker.on((t: number) => {
        const pos = isInCar ? phisics.carBody.position : phisics.playerBody.position
        const l = checkerChangeLocation.checkChanged(pos.x, pos.z)
        if (!l) { return; }
        lab.updateElemsByLoc(l.removedQs, l.addedQs)
    })


    const addNextStairs = () => {
        const locData = LOCATIONS_QUADRANTS[currentLocIndex]
        const p = locData.loc.split('_')
        const x = +p[0] * SIZE_QUADRANT
        const z = +p[1] * SIZE_QUADRANT
        lab.addStairToScene(currentLocIndex, x, z)
        car.setCompasTarget(new THREE.Vector3(x, 0, z))
        pers.mesh.position.copy(lab.meshFinish.position)
    }

    const toGreenWorld = async () => {
        car.toggleMat('green')
        studio.setSceneBackgroundCube(root.assets['skyboxGreenStars'])
        studio.setFogColor([0, 0, 0])
        studio.setFogNearFar(400, 800)
        body.hide()
        lab.removeNormalFloor()
        lab.addElemsToLoc(checkerChangeLocation.getCurrent().currentEnv)
        addNextStairs()
    }


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
            await toGreenWorld()
        }

        if (!isInCar) {
            //controls.disable()
            isInCar = true
            controls.disable()
            phisics.playerBody.position.x = 1000
            phisics.carBody.position.y = 1.2
            //phisics.sleepPlayerBody()
            studio.toggleToCarCamera()
            car.isFreeze = false
        } else {
            isInCar = false
            phisics.carBody.position.y = 1000

            controls.enable()

            const { x, y, z } = car.getModel().position
            phisics.playerBody.position.x = x
            phisics.playerBody.position.y = y + 1
            phisics.playerBody.position.z = z
            car.isFreeze = true
            controls.enable()
            studio.toggleToPlayerCamera()
        }


    }
    const unsubscr = keyboard.on('E', onEnterCar)


    const waitNearPers = () => {
        return new Promise((resolve) => {
            const pos = pers.mesh.position
            const camPos = studio.camera.position
            const uns = ticker.on(() => {
                if (pos.distanceTo(camPos) < 5) {
                    uns()
                    resolve(true)
                }
            })
        })        
    }

    await waitNearPers()
    console.log('[MESSAGE:] NEXT PERS 2')

    ++currentLocIndex
    addNextStairs()
    await waitNearPers()

    console.log('[MESSAGE:] NEXT PERS 3')

    ++currentLocIndex
    addNextStairs()
    await waitNearPers()

    console.log('[MESSAGE:] NEXT PERS 4')

















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
