import { _M } from "../geometry/_m" 
import {
    checkIntersection,
} from 'line-intersect';
import { Root } from "../index";

export const offset = (points: [number, number][], d: number, root: Root): { 
    offsetLines: [number, number, number?, number?][], 
    existsLines: [number, number, number, number][],
    centerX: number, 
    centerY: number,
} => {
    const angles: number[] = [] 
    const existsLines: [number, number, number, number][] = []

    for (let i = 0; i < points.length; ++i) {
        points[i][0] = _M.toleranceToZero(points[i][0])
        points[i][1] = _M.toleranceToZero(points[i][1])
    }

    const filteredPoints = []
    for (let i = 0; i < points.length; ++i) {
        if (i === 0) {
            filteredPoints.push(points[i])
        }
        if (i > 0) {
            const prev = points[i - 1]
            if (prev [0] !== points[i][0] || prev[1] !== points[i][1]) {
                filteredPoints.push(points[i])
            }
        }     
    }

    for (let i = 1; i < filteredPoints.length; ++i) {
        const pr = filteredPoints[i - 1]
        const cr = filteredPoints[i]
        existsLines.push([pr[0], pr[1], cr[0], cr[1]])

        if (i === filteredPoints.length - 1) {
            const pr = filteredPoints[i]
            const cr = filteredPoints[0]
            if (pr[0] !== cr[0] || pr[1] !== cr[1]) {
                existsLines.push([pr[0], pr[1], cr[0], cr[1]])
            }
        }
    }

    /** draw exist lines */
    // for (let i = 0; i < existsLines.length; ++i) {
    //     const l = existsLines[i]
    //     const lp = _M.createLine([[l[0], l[1]], [l[2], l[3]]], [1, 0, 0])
    //     lp.position.y = .3
    //     root.studio.add(lp)

    //     {
    //         const p = [l[0], l[1]]
    //         const l1 = _M.createLabel('p' + i + 's', [1, 1, 1], 1)
    //         l1.position.set(p[0], (1 + i) * .2, p[1])
    //         root.studio.add(l1)
    //     }

    //     {
    //         const p = [l[2], l[3]]
    //         const l1 = _M.createLabel('p' + i + 'e', [1, 1, 1], 1)
    //         l1.position.set(p[0], (1 + i) * .2, p[1])
    //         root.studio.add(l1)
    //     }

    //     // await _M.waitClickNext()
    // }


    const [ cX, cY ] = _M.center(filteredPoints) 

    const innerLines: [number, number, number, number][] = []

    // create lines offset no trim
    for (let i = 0; i < existsLines.length; ++i) {
        let angle = _M.angleFromCoords(existsLines[i][0] - existsLines[i][2], existsLines[i][1] - existsLines[i][3])
        angle += Math.PI * .5

        angles.push(angle)

        const xNewPR = _M.toleranceToZero(existsLines[i][0] + d * Math.cos(angle))
        const yNewPR = _M.toleranceToZero(existsLines[i][1] + d * Math.sin(angle))
        const xNewCR = _M.toleranceToZero(existsLines[i][2] + d * Math.cos(angle))
        const yNewCR = _M.toleranceToZero(existsLines[i][3] + d * Math.sin(angle))

        innerLines.push([xNewPR, yNewPR, xNewCR, yNewCR])
    }

    // for (let i = 0; i < innerLines.length; ++i) {
    //     const l = innerLines[i]
    //     const lp = _M.createLine([[l[0], l[1]], [l[2], l[3]]], [1, 0.5, 0])
    //     lp.position.y = .4
    //     root.studio.add(lp)

    //     {
    //         const p = [l[0], l[1]]
    //         const l1 = _M.createLabel('p' + i + 's', [0, 1, 1], 1)
    //         l1.position.set(p[0], (1 + i) * .2, p[1])
    //         root.studio.add(l1)
    //     }

    //     {
    //         const p = [l[2], l[3]]
    //         const l1 = _M.createLabel('p' + i + 'e', [0, 1, 1], 1)
    //         l1.position.set(p[0], (1 + i) * .2, p[1])
    //         root.studio.add(l1)
    //     }

    //     // await _M.waitClickNext()
    // }

    const intercepts = []
    for (let i = 0; i < innerLines.length; ++i) {
        const prev = innerLines[i - 1] ? innerLines[i - 1] : innerLines[innerLines.length - 1]
        const curr = innerLines[i]
        const next = innerLines[i + 1] ? innerLines[i + 1] : innerLines[0]

        const intersect = checkIntersection(...prev, ...curr) 

        /* @ts-ignore */
        const int1 = intersect.point ? [intersect.point.x, intersect.point.y] : null
        // if (int1) {
        //     const p = int1
        //     const l1 = _M.createLabel(i + '', [1, 0, 0], 7)
        //     l1.position.set(p[0], 1 + i, p[1])
        //     root.studio.add(l1)
        // }



        //const int2: any = null 
        let intersect2 = checkIntersection(...prev, ...next)

        /* @ts-ignore */
        let int2 = intersect2.point ? [intersect2.point.x, intersect2.point.y] : null
        // if (int2 && i === 2) {
        //     const p = int2
        //     const l1 = _M.createLabel(i + '', [1, 0, 0], 7)
        //     l1.position.set(p[0], 1 + i, p[1])
        //     root.studio.add(l1)
        // }
        // if (innerLines.length === 3) {
        //     int2 = null
        // }

        /* @ts-ignore */
        if (!int1 && !int2) {
            let isIntercept2 = false
            let offset = 2
            while (!isIntercept2 && offset < innerLines.length) {
                let ind = i - offset
                if (ind < 0) {
                    ind = innerLines.length + ind
                }
                const prevPrev = innerLines[ind]
                intersect2 = checkIntersection(...prevPrev, ...curr)
                /* @ts-ignore */
                int2 = intersect2.point ? [intersect2.point.x, intersect2.point.y] : null
                /* @ts-ignore */
                isIntercept2 = !!intersect2.point
                offset++
            }
        }

        let pointToInsert = int1
        let isPoint2 = false
        if (int1 && int2) {
            if (innerLines.length !== 3 && innerLines.length !== 4) {
                const d = Math.sqrt((int1[0] - cX) **2 + (int1[1] - cY) **2)
                const d2 = Math.sqrt((int2[0] - cX) **2 + (int2[1] - cY) **2)
                isPoint2 = d2 < d
            }
        }
        if (!int1 && int2) {
            isPoint2 = true
        }
        if (isPoint2) {
            pointToInsert = int2
        }
        intercepts.push(pointToInsert)
    }

    // intercepts.forEach((e, i) => {
    //         const p = e
    //         const l1 = _M.createLabel(i + '', [1, 0, 0], 1)
    //         l1.position.set(p[0], (1 + i) * .2, p[1])
    //         root.studio.add(l1)
    // })

    const innerLinesTrimmed: [number, number, number, number][] = []
    for (let i = 1; i < intercepts.length; ++i) {
        const prev = intercepts[i - 1]        
        const curr = intercepts[i] 
        if (prev && curr) innerLinesTrimmed.push([prev[0], prev[1], curr[0], curr[1]])
        if (i === intercepts.length - 1) {
            const prev = intercepts[i]        
            const curr = intercepts[0] 
            if (prev && curr) innerLinesTrimmed.push([prev[0], prev[1], curr[0], curr[1]])
        }
    }

    return { offsetLines: innerLinesTrimmed, existsLines, centerX: cX, centerY: cY }
} 

