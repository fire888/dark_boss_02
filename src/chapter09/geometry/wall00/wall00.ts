import { Root } from '../../index';
import { IFloorData, IWallData, IHoleData, IArrayForBuffers, ElemType, IDataForWall } from '../../types/GeomTypes';
import { createPilaster00 } from '../pilaster00/pilastre00';
import { createPilaster01 } from '../pilaster01/pilaster01';
import { createPilaster02 } from '../pilaster02/pilaster02';
import { createPilaster03 } from '../pilaster03/pilaster03';
import { createPilaster04 } from '../pilaster04/pilaster04';
import { createPoias00 } from '../poias00/poias00';
import { createPoias01 } from '../poias01/poias01';
import { createPoias02 } from '../poias02/poias02';
import { createDoor00 } from '../door00/door00';
import { createWindow00 } from '../window00/window00';
import { createHole00 } from '../hole00/hole00';
import { createHoleBack01 } from '../holeBack01/holeBack01';
import { createTopElem_00 } from '../topElem00/topElem_00';
import { _M, A2, A3 } from '../_m';
import { COLOR_BLUE_D, COLOR_DARK_INTERIOR } from '../../constants/CONSTANTS';
import { tileMapWall } from "../tileMapWall"

type ISingleFloorData = {
    w: number,
    h: number, 
    d: number,
    N: number,
    SIDE_PILASTER_W: number,
    WORK_WALL_W: number,
    INNER_PILASTER_W: number,
    COUNT_INNER_PILASTERS: number,
    FULL_W_INNER_PILASTERS: number,
    FULL_SECTIONS_W: number,
    SINGLE_SECTION_W: number,
    N_SECTION_DOOR: number,
    W_DOOR: number,
    INNER_WALL_START_OFFSET: number,
    INNER_WALL_END_OFFSET: number,
}

