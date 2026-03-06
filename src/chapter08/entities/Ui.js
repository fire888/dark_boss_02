import { Tween, Interpolation } from '@tweenjs/tween.js'
import { pause, elementClickOnce } from './_helpers'
import { Ui } from '_CORE/Ui'

const ENERGY_MAX_WIDTH = 30

export class UiCustom extends Ui {
    _currentEnergyMinWidth = 0
    init (root) {
        super.init(root)

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
        const finalDark = document.createElement('div')
        finalDark.classList.add('final-dark')
        finalDark.style.opacity = 1
        document.body.appendChild(finalDark)

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
        await pause(100)  

        await opacityByTransition(startButton, 0, 300)
        await pause(100)

        const img = document.body.getElementsByTagName('svg')[0]
        await opacityByTransition(img, 0, 300)
        await pause(100)

        const startScreen = document.body.getElementsByClassName('start-screen')[0]
        await opacityByTransition(startScreen, 0, 300)
        await pause(100)

        setTimeout(async () => {
            await opacityByTransition(finalDark, 0, 300)
            await pause(300)
            await opacityByTransition(this._countEnergyInner, 1, 300)
            document.body.removeChild(startScreen)
            document.body.removeChild(finalDark)
        }, 300)
    }

    toggleVisibleLock (visible) {
        this._infoButton.style.display = visible ? 'block' : 'none'
        this.lockButton.style.display = visible ? 'flex' : 'none'
    }

    toggleVisibleEnergy (visible) {
        opacityByTransition(this._countEnergy, visible ? 1 : 0, 300) 
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
