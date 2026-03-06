import { Root } from "../index"

import { tileMapWall } from "../geometry/tileMapWall";
import { _M } from "../geometry/_m";
import { ElemType, IHoleData, IArrayForBuffers } from '../types/GeomTypes'

import { createDoor00 } from "../geometry/door00/door00"
import { createWindow00 } from "../geometry/window00/window00"
import { createHole00 } from "../geometry/hole00/hole00"
import { createHoleBack01 } from "../geometry/holeBack01/holeBack01"
import { createTopElem_00 } from "../geometry/topElem00/topElem_00"
import { createArea00 } from "../geometry/area00/area00"
import { createCurb00 } from "../geometry/bevel00/curb00"
import { createPilaster00 } from "../geometry/pilaster00/pilastre00"
import { createPilaster01 } from "../geometry/pilaster01/pilaster01"
import { createPilaster02 } from "../geometry/pilaster02/pilaster02"
import { createPilaster03 } from "../geometry/pilaster03/pilaster03"
import { createPilaster04 } from "../geometry/pilaster04/pilaster04"
import { createPoias00 } from "../geometry/poias00/poias00"
import { createPoias01 } from "../geometry/poias01/poias01"
import { createPoias02 } from "../geometry/poias02/poias02"
import { createColumn00 } from "../geometry/column00/column00"
import { wall00 } from "../geometry/wall00/wall00"
import { wall01 } from "../geometry/wall01/wall01"
import { buildHouse00 } from "../geometry/house00/buildHouse00"
import { buildHouse01 } from "../geometry/house01/buildHouse01"
import { COLOR_BLUE } from "../constants/CONSTANTS"

