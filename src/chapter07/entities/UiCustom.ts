import { Tween, Interpolation } from '@tweenjs/tween.js'
import { pause, elementClickOnce, opacityByTransition } from '_CORE/helpers/htmlHelpers'
import { Ui } from '_CORE/Ui'
import { Root } from '../index'

const ENERGY_MAX_WIDTH = 30

export class UiCustom extends Ui {
    _countEnergy: HTMLElement
    _countEnergyInner: HTMLElement
    _currentEnergyMinWidth = 0
    init (root: Root) {
        super.init(root)

        this._countEnergy = document.createElement('div')
        this._countEnergy.classList.add('count-energy')
        document.body.appendChild(this._countEnergy)

        this._countEnergyInner = document.createElement('div')
        this._countEnergyInner.classList.add('count-energy-inner')
        this._countEnergyInner.classList.add('color-blue')
        this._countEnergyInner.style.opacity = '0'
        this._countEnergy.appendChild(this._countEnergyInner)
    }

    toggleVisibleEnergy (visible: boolean) {
        opacityByTransition(this._countEnergy, visible ? 1 : 0, 300) 
    }

    setEnergyLevel (val: number) {
        this._countEnergyInner.style.opacity = '1'

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

    setEnergyLevelForce (val: number) {
        this._countEnergyInner.style.opacity = '1'

        this._countEnergyInner.style.minWidth = val * ENERGY_MAX_WIDTH + 'vw'
    }
}