const createFloor = (floorData: ISingleFloorData, N_FLOOR: number): IArrayForBuffers => {
    const v: number[] = []
    const uv: number[] = []
    const c: number[] = []

    const BACK_WALL_START_OFFSET = 3 

    const { 
        w, 
        h, 
        d, 
        N,
        SIDE_PILASTER_W, 
        WORK_WALL_W, 
        INNER_PILASTER_W, 
        COUNT_INNER_PILASTERS, 
        FULL_W_INNER_PILASTERS, 
        FULL_SECTIONS_W, 
        SINGLE_SECTION_W, 
        N_SECTION_DOOR, 
        W_DOOR,
        INNER_WALL_START_OFFSET,
        INNER_WALL_END_OFFSET,
    } = floorData
    
    { // INNER PILASTERS
        const r = Math.random() 
        let constr = null
        if (r < .33) {
            constr = createPilaster02
        } else if (r < .66) {
            constr = createPilaster04   
        } else {
            constr = createPilaster00    
        }
    
        for (let i = 0; i < COUNT_INNER_PILASTERS; i++) { 
            const innerP = constr(INNER_PILASTER_W, h, d + .25)
            _M.translateVertices(innerP.v, 
                SIDE_PILASTER_W + SINGLE_SECTION_W * (i + 1) + INNER_PILASTER_W * (i + .5), 
                0, 
                0
            )
            v.push(...innerP.v)
            uv.push(...innerP.uv)
            c.push(...innerP.c)

            // back pilaster fill wall Fill
            {
                const r = _M.createPolygon(
                    [INNER_PILASTER_W * .5, 0, 0],
                    [-INNER_PILASTER_W * .5, 0, 0],
                    [-INNER_PILASTER_W * .5, h, 0],
                    [INNER_PILASTER_W * .5, h, 0],
                )
                _M.translateVertices(r, 
                    SIDE_PILASTER_W + SINGLE_SECTION_W * (i + 1) + INNER_PILASTER_W * (i + .5), 
                    0, 
                    -d,
                )
                v.push(...r)
                uv.push(...tileMapWall.empty)
                c.push(..._M.fillColorFace(COLOR_DARK_INTERIOR))
            }
        }
    }

    let H_POIAS_BOTTOM = 0.5 + Math.random()
    if (N_FLOOR > 0) {
        H_POIAS_BOTTOM = 0.15 + Math.random() * 1
    }
    { // POIAS BOTTOM
       // calculate Breaks By DOORS 
        const breakPoiasParts = [] 
        let START_POIAS_X = SIDE_PILASTER_W
        for (let i = 0; i < N; ++i) {
            if (i === N_SECTION_DOOR && N_FLOOR === 0) { 
                const endX = 
                    SIDE_PILASTER_W + 
                    SINGLE_SECTION_W * (i) + 
                    INNER_PILASTER_W * (i) + 
                    SINGLE_SECTION_W * .5 - 
                    W_DOOR * .5

                breakPoiasParts.push({
                    startX: START_POIAS_X, 
                    endX,
                })
                START_POIAS_X = endX + W_DOOR
            }
        }   
        breakPoiasParts.push({
            startX: START_POIAS_X, 
            endX: w - SIDE_PILASTER_W,
        })

        // insert POIAS
        let constructorPoiasBottom = createPoias00
        let poiasD = d + .2
        if (N_FLOOR > 0) {
            constructorPoiasBottom = createPoias02
            poiasD = 0
        }

        for (let i = 0; i < breakPoiasParts.length; ++i) { 
            const poiasPart = constructorPoiasBottom(
                breakPoiasParts[i].endX - breakPoiasParts[i].startX,
                H_POIAS_BOTTOM, 
                poiasD,
            )
            _M.translateVertices(poiasPart.v, 
                breakPoiasParts[i].startX, 
                0, 
                0
            )
            v.push(...poiasPart.v)
            uv.push(...poiasPart.uv)
            c.push(...poiasPart.c)
        }
    }

    // DRAW DOOR
    if (N_FLOOR === 0 && N_SECTION_DOOR !== -1) { // чтобы пропустить дверь секцию двери можно поставить N_SECTION_DOOR = -1
        const H_DOOR = Math.min(h - 1.5, 1.8 + Math.random() * 2)
        {
            const door = createDoor00({
                w: W_DOOR,
                h: H_DOOR,  
                d: d,
            })
            _M.translateVertices(
                door.v, 
                SIDE_PILASTER_W + 
                N_SECTION_DOOR * SINGLE_SECTION_W + 
                N_SECTION_DOOR * INNER_PILASTER_W + 
                SINGLE_SECTION_W * .5, 
                0, 
                0
            )
            v.push(...door.v)
            uv.push(...door.uv)
            c.push(...door.c)

            // HOLE DOOR
            const holeDoor = createHole00({
                w: W_DOOR,
                h: H_DOOR,  
                d: d + .2,
                offsetY: 0,
                offsetX: 0,
                width: SINGLE_SECTION_W,
                height: h - H_POIAS_BOTTOM,
            })
            _M.translateVertices(
                holeDoor.v, 
                SIDE_PILASTER_W + 
                N_SECTION_DOOR * SINGLE_SECTION_W + 
                N_SECTION_DOOR * INNER_PILASTER_W + 
                SINGLE_SECTION_W * .5, 
                H_POIAS_BOTTOM, 
                0
            )
            v.push(...holeDoor.v)
            uv.push(...holeDoor.uv)     
            c.push(...holeDoor.c)

            // BACK HOLE DOOR
            const holeDoorBack = createHole00({
                w: W_DOOR,
                h: H_DOOR,
                d,
                offsetY: 0,
                offsetX: 0,
                width: SINGLE_SECTION_W,
                height: h,
            })
            _M.translateVertices(
                holeDoorBack.v,
                SIDE_PILASTER_W + 
                N_SECTION_DOOR * SINGLE_SECTION_W + 
                N_SECTION_DOOR * INNER_PILASTER_W + 
                SINGLE_SECTION_W * .5, 
                0,
                -d,
            )
            for (let i = 0; i < holeDoorBack.v.length; i += 9) {
                const tmp0 = holeDoorBack.v[i + 3]
                const tmp1 = holeDoorBack.v[i + 4]
                const tmp2 = holeDoorBack.v[i + 5]
                holeDoorBack.v[i + 3] = holeDoorBack.v[i]
                holeDoorBack.v[i + 4] = holeDoorBack.v[i + 1]
                holeDoorBack.v[i + 5] = holeDoorBack.v[i + 2]
                holeDoorBack.v[i] = tmp0
                holeDoorBack.v[i + 1] = tmp1
                holeDoorBack.v[i + 2] = tmp2
            }
            for (let i = 0; i < holeDoorBack.uv.length; i += 1) {
                holeDoorBack.uv[i] = 0
            }
            for (let i = 0; i < holeDoorBack.c.length; i += 3) {
                holeDoorBack.c[i] = COLOR_DARK_INTERIOR[0]
                holeDoorBack.c[i + 1] = COLOR_DARK_INTERIOR[1]
                holeDoorBack.c[i + 2] = COLOR_DARK_INTERIOR[2]
            }
            v.push(...holeDoorBack.v)
            uv.push(...holeDoorBack.uv)     
            c.push(...holeDoorBack.c)
        }
    }

    // DRAW WINDOWS 
    {
        const wWindow = Math.min(SINGLE_SECTION_W - .6, 1 + Math.random() * 1.5)
        const hWindow = Math.min(h - H_POIAS_BOTTOM - .5, 1. + Math.random() * 2)
        const bottomOffsetY = Math.random() * (h - H_POIAS_BOTTOM - hWindow - 0.4) + .2
        for (let i = 0; i < N; ++i) {
            if (i === N_SECTION_DOOR && N_FLOOR === 0) {
                continue // пропускаем место двери
            }
            const window = createWindow00({
                w: wWindow,
                h: hWindow,
                d,
            })
            _M.translateVertices(
                window.v, 
                SIDE_PILASTER_W +   
                i * SINGLE_SECTION_W + 
                i * INNER_PILASTER_W + 
                SINGLE_SECTION_W * .5, 
                H_POIAS_BOTTOM + bottomOffsetY, 
                0
            )
            v.push(...window.v)
            uv.push(...window.uv)
            c.push(...window.c)
        }

        // DRAW HOLE WINDOWS
        for (let i = 0; i < N; ++i) {
            if (i === N_SECTION_DOOR && N_FLOOR === 0) {
                continue // пропускаем место двери
            }
            const holeWindow = createHole00({
                w: wWindow,
                h: hWindow,
                d,
                offsetY: bottomOffsetY,
                offsetX: 0,
                width: SINGLE_SECTION_W,
                height: h - H_POIAS_BOTTOM,
            })
            _M.translateVertices(
                holeWindow.v, 
                SIDE_PILASTER_W +   
                i * SINGLE_SECTION_W + 
                i * INNER_PILASTER_W + 
                SINGLE_SECTION_W * .5, 
                H_POIAS_BOTTOM, 
                0
            )
            v.push(...holeWindow.v)
            uv.push(...holeWindow.uv)     
            c.push(...holeWindow.c)

            // BACK HOLE WINDOW
            let x0 = -SINGLE_SECTION_W * .5
            if (i === 0) {
                x0 = -SINGLE_SECTION_W * .5 + INNER_WALL_START_OFFSET
            } 
            const x1 = -wWindow * .5
            const x2 = wWindow * .5
            let x3 = SINGLE_SECTION_W * .5
            if (i === N - 1) {
                x3 = SINGLE_SECTION_W * .5 - INNER_WALL_END_OFFSET 
            } 
            const y0 = 0
            const y1 = bottomOffsetY + H_POIAS_BOTTOM
            const y2 = bottomOffsetY + H_POIAS_BOTTOM + hWindow
            const y3 = h

            const holeWindowBack = createHoleBack01({
                x0, x1, x2, x3,
                y0, y1, y2, y3
            })
            _M.translateVertices(
                holeWindowBack.v,
                SIDE_PILASTER_W + i * SINGLE_SECTION_W + i * INNER_PILASTER_W + SINGLE_SECTION_W * .5,
                0, 
                -d,
            )

            for (let i = 0; i < holeWindowBack.uv.length; i += 1) {
                holeWindowBack.uv[i] = 0
            }
            for (let i = 0; i < holeWindowBack.c.length; i += 3) {
                holeWindowBack.c[i] = COLOR_DARK_INTERIOR[0]
                holeWindowBack.c[i + 1] = COLOR_DARK_INTERIOR[1]
                holeWindowBack.c[i + 2] = COLOR_DARK_INTERIOR[2]
            }
            v.push(...holeWindowBack.v)
            uv.push(...holeWindowBack.uv)     
            c.push(...holeWindowBack.c)
        }
    }

    return { v, uv, c }
}


