import * as THREE from 'three'

export enum SegmentType {
    HOUSE_00 = 'HOUSE_00',
    HOUSE_01 = 'HOUSE_01',
    AREA_00 = 'AREA_00',
    STRUCTURE_00 = 'STRUCTURE_00',
}

export enum ElemType {
    WINDOW_00 = 'WINDOW_00',
    DOOR_00 = 'DOOR_00',
    PILASTER_00 = 'PILASTER_00',
    PILASTER_01 = 'PILASTER_01',
    PILASTER_02 = 'PILASTER_02',
    PILASTER_03 = 'PILASTER_03',
    PILASTER_04 = 'PILASTER_04',
    POIAS_00 = 'POIAS_00',
    POIAS_01 = 'POIAS_01',
}

export type TSchemeElem = {
    area: [number, number][],
    offset: [number, number][] | null
} 

export type IArea = {
    center: [number, number],
    area: number,
    perimeter: IPerimeter,
    perimeterInner: IPerimeter,
    typeSegment: SegmentType,
}

export type TLabData = {
    areasData: IArea[],
    positionsEnergy: THREE.Vector3[],
    positionsAntigravs: THREE.Vector3[],
}

export type TTheme = {
        sceneBackground: number[],
    fogColor: number[],
    dirLightColor: number[],
    ambientLightColor: number[],
    materialWalls: {
        color: number[],
        emissive: number[],
        specular: number[],
    },
    materialRoad: {
        color: number[],
        emissive: number[],
    },
    materialGround: {
        color: number[],
        emissive: number[],
        specular: number[],
    },
}

export type ILevelConf = {
    SX: number,
    SY: number,
    N: number,
    repeats: [number, number][],
    positionTeleporter: [number, number],
    percentCompleteEnergy: number,
    playerStartPosition: [number, number],
    fogFar: number,
    theme: TTheme,
    isSetForceAntigravNearLastPortal?: boolean
}

export interface IHoleData {
    elemType?: ElemType,
    offsetX?: number,
    offsetY?: number,
    offsetZ?: number,
    w: number,
    h: number,
    d: number,
}

export interface IHoleOrderData {
    x0: number,
    x1: number,
    x2: number,
    x3: number,
    y0: number,
    y1: number,
    y2: number,
    y3: number,
}

export interface IHoleEgesData extends IHoleData {
    width: number,
    height: number,
}

export type IFloorData = {
    windows?: IHoleData[]
    doors?: IHoleData[]
    pilasters?: IHoleData[]
    poiases?: IHoleData[]
    w: number
    d: number
    h: number
}

// TODO: REMOVE
export type IWallData = {
    w: number,
    h: number,
    d: number,
    floors: IFloorData[],
}

export type IDataForWall = {
    w: number,
    h: number,
    d: number,
    H_TOP_POIAS: number,
    TYPE_TOP_POIAS: ElemType,
    TYPE_SIDE_PILASTER: ElemType,
    SIDE_PILASTER_W: number,
    INNER_WALL_START_OFFSET: number,
    INNER_WALL_END_OFFSET: number
}

export type IArrayForBuffers = {
    v: number[]
    uv: number[]
    c: number[]
    vCollide?: number[]
    forceMat?: number[]
    w?: number 
    h?: number
    d?: number 
}

export type IPerimeter = [number, number][]

export type IdataForFillWall = {
    X: number,
    Z: number,
    buffer: number[],
    w: number,
    h: number,
    d: number,
    angle: number,
    TYPE_TOP_POIAS: ElemType,
    H_TOP_POIAS: number,
    TYPE_SIDE_PILASTER: ElemType,
    SIDE_PILASTER_W: number,
    INNER_WALL_START_OFFSET: number,
    INNER_WALL_END_OFFSET: number
    indicies: {
        [key: string]: number
    }
}
export type IdataForFillWall_TMP = Partial<IdataForFillWall>


const isFullIdataForFillWall = (x: Partial<IdataForFillWall>): x is IdataForFillWall => {
  return Array.isArray(x.buffer) &&
         typeof x.w === 'number' &&
         typeof x.h === 'number' &&
         typeof x.d === 'number';
}

export const addTypeFullIdataForFillWall = (draft: Partial<IdataForFillWall>): IdataForFillWall => {
    if (isFullIdataForFillWall(draft)) {
        const wall: IdataForFillWall = draft;
        return wall
    } else {
        throw new Error('wall draft is incomplete');
    }
}
