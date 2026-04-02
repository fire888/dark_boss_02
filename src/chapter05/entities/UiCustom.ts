import { Tween, Interpolation } from '@tweenjs/tween.js'
import { elementClickOnce, opacityByTransition } from '_CORE/helpers/htmlHelpers'
import { Ui } from '_CORE/Ui'
import { Root } from '../index'
import '../stylesheets/style.css'

export class UiCustom extends Ui {
    _currentEnergyMinWidth = 0
    _buttonDriveCar: HTMLDivElement = null
    _arrDoneCircles: HTMLDivElement[] = [] 

    init (root: Root) {
        super.init(root)

        this._buttonDriveCar = document.createElement('div')//document.body.getElementsByClassName('drive-car')[0]
        this._buttonDriveCar.classList.add('drive-car')
        this._buttonDriveCar.style.display = 'none'
        if (root.deviceData.device === 'phone') {
            this._buttonDriveCar.innerText = 'press to drive'
        } else {
            this._buttonDriveCar.innerText = 'press E to drive'
        }
        document.body.appendChild(this._buttonDriveCar)

        for (let i = 0; i < 5; ++i) {
            const circle = document.createElement('div')
            circle.classList.add('circle_done')
            circle.style.right = 100 + 35 * i + 'px'
            circle.style.display = 'none' 
            document.body.appendChild(circle)
            this._arrDoneCircles.push(circle)
        }
    }

    hideBackgroundStartScreen() {
        const startScreenBack = document.body.getElementsByClassName('start-screen-background')[0]
        // @ts-ignore
        opacityByTransition(startScreenBack, 0, 300)
    }

    showCircleDone (index: number) {
        if (index < 0 || index >= this._arrDoneCircles.length) return
        const circle = this._arrDoneCircles[index]
        circle.style.display = 'block'
        opacityByTransition(circle, 1, 500)
    }

    hideAllCirclesDone () {
        this._arrDoneCircles.forEach(circle => {
            circle.style.display = 'none'
        })
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

    showDriveButton () {
        this._buttonDriveCar.style.display = 'block'
    }
    hideDriveButton () {
        this._buttonDriveCar.style.display = 'none'
    }

    onClickDriveButton (cb: () => void) {
        this._buttonDriveCar.addEventListener('pointerdown', cb)
        return this._buttonDriveCar.removeEventListener.bind(this._buttonDriveCar, 'pointerdown', cb)   
    }

}
