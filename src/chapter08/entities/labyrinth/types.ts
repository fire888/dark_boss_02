import { A3 } from "../../geometry/_m"

export type PosesSleepEnds = {
    xI: number, 
    yI: number, 
    x?: number, 
    z?: number, 
    y?: number,
}[]

export enum Dir {
    NORTH = 'n',
    SOUTH = 's',
    EAST = 'e',
    WEST = 'w',
}


export type DataToCreateLine = {
    form: number[], // линейный массив перечисления x: 0, y: высота, z: ширина, смотрит вправо   
    path: A3[],
    color: A3,
    isClosed?: boolean,
    dir?: Dir,
}

export type DataToCreateGeom = {
    paths: [A3[], A3[]],
    forms: [number[], number[]],
    colors: [A3, A3],
    key: string,
    n: number,
    w: number,
}

export type DataToCreateTileU = {
    type?: number,    
    [Dir.SOUTH]?: DataToCreateLine,            
    [Dir.EAST]?: DataToCreateLine,
    [Dir.NORTH]?: DataToCreateLine,
    [Dir.WEST]?: DataToCreateLine,
    num: number,
    width: number,
}


export type MazeSegment = {
    type: number,    
    [Dir.SOUTH]?: DataToCreateLine,            
    [Dir.EAST]?: DataToCreateLine,
    [Dir.NORTH]?: DataToCreateLine,
    [Dir.WEST]?: DataToCreateLine,
}

export type Maze = {
    [key: string]: MazeSegment,
}


export type AttributesArrs = {
    v: number[],
    c: number[],
}



