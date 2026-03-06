import { Tween, Interpolation } from '@tweenjs/tween.js'
import { pause, elementClickOnce } from '../helpers/htmlHelpers'
import { Ui } from '_CORE/Ui'

const ENERGY_MAX_WIDTH = 30

export class UiCustom extends Ui {
    _currentEnergyMinWidth = 0
    //init (root) {
    init () {
        super.init()

        this._countEnergy = document.createElement('div')
        this._countEnergy.classList.add('count-energy')
        document.body.appendChild(this._countEnergy)

        this._countEnergyInner = document.createElement('div')
        this._countEnergyInner.classList.add('count-energy-inner')
        this._countEnergyInner.classList.add('color-blue')
        this._countEnergyInner.style.opacity = 0
        this._countEnergy.appendChild(this._countEnergyInner)
    }

    async hideStartScreen () {
        this.finalDark = document.createElement('div')
        this.finalDark.classList.add('final-dark')
        this.finalDark.style.opacity = 1
        document.body.appendChild(this.finalDark)

        const loaderCont = document.body.getElementsByClassName('loader')[0]

        opacityByTransition(loaderCont, 0, 300)
        await pause(300)
        loaderCont.style.display = 'none'
        
        const startButton = document.body.getElementsByClassName('start-but')[0]
        startButton.style.display = 'block'
        opacityByTransition(startButton, 1, 300)      
    
        await elementClickOnce(startButton)

        const controlsM = document.body.getElementsByClassName('controls-mess')[0]
        await opacityByTransition(controlsM, 0, 300)

        const h1 = document.body.getElementsByTagName('h1')[0]
        await opacityByTransition(h1, 0, 300)

        const startScreen = document.body.getElementsByClassName('start-screen')[0]
        await opacityByTransition(startScreen, 0, 300)

        setTimeout(async () => {
            this.toggleVisibleDark(false)
            await pause(600)
            document.body.removeChild(startScreen)
            await opacityByTransition(this._countEnergyInner, 1, 300)
        }, 300)
    }

    async hideStartScreenForce () {
        const startScreen = document.body.getElementsByClassName('start-screen')[0]
        document.body.removeChild(startScreen)
        opacityByTransition(this._countEnergyInner, 1, 5)
    }

    toggleVisibleEnergy (visible) {
        opacityByTransition(this._countEnergy, visible ? 1 : 0, 300) 
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
    
    setEnergyLevel (val) {
        const obj = { v: this._currentEnergyMinWidth }
        new Tween(obj)
            .interpolation(Interpolation.Linear)
            .to({ v: val }, 300)
            .onUpdate(() => {
                this._countEnergyInner.style.minWidth = obj.v * ENERGY_MAX_WIDTH + 'vw'
            })
            .onComplete(() => {
                this._currentEnergyMinWidth = val
                this._countEnergyInner.classList.remove('color-blue')
                this._countEnergyInner.classList.remove('color-yellow')
                if (val === 1) {
                    this._countEnergyInner.classList.add('color-yellow')
                } else {
                    this._countEnergyInner.classList.add('color-blue')
                }
            })
            .start()
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

