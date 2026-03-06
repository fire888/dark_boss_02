import { Vector3 } from 'three'
import { _M } from './_m'


export const createEnergyV = ({ rad = .6, l = .3, t = 1 }) => {
    const vec1 = new Vector3(rad, -l, 0)
    const vec2 = new Vector3(rad, l, 0)
    const vTop = new Vector3(0, 1, 0)
    const r = .6

    const arrb = []
    const arrt = []

    let currentAngle = 0 

    // cloud points
    while (currentAngle < Math.PI * 2 - r) {
        const v = new Vector3(_M.ran(r) , _M.ran(r), _M.ran(r)).add(vec1)
        v.applyAxisAngle(vTop, currentAngle)
        arrb.push(v)

        const addAngle = .1 + Math.random() * r
        currentAngle += addAngle

        const v2 = new Vector3(_M.ran(r) , _M.ran(r), _M.ran(r)).add(vec2)
        v2.applyAxisAngle(vTop, currentAngle)
        arrt.push(v2)

        const addAngle2 = .1 + Math.random() * r
        currentAngle += addAngle2
    }

    const v = []
    for (let i = 0; i < arrb.length; ++i) {
        if (i === arrb.length - 1) {
            v.push(
                arrb[i].x, arrb[i].y, arrb[i].z,  
                arrb[0].x, arrb[0].y, arrb[0].z,  
                arrt[i].x, arrt[i].y, arrt[i].z,

                arrt[0].x, arrt[0].y, arrt[0].z,
                arrt[i].x, arrt[i].y, arrt[i].z,
                arrb[0].x, arrb[0].y, arrb[0].z,  
            )

            v.push(
                arrt[i].x, arrt[i].y, arrt[i].z,
                arrt[0].x, arrt[0].y, arrt[0].z,
                0, t, 0,
            )
            v.push(
                arrb[0].x, arrb[0].y, arrb[0].z,
                arrb[i].x, arrb[i].y, arrb[i].z,
                0, -t, 0,
            )
            continue;
        }
        v.push(
            arrb[i].x, arrb[i].y, arrb[i].z,  
            arrb[i + 1].x, arrb[i + 1].y, arrb[i + 1].z,  
            arrt[i].x, arrt[i].y, arrt[i].z,

            arrt[i + 1].x, arrt[i + 1].y, arrt[i + 1].z,
            arrt[i].x, arrt[i].y, arrt[i].z,
            arrb[i + 1].x, arrb[i + 1].y, arrb[i + 1].z,  
        )

        v.push(
            arrt[i].x, arrt[i].y, arrt[i].z,
            arrt[i + 1].x, arrt[i + 1].y, arrt[i + 1].z,
            0, t, 0,
        )

        v.push(
            arrb[i + 1].x, arrb[i + 1].y, arrb[i + 1].z,
            arrb[i].x, arrb[i].y, arrb[i].z,
            0, -t, 0,
        )

    }

    return { v }
} 