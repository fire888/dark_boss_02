import { Tween, Interpolation } from '@tweenjs/tween.js'
import {elementClickOnce } from '../helpers/htmlHelpers'
import { Ui } from '_CORE/Ui'
import { Root } from '../index'

export class UiCustom extends Ui {
    _currentEnergyMinWidth = 0

    init (root: Root) {
        super.init(root)
    }

    hideBackgroundStartScreen() {
        const startScreen = document.body.getElementsByClassName('start-screen')[0]
        // @ts-ignore
        startScreen.style.background = 'rgba(0, 0, 0, 0)'
    }

    async hideStartScreen () {
        const loaderCont = document.body.getElementsByClassName('loader')[0]
        // @ts-ignore
        loaderCont.style.display = 'none'
        
        const startButton = document.body.getElementsByClassName('start-but')[0]
        // @ts-ignore
        startButton.style.display = 'block'   
    
        // @ts-ignore
        await elementClickOnce(startButton)

        const controlsM = document.body.getElementsByClassName('controls-mess')[0]
        // @ts-ignore
        await opacityByTransition(controlsM, 0, 1)

        const h1 = document.body.getElementsByTagName('h1')[0]
        // @ts-ignore
        await opacityByTransition(h1, 0, 1)

        const startScreen = document.body.getElementsByClassName('start-screen')[0]
        document.body.removeChild(startScreen)
    }

    async hideStartScreenForce () {
        const startScreen = document.body.getElementsByClassName('start-screen')[0]
        document.body.removeChild(startScreen)
    }

    setColorDark (color: string) {
        this.finalDark.style.backgroundColor = '#' + color
    }

}

const opacityByTransition = (elem: HTMLBaseElement, to: number, time: number) => {
    return new Promise<void>(res => {
        const obj = { v: to === 1 ? 0 : 1 }
        new Tween(obj)
            .interpolation(Interpolation.Linear)
            .to({ v: to }, time)
            .onUpdate(() => {
                elem.style.opacity = obj.v + ''
            })
            .onComplete(() => {
                res()
            })
            .start()
    })
} 

