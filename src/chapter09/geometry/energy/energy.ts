import { Vector3 } from 'three'
import { _M } from '../_m'

export const createEnergyV = ({ rad = .6, l = .3, t = 1 }) => {
    const v: number[] = []
    const c: number[] = []

    const l0 = -1
    const l1 = -.5
    const l2 = .2
    const l3 = Math.random() * 2 + l2 
    const r1 = .3
    const r2 = Math.random() + .01

    const N = 7
    
    const v0s = new Vector3(0, l0, 0).add(new Vector3(0, -Math.random() * .2, 0))
    const v0b = new Vector3(0, -.1, 0).add(v0s)
    const v1s = new Vector3(r1, l1, 0)
    const v1b = new Vector3(r1 + .1, l1, 0)
    const v2s = new Vector3(r2, l2, 0)
    const v2b = new Vector3(r2 + .1, l2, 0)
    const v3s = new Vector3(0, l3, 0)
    const v3b = new Vector3(0, l3 + .1, 0)

    const segs = []
    for (let i = 0; i < N; ++i) {
        const angle = i / N * Math.PI * 2 
        const add1 = new Vector3(Math.random() * .1, Math.random() * .1, Math.random() * .1)
        const add2 = new Vector3(Math.random() * .1, Math.random() * .1, Math.random() * .1)
        segs.push({
            v1s: v1s.clone().add(add1).applyAxisAngle(new Vector3(0, 1, 0), angle),
            v1b: v1b.clone().add(add1).applyAxisAngle(new Vector3(0, 1, 0), angle),
            v2s: v2s.clone().add(add2).applyAxisAngle(new Vector3(0, 1, 0), angle),
            v2b: v2b.clone().add(add2).applyAxisAngle(new Vector3(0, 1, 0), angle),
        }) 
    }

    for (let i = 0; i < segs.length; ++i) {
        const next = i === segs.length - 1 ? 0 : i + 1

        // bottom inner
        v.push(
            ...v0s.toArray(),
            ...segs[next].v1s.toArray(),        
            ...segs[i].v1s.toArray(),        
        )
        c.push(
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
        )
        // bottom outer
        v.push(
            ...segs[next].v1b.toArray(), 
            ...v0b.toArray(),
            ...segs[i].v1b.toArray(),        
        )
        c.push(
            .1, 1, 1,
            .1, 1, 1,
            .1, 1, 1,
        )

        // center inner 
        v.push(
            ...segs[i].v1s.toArray(),
            ...segs[next].v1s.toArray(),
            ...segs[next].v2s.toArray(),

            ...segs[i].v1s.toArray(),
            ...segs[next].v2s.toArray(),
            ...segs[i].v2s.toArray(),
        )

        c.push(
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
        )
        c.push(
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
        )

        // center outer 
        v.push(
            ...segs[next].v1b.toArray(),
            ...segs[i].v1b.toArray(),
            ...segs[next].v2b.toArray(),

            ...segs[next].v2b.toArray(),
            ...segs[i].v1b.toArray(),
            ...segs[i].v2b.toArray(),
        )

        c.push(
            .1, 1, 1,
            .1, 1, 1,
            .1, 1, 1,
        )
        c.push(
            .1, 1, 1,
            .1, 1, 1,
            .1, 1, 1,
        )

        // top inner
        v.push(
            ...segs[i].v2s.toArray(),
            ...segs[next].v2s.toArray(),        
            ...v3s.toArray(),        
        )
        c.push(
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
        )
        // top outer
        v.push(
            ...v3b.toArray(),
            ...segs[next].v2b.toArray(), 
            ...segs[i].v2b.toArray(),        
        )
        c.push(
            .1, 1, 1,
            .1, 1, 1,
            .1, 1, 1,
        )
    }

    return { v, c }
} 