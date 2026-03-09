import { Voronoi } from "./rhill-voronoi-core";
import { Root } from "../index";
import { _M } from "../geometry/_m";
import { ILevelConf, TSchemeElem } from "../types/GeomTypes"
var Offset = require('polygon-offset');

export const createScheme = (root: Root, params: ILevelConf): TSchemeElem[] => {
    const { SX = 150, SY = 150, N = 70 } = params
    
    const voronoi = new Voronoi()

    const points: [number, number][] = []
    const setPoint = () => {
        let n = 5
        while (n > 0) {
            --n
            const p: [number, number] = [Math.random() * SX,Math.random() * SY ]
            let isInsert = true
            for (let i = 0; i < points.length; ++i) {
                const d = Math.sqrt((p[0] - points[i][0]) * (p[0] - points[i][0]) + (p[1] - points[i][1]) * (p[1] - points[i][1]))
                if (d < 7) {
                    isInsert = false
                    break;
                }
            }
            if (isInsert) {
                points.push(p)
                break;
            }
        }
    }

    for (let i = 0; i < N; ++i) {
       setPoint()
    }

    const bbox = { xl: 0, xr: SX, yt: 0, yb: SY }; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
    const sites: { x: number, y: number }[] = []
    points.forEach(e => {
        sites.push({ x: e[0], y: e[1] })
    })

    const diagram = voronoi.compute(sites, bbox);

    const arr: TSchemeElem[] = []

    for (let i = 0; i < diagram.cells.length; ++i) {
        const cell = diagram.cells[i]
        const halfedges = cell.halfedges
        const nHalfedges = halfedges.length

        if (nHalfedges <= 2) { 
            console.log('not Show: ')
            console.log('!!!', cell)
            continue;
        }

        if (nHalfedges <= 2) { 
            continue
        }

        const v = halfedges[0].getStartpoint()
        const points: [number, number][] = [[v.x, v.y]]
        for (let iHalfedge = 0; iHalfedge < nHalfedges; ++iHalfedge) {
            const v = halfedges[iHalfedge].getEndpoint()
            points.push([v.x, v.y])
        }

        const offset = new Offset()
        const padding = offset.data(points).padding(1.5)

        arr.push({
            area: points,
            offset: padding[0] || null
        })
    }   

    return arr
}