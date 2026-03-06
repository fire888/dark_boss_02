export enum STYLE_KEYS {
    RED = 'color: #ffaaaaaa; background: #000000',
    YELLOW = 'color: #000000; background: #FFFF00',  
}

const STYLES = {
    [STYLE_KEYS.RED]: STYLE_KEYS.RED,
    [STYLE_KEYS.YELLOW]: STYLE_KEYS.YELLOW,  
}

export const log = (msg: string, styleKey: STYLE_KEYS | null = null, ...args: any[]) => {
    console.log(`%c${msg}`, STYLES[styleKey] || '', ...args);
}