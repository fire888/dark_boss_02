import './stylesheets/controls.css'
import { Tween, Interpolation } from '@tweenjs/tween.js'
import { elementClickOnce, pause } from './helpers/htmlHelpers'
import { Core } from './types'

const IS_SHOW_INFO = true

const CHAPTERS = [
    'chapter01',
    'chapter02',
    'chapter03',
    'chapter04',
    'chapter05',
    'chapter06',
    'chapter07',
    'chapter08',
    'chapter09',
    'chapter10'
]

export class Ui {
    _root: Core
    lockButton: HTMLDivElement
    _infoButton: HTMLDivElement
    finalDark: HTMLDivElement

    moveForwardDiv: HTMLElement
    moveBackDiv: HTMLElement
    moveLeftDiv: HTMLElement
    moveRightDiv: HTMLElement

    init (root: Core) {
        this._root = root
        this.lockButton = document.createElement('div')
        this.lockButton.classList.add('butt-lock')
        this.lockButton.classList.add('control-small')
        this.lockButton.style.display = 'none'
        document.body.appendChild(this.lockButton)

        this.moveForwardDiv = document.createElement('div')
        this.moveForwardDiv.classList.add('control')
        this.moveForwardDiv.classList.add('butt-front')
        document.body.appendChild(this.moveForwardDiv)

        this.moveBackDiv = document.createElement('div')
        this.moveBackDiv.classList.add('control')
        this.moveBackDiv.classList.add('butt-back')
        document.body.appendChild(this.moveBackDiv)

        this.moveLeftDiv = document.createElement('div')
        this.moveLeftDiv.classList.add('control')
        this.moveLeftDiv.classList.add('butt-left')
        document.body.appendChild(this.moveLeftDiv)

        this.moveRightDiv = document.createElement('div')
        this.moveRightDiv.classList.add('control')
        this.moveRightDiv.classList.add('butt-right')
        document.body.appendChild(this.moveRightDiv)

        this.moveForwardDiv.style.display = 'none'
        this.moveBackDiv.style.display = 'none'
        this.moveLeftDiv.style.display = 'none'
        this.moveRightDiv.style.display = 'none'

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

    async showFinalPage () {
        if (!IS_SHOW_INFO) {
            const wrapper = document.createElement('div')
            wrapper.style.opacity = '0'
            wrapper.classList.add('final-page')

            const complete = document.createElement('div')
            complete.classList.add('top20px')
            complete.innerHTML = 'You are done,'
            complete.style.opacity = '0'
            wrapper.appendChild(complete)

            const complete2 = document.createElement('div')
            complete2.classList.add('bottom60px')
            complete2.innerHTML = 'thank you for playing!'
            complete2.style.opacity = '0'
            wrapper.appendChild(complete2)

            document.body.appendChild(wrapper)
            opacityByTransition(wrapper, 1, 300)
            opacityByTransition(complete, 1, 300)
            opacityByTransition(complete2, 1, 300)

            if (this.finalDark) {
                await pause(300)
                await opacityByTransition(this.finalDark, 0, 5000)
            }
        
        } else {
            const wrapper = document.createElement('div')
            wrapper.style.opacity = '0'
            wrapper.classList.add('final-page')

            const complete = document.createElement('div')
            complete.classList.add('top20px')
            complete.innerHTML = 'You are done,'
            complete.style.opacity = '0'
            wrapper.appendChild(complete)

            const complete2 = document.createElement('div')
            complete2.classList.add('bottom20px')
            complete2.innerHTML = 'thank you for playing!'
            complete2.style.opacity = '0'
            wrapper.appendChild(complete2)

            const prev = document.createElement('div')
            prev.innerHTML = 'Previous chapters:'
            prev.style.opacity = '0'
            wrapper.appendChild(prev)

            const list = createChaptersList()
            list.classList.add('bottom20px')
            list.style.opacity = '0'
            wrapper.appendChild(list)

            let currentIndex = null
            let bottom, bottom1
            // @ts-ignore
            currentIndex = CHAPTERS.findIndex(ch => ch === __CHAPTER__)
            if (currentIndex === CHAPTERS.length - 1) {
                bottom = document.createElement('div')
                bottom.style.opacity = '0'
                bottom.innerHTML = 'Next chapter comming soon,'
                wrapper.appendChild(bottom)

                bottom1 = document.createElement('div')
                bottom1.classList.add('bottom60px')
                bottom1.style.opacity = '0'
                bottom1.innerHTML = 'to be continued...'
                wrapper.appendChild(bottom1)
            } else {
                bottom = document.createElement('div')
                bottom.style.opacity = '0'
                bottom.innerHTML = 'Please select next chapter.'
                bottom.classList.add('bottom60px')
                wrapper.appendChild(bottom)
            }

            document.body.appendChild(wrapper)
            opacityByTransition(wrapper, 1, 300)
            opacityByTransition(complete, 1, 300)
            opacityByTransition(complete2, 1, 300)

            await pause(300)
            await opacityByTransition(prev, 1, 300)

            await pause(300)
            await opacityByTransition(list, 1, 300)

            await pause(300)
            await opacityByTransition(bottom, 1, 300)

            await pause(500)
            await opacityByTransition(bottom1, 1, 300)

            await pause(300)
            await opacityByTransition(this.finalDark, 0, 5000)
        }
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
    if (!elem) return;

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

    let currentIndex = null
    // @ts-ignore
    if (__CHAPTER__) currentIndex = CHAPTERS.findIndex(ch => ch === __CHAPTER__)

    const LIST: [number, string, string, string?][] = []
    for (let i = 0; i < CHAPTERS.length; ++i) {
        const ind = i + 1
        const strI = ind < 10 ? '0' + ind : ind
        LIST.push([ind, './../' + ind, 'Chapter ' + ind])
        if (i === currentIndex) {
            LIST[LIST.length - 1].push('current chapter')
        }
    }

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

