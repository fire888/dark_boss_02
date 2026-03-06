import { _M } from "./_m"
import { DataToCreateLine, AttributesArrs } from "../entities/labyrinth/types"
import { A3 } from "./_m"


const D = .1
export const createRandomDataForLine = (): DataToCreateLine => {
    return {
        form: [
            0, -Math.random() * D, 0,
            0, D * Math.random(), + Math.random() * D,
            0, D * Math.random(), - Math.random() * D,
        ],
        path: [
            [1 + Math.random(), 0, 0],
            [1 + .7 * Math.random(), .6 + Math.random(), 0],
            [0, 2 + Math.random(), 0],
            [-1 - .7 * Math.random(), .6 + Math.random(), 0],
            [-1 - Math.random(), 0, 0],
        ],
        color: [Math.random() * .5, Math.random() +.5, Math.random() +.5],
        isClosed: true,
    }
}


export const createLineGeom = (data: DataToCreateLine): AttributesArrs => {
    const {
        form,
        path,
        color,
        isClosed,
    } = data


    const arrForms = []
    
    for (let i = 0; i < path.length; ++i) {
        const currentPoint = path[i]
        let prevPoint = null
        let nextPoint = null

        if (i === 0) {
            if (isClosed) {
                prevPoint = path[path.length - 1]
            }
        } else (
            prevPoint = path[i - 1]
        )

        if (i === path.length - 1) {
            if (isClosed) {
                nextPoint = path[0]
            }
        } else {
            nextPoint = path[i + 1]
        }

        let angle1 = null
        if (prevPoint) {
            const deltaX1 = currentPoint[0] - prevPoint[0]
            const deltaY1 = currentPoint[1] - prevPoint[1]
            angle1 = _M.angleFromCoords(deltaX1, deltaY1)    
        }

        let angle2 = null
        if (nextPoint) {
            const deltaX2 = nextPoint[0] - currentPoint[0]
            const deltaY2 = nextPoint[1] - currentPoint[1]
            angle2 = _M.angleFromCoords(deltaX2, deltaY2)
        }

        if (angle1 === null) {
            angle1 = angle2
        }
        if (angle2 === null) {
            angle2 = angle1
        }



        let angle = angle2 - (angle2 - angle1) / 2
        angle = angle % (Math.PI * 2)

        if (i === path.length - 1 && isClosed) {
           angle -= Math.PI
        }

        const copyForm = [...form]
        _M.rotateVerticesZ(copyForm, angle)

        _M.translateVertices(copyForm, ...currentPoint)
        arrForms.push(copyForm)
    }

    const v = []
    const c = []

    for (let i = 0; i < arrForms.length; ++i) {
        if (!isClosed && i === 0) {
            v.push(
                ...arrForms[arrForms.length - 1],
                ...arrForms[0],
            )

            c.push(...color, ...color, ...color)
            c.push(...color, ...color, ...color)

            continue;
        }
        
        const prevForm = i === 0 ? arrForms[arrForms.length - 1] : arrForms[i - 1]
        const currentForm = arrForms[i]

        for (let i = 0; i < currentForm.length; i += 3) {
            let indN = i + 3
            if (i === currentForm.length - 3) {
                indN = 0
            }

            const b = _M.createPolygon(
                [prevForm[i], prevForm[i + 1], prevForm[i + 2]],
                [currentForm[i], currentForm[i + 1], currentForm[i + 2]],
                [currentForm[indN], currentForm[indN + 1], currentForm[indN + 2]],
                [prevForm[indN], prevForm[indN + 1], prevForm[indN + 2]],
            )

            c.push(..._M.fillColorFace(color))
            v.push(...b)
        } 

    }

    return { v, c, }
} 
export const mirrorPathX = (path: A3[]) => {
    const copy = JSON.parse(JSON.stringify(path))

    copy[0][0] = -path[4][0]
    
    copy[1][0] = -path[3][0]
    copy[1][1] = path[3][1]
    
    copy[3][0] = -path[1][0]
    copy[3][1] = path[1][1]
    
    copy[4][0] = -path[0][0]

    return copy
}

export const checkPathValid = (arr: any) => {
    if (!arr) {
        return false
    }

    if (arr.length) {
        for (let i = 0; i < arr.length; ++i) {
            if (arr[i] === undefined) {
                return false
            }

            if (Array.isArray(arr[i]) && arr[i] === Object && arr[i].length) {
                for (let j = 0; j < arr[i].length; j ++) {
                    if (arr[i][j] === undefined) {
                        return false
                    }
                }
            }
        }
    }

    return true
}

