import { Root } from '../index'
import * as THREE from 'three'
import { pause } from '_CORE/helpers/htmlHelpers'
import { Tween, Easing, Interpolation } from '@tweenjs/tween.js'


export const pipePlay_05 = async (root: Root, currentIndexLevel = 0) => {

    console.log('[MESSAGE:] START PLAY LEVEL: ', currentIndexLevel)
    // await environmentIterator(root)
    // console.log('[MESSAGE:] COMPLETE SCENARIO')

    const { phisics, ui } = root

    phisics.addListenPlayer('collisionCheckerPlayerDrive', 'beginContact', () => {
        ui.showDriveButton()
    })
    phisics.addListenPlayer('collisionCheckerPlayerDrive', 'endContact', () => {
        ui.hideDriveButton()
    })
}
