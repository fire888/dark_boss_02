import { tileMapWall } from '../tileMapWall'
import { _M, A3 } from '../_m'
import { COLOR_BLUE } from '../../constants/CONSTANTS'

export const createCurb00 = (
    frontStart: [number, number],
    frontEnd: [number, number],
    backEnd: [number, number],
    backStart: [number, number],
    uvTile: number[] = tileMapWall.noiseLong,
    h: number = 0,
    repeatWidth: number = 100,
    color: A3 = COLOR_BLUE,
) => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []

    let isCollapseFront = false 
    if (frontStart[0] === frontEnd[0] && frontStart[1] === frontEnd[1]) {
        isCollapseFront = true
    }
    let isCollapseBack = false 
    if (backStart[0] === backEnd[0] && backStart[1] === backEnd[1]) {
        isCollapseBack = true
    }

    const dFront = _M.dist(frontStart, frontEnd)
    const nRepeat = Math.floor(dFront / repeatWidth) + 1
    const frontXStep = (frontEnd[0] - frontStart[0]) / nRepeat
    const frontZStep = (frontEnd[1] - frontStart[1]) / nRepeat
    const backXStep = (backEnd[0] - backStart[0]) / nRepeat
    const backZStep = (backEnd[1] - backStart[1]) / nRepeat
    
    /** top if collapsed front */
    if (isCollapseFront) {
        v.push(
            backStart[0], h, backStart[1],
            frontStart[0], h, frontStart[1],
            backEnd[0], h, backEnd[1],
        )
        uv.push(
            uvTile[0], uvTile[1],
            uvTile[2], uvTile[3],
            uvTile[4], uvTile[5],
        )
        c.push(
            ...color,
            ...color,
            ...color,
        )
    }
    
    /** top if collapsed back */
    if (isCollapseBack) {
        v.push(
            frontEnd[0], h, frontEnd[1],
            backStart[0], h, backStart[1],
            frontStart[0], h, frontStart[1],
        )
        uv.push(
            uvTile[0], uvTile[1],
            uvTile[2], uvTile[3],
            uvTile[4], uvTile[5],
        )
        c.push(
            ...color,
            ...color,
            ...color,
        )
    }

    /** top if not collapsed */
    if (!isCollapseBack && !isCollapseFront) {
        for (let i = 0; i < nRepeat; ++i) {
            v.push(..._M.createPolygon(
                [backStart[0] + i * backXStep, h, backStart[1] + i * backZStep],
                [frontStart[0] + i * frontXStep, h, frontStart[1] + i * frontZStep],
                [frontStart[0] + (i + 1) * frontXStep, h, frontStart[1] + (i + 1) * frontZStep],
                [backStart[0] + (i + 1) * backXStep, h, backStart[1] + (i + 1) * backZStep],
            ))
            uv.push(...uvTile)
            c.push(..._M.fillColorFace(color))
        }
    }

    if (h !== 0) {
        // front side
        if (!isCollapseFront) {
            for (let i = 0; i < nRepeat; ++i) {
                v.push(..._M.createPolygon(
                    [frontStart[0] + i * frontXStep, h, frontStart[1] + i * frontZStep],
                    [frontStart[0] + i * frontXStep, 0, frontStart[1] + i * frontZStep],
                    [frontStart[0] + (i + 1) * frontXStep, 0, frontStart[1] + (i + 1) * frontZStep],
                    [frontStart[0] + (i + 1) * frontXStep, h, frontStart[1] + (i + 1) * frontZStep],
                ))
                uv.push(...uvTile)
                c.push(..._M.fillColorFace(color))
            }
        }
        // back side
        if (!isCollapseBack) {
            for (let i = 0; i < nRepeat; ++i) {
                v.push(..._M.createPolygon(
                    [backStart[0] + (i + 1) * backXStep, h, backStart[1] + (i + 1) * backZStep],
                    [backStart[0] + (i + 1) * backXStep, 0, backStart[1] + (i + 1) * backZStep],
                    [backStart[0] + i * backXStep, 0, backStart[1] + i * backZStep],
                    [backStart[0] + i * backXStep, h, backStart[1] + i * backZStep],
                ))
                uv.push(...uvTile)
                c.push(..._M.fillColorFace(color))
            }
        }
    }
 
    return { v, c, uv }
}