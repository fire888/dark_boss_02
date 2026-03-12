import { Tween, Interpolation } from '@tweenjs/tween.js'
import {elementClickOnce } from '../helpers/htmlHelpers'
import { Ui } from '_CORE/Ui'

export class UiCustom extends Ui {
    _currentEnergyMinWidth = 0

    init (root) {
        super.init(root)
    }

    hideBackgroundStartScreen() {
        const startScreen = document.body.getElementsByClassName('start-screen')[0]
        startScreen.style.background = 'rgba(0, 0, 0, 0)'
    }

    async hideStartScreen () {
        const loaderCont = document.body.getElementsByClassName('loader')[0]
        loaderCont.style.display = 'none'
        
        const startButton = document.body.getElementsByClassName('start-but')[0]
        startButton.style.display = 'block'   
    
        await elementClickOnce(startButton)

        const controlsM = document.body.getElementsByClassName('controls-mess')[0]
        await opacityByTransition(controlsM, 0, 1)

        const h1 = document.body.getElementsByTagName('h1')[0]
        await opacityByTransition(h1, 0, 1)

        const startScreen = document.body.getElementsByClassName('start-screen')[0]
        document.body.removeChild(startScreen)
    }

    async hideStartScreenForce () {
        const startScreen = document.body.getElementsByClassName('start-screen')[0]
        document.body.removeChild(startScreen)
        opacityByTransition(this._countEnergyInner, 1, 5)
    }

    toggleVisibleDark(visible) {
        opacityByTransition(this.finalDark, visible ? 1 : 0, 300) 
        if (visible) document.body.appendChild(this.finalDark)
        if (!visible) setTimeout(() => {
            document.body.removeChild(this.finalDark)
        }, 320)
    }

    setColorDark (color) {
        this.finalDark.style.backgroundColor = '#' + color
    }

}

const opacityByTransition = (elem, to, time) => {
    return new Promise(res => {
        const obj = { v: to === 1 ? 0 : 1 }
        new Tween(obj)
            .interpolation(Interpolation.Linear)
            .to({ v: to }, time)
            .onUpdate(() => {
                elem.style.opacity = obj.v
            })
            .onComplete(() => {
                res()
            })
            .start()
    })
} 

