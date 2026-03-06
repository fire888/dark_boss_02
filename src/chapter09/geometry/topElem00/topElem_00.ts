import { _M, A3 } from '../_m'
import { tileMapWall } from '../tileMapWall'
import { COLOR_BLUE_D } from '../../constants/CONSTANTS'

const PROFILE: [number, number][] = [
    [.25, 0],
    [.25, .2],
    [.22, .2],
    [.22, .3],
    [.24, .3],
    [.18, 1.3],
    [0, 1.4],
]

export const createTopElem_00 = (color: A3 = COLOR_BLUE_D, w: number = .5, h: number = 1.4) => {
    const v: number[] = [] 
    const uv: number[] = [] 
    const c: number[] = []

    let profile = PROFILE
    if (w !== .5) {
        const radius = w * .5 
        profile = []
        for (let i = 0; i < PROFILE.length; ++i) {
            if (i < 6) {
                profile.push([PROFILE[i][0] + radius - .25, PROFILE[i][1]])
            } else {
                profile.push([PROFILE[i][0], PROFILE[i][1]])
            }
        }
    }

    if (h !== 1.4) {
        for (let i = 0; i < profile.length; ++i) {
            if (i < 5) {
                continue
            }

            profile[i][1] += h - 1.4
        }
    }

    const r = _M.lathePath(profile, 4, color, tileMapWall.noise)
    v.push(...r.v)
    c.push(...r.c)
    uv.push(...r.uv)
    
    return { v, c, uv }
}