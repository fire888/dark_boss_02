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
