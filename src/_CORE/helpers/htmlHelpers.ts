import { Tween, Interpolation } from '@tweenjs/tween.js'

export const documentClickOnce = () => {
    return new Promise(res => {
        const listener = () => {
            document.body.removeEventListener('click', listener)
            res(true)
        }

        document.body.addEventListener('click', listener)
    })
}

export const elementClickOnce = (elem: HTMLElement) => {
    return new Promise(res => {
        const listener = () => {
            elem.removeEventListener('click', listener)
            res(true)
        }

        elem.addEventListener('click', listener)
    })
}

export const pause = (t: number): Promise<void> => new Promise(res => setTimeout(res, t))

export const opacityByTransition = (elem: HTMLElement, to: number, time: number) => {
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
