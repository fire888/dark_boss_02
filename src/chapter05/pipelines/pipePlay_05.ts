import { Root } from '../index'
import * as THREE from 'three'
import { pause } from '_CORE/helpers/htmlHelpers'
import { Tween, Easing, Interpolation, add } from '@tweenjs/tween.js'
import { createCheckerChangeLocationKey } from './checkerLocationKey'
import { SIZE_QUADRANT } from 'chapter05/entities/Lab03/Lab03'

const LOCATIONS_QUADRANTS = [
    //{ loc: '3_-3' },
    // { loc: '-3_-3' },
    // { loc: '3_3' },
    { loc: '100_1000' },
]

export const pipePlay_05 = async (root: Root, currentIndexLevel = 0) => {

    console.log('[MESSAGE:] START PLAY LEVEL: ', currentIndexLevel)

    const { phisics, ui, keyboard, lab, ticker, studio, controls, car, body, pers } = root

    let isVisibleButtonDriveCar = false
    phisics.addListen('collisionCheckerPlayerDrive', 'beginContact', () => {
        ui.showDriveButton()
        isVisibleButtonDriveCar = true
    })
    phisics.addListen('collisionCheckerPlayerDrive', 'endContact', () => {
        ui.hideDriveButton()
        isVisibleButtonDriveCar = false
    })

    let isInCar = false

    const checkerChangeLocation = createCheckerChangeLocationKey(SIZE_QUADRANT, 0, 0)
    const unsubscribeUpdateLoc = ticker.on((t: number) => {
        const pos = isInCar ? phisics.carBody.position : phisics.playerBody.position
        const l = checkerChangeLocation.checkChanged(pos.x, pos.z)
        if (!l) { return; }
        lab.updateElemsByLoc(l.removedQs, l.addedQs)
    })

    const toCar = () => {
        controls.disable()
        phisics.playerBody.position.x = 1000
        phisics.carBody.position.y = 1.2
        studio.toggleToCarCamera()
        car.isFreeze = false
    }

    const fromCar = () => {
        phisics.carBody.position.y = 1000
        const { x, y, z } = car.getModel().position
        phisics.playerBody.position.x = x
        phisics.playerBody.position.y = y + 1
        phisics.playerBody.position.z = z
        car.isFreeze = true
        controls.enable()
        studio.toggleToPlayerCamera()
    }

    const onEnterCar = async (isPress: boolean) => {
        if (isPress) { return }
        if (!isVisibleButtonDriveCar) { return }
        if (!isInCar) {
            isInCar = true
            toCar()
        } else {
            isInCar = false
            fromCar()
        }
    }

    const disableTryEnterCar = keyboard.on('E', onEnterCar)


    // HIDE REAL WORLD //////////////////////////////////////

    const waitFirstEnterCar = async () => {
        return new Promise((res) => {
            const unsubscr = keyboard.on('E', (isPress) => {
                if (isPress) { 
                    return 
                }
                if (!isVisibleButtonDriveCar) { 
                    return
                }
                unsubscr()
                res(true)
            })
        })
    }

    await waitFirstEnterCar()

    car.toggleMat('green')
    studio.setSceneBackgroundCube(root.assets['skyboxGreenStars'])
    studio.setFogColor([0, 0, 0])
    studio.setFogNearFar(400, 800)
    body.hide()
    lab.removeNormalFloor()
    lab.addElemsToLoc(checkerChangeLocation.getCurrent().currentEnv)
    lab.removeBigElemsFromLoc(['0_0'])


    // SCENARIO FIND 3 LOCATIONS //////////////////////////

    const waitNearPers = () => {
        return new Promise((resolve) => {
            const uns = ticker.on(() => {
                console.log('distance to pers', studio.camera.position.distanceTo(pers.mesh.position))
                if (studio.camera.position.distanceTo(pers.mesh.position) < 5) {
                    uns()
                    resolve(true)
                }
            })
        })        
    }

    const addNextStairs = (currentLocIndex: number) => {
        const locData = LOCATIONS_QUADRANTS[currentLocIndex]
        const p = locData.loc.split('_')
        const x = +p[0] * SIZE_QUADRANT
        const z = +p[1] * SIZE_QUADRANT
        lab.addStairToScene(currentLocIndex, x, z)
        car.setCompasTarget(new THREE.Vector3(x, 0, z))
        pers.mesh.position.copy(lab.meshFinish.position)
        pers.show()
    }

    let currentLocIndex = -1
    
    // ++currentLocIndex
    // addNextStairs(currentLocIndex)
    // await waitNearPers()
    // ui.showCircleDone(currentLocIndex)
    // pers.hide(1000)
    // await pause(1500)
    
    // console.log('[MESSAGE:] NEXT PERS 2')

    // ++currentLocIndex
    // addNextStairs(currentLocIndex)
    // await waitNearPers()
    // ui.showCircleDone(currentLocIndex)
    // pers.hide(1000)
    // await pause(1500)

    // console.log('[MESSAGE:] NEXT PERS 3')

    // ++currentLocIndex
    // addNextStairs(currentLocIndex)
    // await waitNearPers()
    // ui.showCircleDone(currentLocIndex)
    // pers.hide(1000)
    // await pause(1500)

    console.log('[MESSAGE:] NEXT PERS 4')

    ++currentLocIndex
    console.log('[MESSAGE:] NEXT: ', LOCATIONS_QUADRANTS[currentLocIndex])
    const locData = LOCATIONS_QUADRANTS[currentLocIndex]
    const p = locData.loc.split('_')
    const x = +p[0] * SIZE_QUADRANT
    const z = +p[1] * SIZE_QUADRANT
    lab.addStairToScene(currentLocIndex, x, z)
    car.setCompasTarget(new THREE.Vector3(x, 0, z))

    
    // SCENARIO BATTERY //////////////////////////////////

    console.log('[MESSAGE:] START BATTERY SCENARIO')

    const waitEnterCar = async () => {
        return new Promise((res) => {
            if (isInCar) {
                return res(true)
            }
            const unsubscr = keyboard.on('E', (isPress) => {
                if (isPress) { return }
                if (!isVisibleButtonDriveCar) { return }
                unsubscr()
                res(true)
            })
        })
    }

    await waitEnterCar()

    //await pause(60000)
    await pause(1000)

    if (!isInCar) {
        waitEnterCar()
    }

    ticker.on(() => {
        car.updateBattary()
    })

    //await pause(7000)
    await pause(1000)

    disableTryEnterCar()
    unsubscribeUpdateLoc()

    lab.removeAllGreens()
    lab.addNormalFloor()

    studio.setFogColor([0, 0, 0])
    studio.setFogNearFar(1000, 2000)
    
    car.toggleMat('red')

    body.show()

    await pause(300)

    car.getModel().position.x = 0
    car.getModel().position.z = 0

    fromCar()
}
