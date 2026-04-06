import { Root } from '../index'
import * as THREE from 'three'
import { pause } from '_CORE/helpers/htmlHelpers'
import { Tween, Easing, Interpolation } from '@tweenjs/tween.js'


export const pipePlay_04 = async (root: Root, currentIndexLevel = 0) => {

    console.log('[MESSAGE:] START PLAY LEVEL: ', currentIndexLevel)
    await pause(10000000)
    console.log('[MESSAGE:] COMPLETE SCENARIO')

}