export const buildExamples = (root: Root) => {
    const v = []
    const uv = []
    const c = []

    const label = _M.createLabel('H: 7 метров', [1, 1, 1], 5)
    label.position.set(0, 7, -10)
    root.studio.add(label)

    const W = 10
    const H = 7
    const Z = -10
    
    // curb
    {
        const X = 36
        const Z = -10
        const D = -2
        const r = createCurb00([X, Z], [X + W, Z], [X + W, Z + D], [X, Z + D], tileMapWall.noiseLong, 1, 1)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)
    }

    // curb triangle 1
    {
        const X = 48
        const Z = -10
        const D = -2
        const W = 3
        const r = createCurb00([X + W * .5, Z], [X + W * .5, Z], [X + W, Z + D], [X, Z + D], tileMapWall.noise, 1)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)
    }

    // curb triangle 2
    {
        const X = 50
        const Z = -10
        const D = -2
        const W = 3
        const r = createCurb00([X, Z], [X + W, Z], [X + W * .5, Z + D], [X + W * .5, Z + D], tileMapWall.noise, 1)
        v.push(...r.v)
        c.push(...r.c)
        uv.push(...r.uv)
    }

    // door
    {
        const door = createDoor00({ w: 1, h: 4, d: .3, offsetX: 0, offsetY: 0 })
        _M.translateVertices(door.v, 60, 0, -10)
        v.push(...door.v)
        c.push(...door.c)
        uv.push(...door.uv)
    }

    // window 
    {
        const window = createWindow00({ w: 1, h: 2, d: .3, offsetX: 0, offsetY: 0 })        
        _M.translateVertices(window.v, 70, 0, -10)
        v.push(...window.v)
        c.push(...window.c)
        uv.push(...window.uv)
    }

    // hole 
    {
        const hole = createHole00({ w: 1, h: 2, d: .3, offsetX: 0, offsetY: 1, width: 2, height: 4 })        
        _M.translateVertices(hole.v, 80, 0, -10)
        v.push(...hole.v)
        c.push(...hole.c)
        uv.push(...hole.uv)
    }

    // holeBack
    {
        const hole = createHoleBack01({ x0: 0, x1: 1, x2: 2, x3: 3,  y0: 0, y1: 1, y2: 2, y3: 3 })        
        _M.translateVertices(hole.v, 80, 0, -20)
        v.push(...hole.v)
        c.push(...hole.c)
        uv.push(...hole.uv)
    }

    // top elem 
    {
        const topElem = createTopElem_00([.3, .3, 1])
        _M.translateVertices(topElem.v, 90, 0, -10)
        v.push(...topElem.v)
        c.push(...topElem.c)
        uv.push(...topElem.uv)
    }

    // area00 
    {
        const area = createArea00([[-2, 5], [0, 5], [5, -5], [-5, -5], [-2, 5]], COLOR_BLUE, tileMapWall.stoneTree)           
        _M.translateVertices(area.v, 100, 1, -10)
        v.push(...area.v)
        c.push(...area.c)
        uv.push(...area.uv)
    }

    // pilastre00
    {
        const pilaster00 = createPilaster00(5, 5, 1)
        _M.translateVertices(pilaster00.v, 110, 0, -10)
        v.push(...pilaster00.v)
        c.push(...pilaster00.c)        
        uv.push(...pilaster00.uv) 
        root.studio.addAxisHelper(110, 0, -10, 1)
        root.studio.addAxisHelper(110, 5, -10, 1)
        root.studio.addAxisHelper(110, 0, -9, 1)
        root.studio.addAxisHelper(109, 0, -10, 1)
    }

    // pilaster01 
    {
        const pilaster01 = createPilaster01(.7, 5, 1)
        _M.translateVertices(pilaster01.v, 115, 0, -10)
        v.push(...pilaster01.v)
        c.push(...pilaster01.c)        
        uv.push(...pilaster01.uv) 
        root.studio.addAxisHelper(115, 0, -10, 5)
        root.studio.addAxisHelper(115, 5, -10, 5)
        root.studio.addAxisHelper(115, 0, -9, 5)
    }

    // pilaster02
    {
        const pilaster02 = createPilaster02(.7, 5, 1)
        _M.translateVertices(pilaster02.v, 117, 0, -10)
        v.push(...pilaster02.v)
        c.push(...pilaster02.c)        
        uv.push(...pilaster02.uv) 
        root.studio.addAxisHelper(117, 0, -10, 5)
        root.studio.addAxisHelper(117, 5, -10, 5)
        root.studio.addAxisHelper(116.65, 0, -9, 5)
    }
    // pilaster03
    {
        const pilaster03 = createPilaster03(.7, 5, 1)
        _M.translateVertices(pilaster03.v, 118, 0, -15)
        v.push(...pilaster03.v)
        c.push(...pilaster03.c)        
        uv.push(...pilaster03.uv)
    }
    // pilaster04
    {
        const pilaster04 = createPilaster04(.7, 5, 1)
        _M.translateVertices(pilaster04.v, 119, 0, -10)
        v.push(...pilaster04.v)
        c.push(...pilaster04.c)        
        uv.push(...pilaster04.uv)
        root.studio.addAxisHelper(119, 0, -10, 5)
        root.studio.addAxisHelper(119, 5, -10, 5)
        root.studio.addAxisHelper(118.65, 0, -9, 5)
    }

    // poias00 
    {
        const poias00 = createPoias00(2.5, 2, 0)
        _M.translateVertices(poias00.v, 120, 0, -10)
        v.push(...poias00.v)
        c.push(...poias00.c)        
        uv.push(...poias00.uv)
        root.studio.addAxisHelper(120, 0, -10, 5)
        root.studio.addAxisHelper(120, 2, -10, 5)
    }
    // poias01 
    {
        const poias01 = createPoias01(2.5, 2, .2)
        _M.translateVertices(poias01.v, 125, 0, -10)
        v.push(...poias01.v)
        c.push(...poias01.c)        
        uv.push(...poias01.uv)
        root.studio.addAxisHelper(125, 0, -10, 5)
        root.studio.addAxisHelper(125, 2, -10, 5)
        root.studio.addAxisHelper(125, 2, -9.7, 5)
    }
    // poias02
    {
        const poias02 = createPoias02(2.5, .3, 0)
        _M.translateVertices(poias02.v, 135, 0, -10)
        v.push(...poias02.v)
        c.push(...poias02.c)        
        uv.push(...poias02.uv)
        root.studio.addAxisHelper(135, 0, -10, 5)
        root.studio.addAxisHelper(135, 2, -10, 5)
        root.studio.addAxisHelper(135, 2, -9.7, 5) 
    }

    // column 00
    {
        const col = createColumn00(.21, 5)
        _M.translateVertices(col.v, 130, 0, -10)
        v.push(...col.v)
        c.push(...col.c)        
        uv.push(...col.uv)
    }

    // wall00
    {
        const r = wall00({
            w: 20,
            h: 10,
            d:.2,
            H_TOP_POIAS: .3,
            TYPE_TOP_POIAS: ElemType.POIAS_01,
            TYPE_SIDE_PILASTER: ElemType.PILASTER_01,
            SIDE_PILASTER_W: .3,
            INNER_WALL_START_OFFSET: 0,
            INNER_WALL_END_OFFSET: 0,
        })
        _M.translateVertices(r.v, 0, 0, -20)
        v.push(...r.v)
        uv.push(...r.uv)
        c.push(...r.c)
    }

    // wall01
    {
        const r = wall01({
            w: 20,
            h: 10,
            d:.2,
            H_TOP_POIAS: .6,
            TYPE_TOP_POIAS: ElemType.POIAS_01,
            TYPE_SIDE_PILASTER: ElemType.PILASTER_01,
            SIDE_PILASTER_W: .3,
            INNER_WALL_START_OFFSET: 0,
            INNER_WALL_END_OFFSET: 0,
        })
        _M.translateVertices(r.v, 0, 0, -40)
        v.push(...r.v)
        uv.push(...r.uv)
        c.push(...r.c)
    }

    const forceMat = []
    for (let i = 0; i < v.length / 3; ++i) {
        forceMat.push(1)
    }

    const m = _M.createMesh({ 
        v,
        uv,
        c, 
        forceMat,
        material: root.materials.walls00,
    })
    root.studio.add(m)


    { // HOUSE 00
       const perimeter: [number, number][] = [
            [5, 5],
            [5, 4.8],
            [-5, -3],
            [-5, 5],
            [5, 5]
            // [1, 10],
            // [2, 11],
            // [17, 11],
            // [15, 1],
            // [1, 1],
        ]
        const houseData = buildHouse00(perimeter)
        const m = _M.createMesh({ 
            v: houseData.v,
            uv: houseData.uv,
            c: houseData.c,
            forceMat: houseData.forceMat,
            material: root.materials.walls00,
        })
        root.studio.add(m)
        m.position.y = .1
        m.position.x = -30
    }

    { // HOUSE 01
       const perimeter: [number, number][] = [
            [1, 1],
            [1, 10],
            [2, 11],
            [17, 11],
            [15, 1],
            [1, 1],
        ]
        const houseData = buildHouse01(perimeter)
        const m = _M.createMesh({ 
            v: houseData.v,
            uv: houseData.uv,
            c: houseData.c,
            forceMat: houseData.forceMat,
            material: root.materials.walls00,
        })
        root.studio.add(m)
        m.position.y = .1
        m.position.x = -60
    }
}