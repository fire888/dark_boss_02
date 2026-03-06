import { Tween, Interpolation } from '@tweenjs/tween.js'
import { pause, elementClickOnce } from './_helpers'

const ENERGY_MAX_WIDTH = 30

export class Ui {
    _currentEnergyMinWidth = 0
    init (root) {
        this._root = root
        this.lockButton = document.createElement('div')
        this.lockButton.classList.add('butt-lock')
        this.lockButton.classList.add('control-small')
        this.lockButton.style.display = 'none'
        document.body.appendChild(this.lockButton)

        this._countEnergy = document.createElement('div')
        this._countEnergy.classList.add('count-energy')
        document.body.appendChild(this._countEnergy)

        this._countEnergyInner = document.createElement('div')
        this._countEnergyInner.classList.add('count-energy-inner')
        this._countEnergyInner.classList.add('color-blue')
        this._countEnergyInner.style.opacity = 0
        this._countEnergy.appendChild(this._countEnergyInner)

        this._infoButton = document.createElement('div')
        this._infoButton.classList.add('butt-info')
        this._infoButton.classList.add('control-small')
        this._infoButton.style.display = 'none'
        this._infoButton.addEventListener('pointerdown', () => {
            this._showInfo()
        })
        document.body.appendChild(this._infoButton) 
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

    async showFinalPage () {
        const finalDark = document.createElement('div')
        finalDark.classList.add('final-dark')
        finalDark.style.opacity = 0
        document.body.appendChild(finalDark)

        const wrapper = document.createElement('div')
        wrapper.style.opacity = 0
        wrapper.classList.add('final-page')
        
        wrapper.appendChild(createOffset(20))

        const complete = document.createElement('div')
        complete.classList.add('dark')
        complete.innerHTML = 'You are done,'
        complete.style.opacity = 0
        wrapper.appendChild(complete)

        const complete2 = document.createElement('div')
        complete2.classList.add('dark')
        complete2.innerHTML = 'thank you for playing!'
        complete2.style.opacity = 0
        wrapper.appendChild(complete2)

        wrapper.appendChild(createOffset(20))

        const complete3 = document.createElement('div')
        complete3.classList.add('dark')
        complete3.innerHTML = '<a target="_blank" href="./../9">Continue adventure</a>'
        complete3.style.opacity = 0
        wrapper.appendChild(complete3)

        wrapper.appendChild(createOffset(20))

        const prev = document.createElement('div')
        prev.classList.add('dark')
        prev.innerHTML = 'Previous chapters:'
        prev.style.opacity = 0
        wrapper.appendChild(prev)

        const list = createChaptersList()
        list.style.opacity = 0
        wrapper.appendChild(list)

        wrapper.appendChild(createOffset(20))
        wrapper.appendChild(createOffset(20))

        const bottom = document.createElement('div')
        bottom.classList.add('dark')
        bottom.style.opacity = 0
        bottom.innerHTML = 'Next chapter comming soon,'
        wrapper.appendChild(bottom)

        const bottom1 = document.createElement('div')
        bottom1.classList.add('dark')
        bottom1.style.opacity = 0
        bottom1.innerHTML = 'to be continued...'
        wrapper.appendChild(bottom1)

        wrapper.appendChild(createOffset(60))

        document.body.appendChild(wrapper)

        await pause(300)
        await opacityByTransition(finalDark, 1, 300)

        this._countEnergy.style.display = 'none'

        await pause(300)
        await opacityByTransition(wrapper, 1, 300)

        await pause(300)
        await opacityByTransition(complete, 1, 300)

        await pause(300)
        await opacityByTransition(complete2, 1, 300)

        await pause(300)
        await opacityByTransition(complete3, 1, 300)

        await pause(300)
        await opacityByTransition(prev, 1, 300)

        await pause(300)
        await opacityByTransition(list, 1, 300)

        await pause(300)
        await opacityByTransition(bottom, 1, 300)

        await pause(500)
        await opacityByTransition(bottom1, 1, 300)

        await pause(300)
        await opacityByTransition(finalDark, 0, 5000)
    }


    _showInfo () {
        this._infoButton.style.display = 'none'
        this.toggleVisibleEnergy(false)
        this.toggleVisibleLock(false)
        this._root.controls.disconnect()

        const wrapper = document.createElement('div')
        wrapper.classList.add('final-page')

        wrapper.appendChild(createOffset(20))

        const close = document.createElement('div')
        close.classList.add('dark')
        close.innerHTML = 'Close'
        close.style.textAlign = 'right'
        close.style.textDecoration = 'underline'
        close.style.cursor = 'pointer'
        close.addEventListener('pointerdown', () => {
            this._infoButton.style.display = 'block'
            this.toggleVisibleEnergy(true)
            this.toggleVisibleLock(true)
            this._root.controls.connect()
            document.body.removeChild(wrapper)
        })
        wrapper.appendChild(close)

        wrapper.appendChild(createOffset(20))

        const prev = document.createElement('div')
        prev.classList.add('dark')
        prev.innerHTML = 'Previous chapters:'
        wrapper.appendChild(prev)

        wrapper.appendChild(createOffset(20))

        const list = createChaptersList()
        wrapper.appendChild(list)

        wrapper.appendChild(createOffset(20))

        {
            const prev = document.createElement('div')
            prev.classList.add('dark')
            prev.innerHTML = 'To fly around level press key \'O\''
            wrapper.appendChild(prev)
        }

        wrapper.appendChild(createOffset(20))

        {
            const prev = document.createElement('div')
            prev.classList.add('dark')
            prev.innerHTML = 'Example of generation level: <a href="/2D/maze/00/" target="_blank">link</a>'
            wrapper.appendChild(prev)
        }

        wrapper.appendChild(createOffset(20))

        {
            const prev = document.createElement('div')
            prev.classList.add('dark')
            prev.innerHTML = 'Source code: <a href="https://github.com/fire888/240612_labirint_ch8" target="_blank">github</a>'
            wrapper.appendChild(prev)
        }

        wrapper.appendChild(createOffset(60))

        document.body.appendChild(wrapper)      
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

const createOffset = (n) => {
    if (n !== 20 && n !== 60) {
        alert('wrong offset')
    }
    const offset = document.createElement('div')
    offset.classList.add('dark')
    offset.classList.add('height-' + n + 'px')
    return offset
}


const createChaptersList = () => {
    const LIST = []
    for (let i = 1; i < 10; ++i) {
        LIST.push([i, './../0' + i + '/', 'Chapter ' + i])
        if (i === 8) {
            LIST[LIST.length - 1].push('current chapter')
        }
    }


    const list = document.createElement('div')
    list.classList.add('dark')

    const createListElem = (n, link, text, additionalText = null) => {
        const l = document.createElement('div')

        const num = document.createElement('span')
        num.innerHTML = n + '.&nbsp;&nbsp;'
        l.appendChild(num)

        if (link) {
            const a = document.createElement('a')
            a.href = link
            a.innerText = text
            a.target = '_blank'
            l.appendChild(a)
        }

        if (additionalText) {
            const add = document.createElement('span')
            add.innerHTML = '&nbsp;&nbsp;&nbsp;' + additionalText
            l.appendChild(add)
        }

        return l
    }

    for (let i = 0; i < LIST.length; ++i) {
        const elem = createListElem(...LIST[i])
        list.appendChild(elem)
    }

    return list
}

