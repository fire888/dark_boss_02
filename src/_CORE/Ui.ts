import { Tween, Interpolation } from '@tweenjs/tween.js'
import { elementClickOnce } from './helpers/htmlHelpers'
import { Core } from './types'
import { IS_SHOW_INFO } from 'chapter10/constants/CONSTANTS'

export class Ui {
    _root: Core
    lockButton: HTMLDivElement
    _infoButton: HTMLDivElement

    _currentEnergyMinWidth = 0
    init (root: Core) {
        this._root = root
        this.lockButton = document.createElement('div')
        this.lockButton.classList.add('butt-lock')
        this.lockButton.classList.add('control-small')
        this.lockButton.style.display = 'none'
        document.body.appendChild(this.lockButton)

        if (IS_SHOW_INFO) {
            this._infoButton = document.createElement('div')
            this._infoButton.classList.add('butt-info')
            this._infoButton.classList.add('control-small')
            this._infoButton.style.display = 'none'
            this._infoButton.addEventListener('pointerdown', () => {
                this._showInfo()
            })
            document.body.appendChild(this._infoButton)
        }
    }

    setTransparentBackground() {
        const startScreen = document.body.getElementsByClassName('start-screen')[0] as HTMLElement
        startScreen.style.background = 'none'
    }

    async hideStartScreen () {
        const loaderCont = document.body.getElementsByClassName('loader')[0] as HTMLElement

        opacityByTransition(loaderCont, 0, 3)
        loaderCont.style.display = 'none'
        
        const startButton = document.body.getElementsByClassName('start-but')[0] as HTMLElement
        startButton.style.display = 'block'
   
        await elementClickOnce(startButton)

        const h1 = document.body.getElementsByTagName('h1')[0]
        opacityByTransition(h1, 0, 3)
        const startScreen = document.body.getElementsByClassName('start-screen')[0]
        document.body.removeChild(startScreen)
    }

    async hideStartScreenForce () {
        const startScreen = document.body.getElementsByClassName('start-screen')[0] as HTMLElement
        document.body.removeChild(startScreen)
    }

    toggleVisibleButtonLock (visible: boolean) {
        if (this._infoButton) { 
            this._infoButton.style.display = visible ? 'block' : 'none'
        }
        this.lockButton.style.display = visible ? 'flex' : 'none'
    }

    _showInfo () {
        this._infoButton.style.display = 'none'
        this.toggleVisibleButtonLock(false)

        const wrapper = document.createElement('div')
        wrapper.classList.add('final-page')

        wrapper.appendChild(createOffset(20))

        const close = document.createElement('div')
        close.innerHTML = '<span class="colW">Close</span>'
        close.style.textAlign = 'center'
        close.style.textDecoration = 'underline'
        close.style.cursor = 'pointer'
        close.addEventListener('pointerdown', () => {
            this._infoButton.style.display = 'block'
            this.toggleVisibleButtonLock(true)
            document.body.removeChild(wrapper)
        })
        wrapper.appendChild(close)

        wrapper.appendChild(createOffset(20))

        const prev = document.createElement('div')
        prev.innerHTML = 'Previous chapters:'
        wrapper.appendChild(prev)

        wrapper.appendChild(createOffset(20))

        const list = createChaptersList()
        wrapper.appendChild(list)

        wrapper.appendChild(createOffset(20))

        {
            const prev = document.createElement('div')
            prev.innerHTML = 'To fly around level press key <span class="colW">\'O\'</span>'
            wrapper.appendChild(prev)
        }

        wrapper.appendChild(createOffset(60))

        document.body.appendChild(wrapper)      
    }
}

const opacityByTransition = (elem: HTMLElement, to: number, time: number) => {
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

const createOffset = (n: number) => {
    if (n !== 20 && n !== 60) {
        alert('wrong offset')
    }
    const offset = document.createElement('div')
    offset.classList.add('dark')
    offset.classList.add('height-' + n + 'px')
    return offset
}


const createChaptersList = () => {
    const LIST: [number, string, string, string?][] = []
    for (let i = 1; i < 11; ++i) {
        const strI = i < 10 ? '0' + i : i
        LIST.push([i, './../' + strI, 'Chapter ' + i])
    }
    LIST[LIST.length - 1].push('current chapter')

    const list = document.createElement('div')

    const createListElem = (n: number, link: string, text: string, additionalText: string = null) => {
        const l = document.createElement('p')

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

