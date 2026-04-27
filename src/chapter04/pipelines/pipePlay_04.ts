import { Root } from '../index'
import { pause } from '_CORE/helpers/htmlHelpers'
import * as THREE from 'three'



export const pipePlay_04 = async (root: Root) => {
    console.log('[MESSAGE:] START PLAY LEVEL: ')
    await pause(10000000)
    console.log('[MESSAGE:] COMPLETE SCENARIO')
}