export const wall00 = (
    dataForBuldWall: IDataForWall
): IArrayForBuffers => {
    const v: number[] = []
    const uv: number[] = []
    const c: number[] = []
    const vCollide: number[] = []  

    const { 
        w, 
        h, 
        d, 
        TYPE_SIDE_PILASTER, 
        H_TOP_POIAS, 
        TYPE_TOP_POIAS,
        SIDE_PILASTER_W,
        INNER_WALL_START_OFFSET,
        INNER_WALL_END_OFFSET,
    } = dataForBuldWall

    const W = Math.random() * 2 + 2
    const N = Math.floor(w / W)

    const WORK_WALL_W = w - SIDE_PILASTER_W * 2

    const INNER_PILASTER_W = 0.5 + Math.random() * 0.5
    const COUNT_INNER_PILASTERS = N - 1
    const FULL_W_INNER_PILASTERS = INNER_PILASTER_W * COUNT_INNER_PILASTERS

    const FULL_SECTIONS_W = WORK_WALL_W - FULL_W_INNER_PILASTERS
    const SINGLE_SECTION_W = FULL_SECTIONS_W / N

    let N_SECTION_DOOR = SINGLE_SECTION_W < 2 ? -1 : Math.floor(Math.random() * N)
    const W_DOOR = Math.min(SINGLE_SECTION_W - .6,  2 + Math.random() * 2)

    const floorData: ISingleFloorData = {
        w,
        h, 
        d,
        N,
        SIDE_PILASTER_W,
        WORK_WALL_W,
        INNER_PILASTER_W,
        COUNT_INNER_PILASTERS,
        FULL_W_INNER_PILASTERS,
        FULL_SECTIONS_W,
        SINGLE_SECTION_W,
        N_SECTION_DOOR,
        W_DOOR,
        INNER_WALL_START_OFFSET,
        INNER_WALL_END_OFFSET,
    }

    // FILL VERY SHORT SECTION 
    if (N === 0) {
        N_SECTION_DOOR = -1

        const p1: number[] = [0, 0, 0, 0, h - H_TOP_POIAS, 0]
        const p2: number[] = [0, 0, 0, 0, h - H_TOP_POIAS, 0]
        const r = _M.fillPoligonsV3(
            p1, 
            p2,
            w,
            tileMapWall.breakMany,
            COLOR_BLUE_D,
            5,
            false,           
        )
        v.push(...r.v)
        uv.push(...r.uv)
        c.push(...r.c)

        // fill backSide
        {
            const b = _M.createPolygon(
                [w, 0, -d],
                [0, 0, -d],
                [0, h, -d],
                [w, h, -d],
            )
            v.push(...b)
            uv.push(
                ..._M.createUv([0, 0], [0, 0], [0, 0], [0, 0]),
            )
            c.push(..._M.fillColorFace(COLOR_DARK_INTERIOR))
        }
    }

    if (N > 0) {
        let currentH_Level = 0
        let i = 0

        while (currentH_Level < h - H_TOP_POIAS) {
            
            let floorH = 2.2 + Math.random() * 3

            if (h - H_TOP_POIAS - currentH_Level - floorH < 3) {
                floorH = h - H_TOP_POIAS - currentH_Level
            }
            if (i === 0 && floorH < 3) { // remove door
                floorData.N_SECTION_DOOR = -1
                N_SECTION_DOOR = -1
            }

            floorData.h = floorH
        
            const r = createFloor(floorData, i)
            _M.translateVertices(r.v, 0, currentH_Level, 0)

            for (let j = 0; j < r.v.length; ++j) {
                v.push(r.v[j])
            }
            for (let j = 0; j < r.uv.length; ++j) {
                uv.push(r.uv[j])
            }
            for (let j = 0; j < r.c.length; ++j) {
                c.push(r.c[j])
            }
            currentH_Level += floorH
            ++i
        }
    }

    { // OUTER PILASTERS
        let constrPilaster = null
        if (TYPE_SIDE_PILASTER === ElemType.PILASTER_00) {
            constrPilaster = createPilaster00
        } else if (TYPE_SIDE_PILASTER === ElemType.PILASTER_01) {
            constrPilaster = createPilaster01
        } else if (TYPE_SIDE_PILASTER === ElemType.PILASTER_02) {
            constrPilaster = createPilaster02
        } else if (TYPE_SIDE_PILASTER === ElemType.PILASTER_03) {
            constrPilaster = createPilaster03
        } else if (TYPE_SIDE_PILASTER === ElemType.PILASTER_04) {
            constrPilaster = createPilaster04
        }

        if (constrPilaster) {
            const leftP = constrPilaster(SIDE_PILASTER_W, h - H_TOP_POIAS, .3)
            _M.translateVertices(leftP.v, SIDE_PILASTER_W * .5, 0, 0)
            v.push(...leftP.v)
            uv.push(...leftP.uv)
            c.push(...leftP.c)

            const rightP = constrPilaster(SIDE_PILASTER_W, h - H_TOP_POIAS, .3)
            _M.translateVertices(rightP.v, w - SIDE_PILASTER_W * .5, 0, 0)
            v.push(...rightP.v)
            uv.push(...rightP.uv)
            c.push(...rightP.c)
        }
    }

    // TOP POIAS
    {
        let topPoiasConstructor = null
        if (TYPE_TOP_POIAS === ElemType.POIAS_01) {
            topPoiasConstructor = createPoias01
        }
        if (topPoiasConstructor) {
            const topPoias = topPoiasConstructor(w, H_TOP_POIAS, d + .2)
            _M.translateVertices(topPoias.v, 0, h - H_TOP_POIAS, 0)
            v.push(...topPoias.v)
            uv.push(...topPoias.uv)
            c.push(...topPoias.c)
        } else {
            console.log('NO TOP POIAS CONSTRUCTOR')
        }

        // BACK TOP POIAS
        {
            const b = _M.createPolygon(
                [w, h - H_TOP_POIAS, -d],
                [0, h - H_TOP_POIAS, -d],
                [0, h, -d],
                [w, h, -d],
            )
            v.push(...b)
            uv.push(
                ..._M.createUv([0, 0], [0, 0], [0, 0], [0, 0]),
            )
            c.push(..._M.fillColorFace(COLOR_DARK_INTERIOR))
        }
    }

    // TOP ELEMS 
    {
        for (let i = 0; i < COUNT_INNER_PILASTERS; ++i) {
            const topElem = createTopElem_00(COLOR_BLUE_D, INNER_PILASTER_W, .9)
            _M.translateVertices(
                topElem.v, 
                SIDE_PILASTER_W + 
                ((1 + i) * SINGLE_SECTION_W) + 
                INNER_PILASTER_W * (i + .5), 
                h, 
                0
            )
            v.push(...topElem.v)
            uv.push(...topElem.uv)
            c.push(...topElem.c)
        }
    }

    { // collision
        if (N_SECTION_DOOR === -1) { 
            const vC = _M.createPolygon(
                [0, 0, d + .2],
                [w, 0, d + .2],
                [w, h, d + .2],
                [0, h, d + .2],
            )
            vCollide.push(...vC)
            const vC_b = _M.createPolygon(
                [0, 0, - .2],
                [w, 0, - .2],
                [w, h, - .2],
                [0, h, - .2],
            )
            vCollide.push(...vC, ...vC_b)
        } else {
            const startDoorX = SIDE_PILASTER_W + SINGLE_SECTION_W * (N_SECTION_DOOR + .5) + INNER_PILASTER_W * N_SECTION_DOOR - W_DOOR * .5
            const endDoorX = SIDE_PILASTER_W + SINGLE_SECTION_W * (N_SECTION_DOOR + .5)  + INNER_PILASTER_W * N_SECTION_DOOR + W_DOOR * .5
            const v1 = _M.createPolygon(
                [0, 0, d + .2],
                [startDoorX, 0, d + .2],
                [startDoorX, h, d + .2],
                [0, h, d + .2],
            )
            const v2 = _M.createPolygon(
                [startDoorX, 2, d + .2],
                [endDoorX, 2, d + .2],
                [endDoorX, h, d + .2],
                [startDoorX, h, d + .2],
            )
            const v3 = _M.createPolygon(
                [endDoorX, 0, d + .2],
                [w, 0, d + .2],
                [w, h, d + .2],
                [endDoorX, h, d + .2],
            )
            const v1_b = _M.createPolygon(
                [0, 0, -.2],
                [startDoorX, 0, -.2],
                [startDoorX, h, -.2],
                [0, h, -.2],
            )
            const v2_b = _M.createPolygon(
                [startDoorX, 2, -.2],
                [endDoorX, 2, -.2],
                [endDoorX, h, -.2],
                [startDoorX, h, -.2],
            )
            const v3_b = _M.createPolygon(
                [endDoorX, 0, -.2],
                [w, 0, -.2],
                [w, h, -.2],
                [endDoorX, h, -.2],
            )
            vCollide.push(
                ...v1,
                ...v2,
                ...v3,
                ...v1_b,
                ...v2_b,
                ...v3_b,
            )
        }
    }

    return { v, uv, c, vCollide }
}
