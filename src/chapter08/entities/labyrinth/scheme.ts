import { createRandomDataForLine } from "../../geometry/_lineGeom"
import { _M, A3 } from "../../geometry/_m"
import { Dir, DataToCreateLine, Maze } from "./types"

const EMPTY = 1
const TUNNEL = 3
const STAIR = 4


const debugPrintMaze = (maze: Maze, W: number, H: number, posStart: [number, number], posEnd: [number, number]) => {
    const cont = document.createElement('div')
    const parent = document.getElementById('cont-level-dev')
    parent.classList.add('show-over-canvas')
    cont.innerText = '&&&&&'
    parent.appendChild(cont)

    const wallPrint = "&#9608"
    const emptyPrint = "&nbsp"
    const stairPrint = "a"
    const printMaze = (maze: Maze, markX = -1, markY = -1) => {
        cont.innerHTML = ''
        let str = '<pre>'
        for (let y = 0; y < H; ++y) {
            for (let x = 0; x < W; ++x) {
                if (x === posStart[0] && y === posStart[1]) {
                    str += 's'
                    continue;
                }
                if (x === posEnd[0] && y === posEnd[1]) {
                    str += 'e'
                    continue;
                }

                if (maze[x + ',' + y + ''].type === EMPTY) {
                    str += wallPrint
                } else if (maze[x + ',' + y + ''].type === TUNNEL) {
                    str += emptyPrint
                }
            }
            str += '<br />'
        }
        str += '</pre>'
        cont.innerHTML = str + '<br /><br />'
    }

    printMaze(maze)
}



const createMaze = async (
    width: number, 
    height: number, 
    posStart: [number, number], 
    startDirection: Dir, 
    dataForEnter: DataToCreateLine,
) => {
    const WIDTH = width
    const HEIGHT = height

    console.assert(WIDTH % 2 === 1 && WIDTH >= 3)
    console.assert(HEIGHT % 2 === 1 && HEIGHT >= 3)

    let maze: Maze = {}
    let hasVisited: [number, number][] = []
    const posEnd: [number, number] = [null, null]
    let dirToPosEnd: Dir = null
    let pathToPosEnd: A3[] = null
    let colorToPosEnd: A3 = null
    let formToPosEnd: number[] = null

    const makeMap = () => {
        hasVisited = []
        maze = {}
        for (let x = 0; x < WIDTH; ++x) {
            for (let y = 0; y < HEIGHT; ++y) {
                maze[[x, y] + ''] = { type: EMPTY, s: null, e: null, n: null, w: null }
            }
        }
    }

    const visit = async (
        x: number, 
        y: number, 
        prevDir: Dir, 
        prevForm: number[], 
        prevPath: A3[], 
        prevColor: A3,
    ) => {        
        // current tile mark prev direction 
        maze[[x, y] + ''].type = TUNNEL

        if (prevDir === Dir.NORTH) {
            maze[[x, y] + ''][Dir.SOUTH] = {
                color: prevColor,
                form: prevForm,
                path: prevPath,
            }
        }
        if (prevDir === Dir.SOUTH) {
            maze[[x, y] + ''][Dir.NORTH] = {
                color: prevColor,
                form: prevForm,
                path: prevPath,
            }
        }
        if (prevDir === Dir.WEST) {
            maze[[x, y] + ''][Dir.EAST] = {
                color: prevColor,
                form: prevForm,
                path: prevPath,
            }
        }
        if (prevDir === Dir.EAST) {
            maze[[x, y] + ''][Dir.WEST] = {
                color: prevColor,
                form: prevForm,
                path: prevPath,
            }
        }



        while(true) {
            const unvisitetNeighbors = []

            if (
                y > 1 &&
                !JSON.stringify(hasVisited).includes(JSON.stringify([x, y - 2]))
            ) {
                unvisitetNeighbors.push(Dir.NORTH)
            }
            if (
                y < HEIGHT - 2 &&
                !JSON.stringify(hasVisited).includes(JSON.stringify([x, y + 2]))
            ) {
                unvisitetNeighbors.push(Dir.SOUTH)
            }
            if (
                x > 1 &&
                !JSON.stringify(hasVisited).includes(JSON.stringify([x - 2, y]))
            ) {
                unvisitetNeighbors.push(Dir.WEST)
            }
            if (
                x < WIDTH - 2 &&
                !JSON.stringify(hasVisited).includes(JSON.stringify([x + 2, y]))
            ) {
                unvisitetNeighbors.push(Dir.EAST)
            }
            if (unvisitetNeighbors.length === 0) {
                return
            }

            const nextDir = unvisitetNeighbors[Math.floor(Math.random() * unvisitetNeighbors.length)]
            const randomData1 = createRandomDataForLine()
            const currentData = { 
                form: randomData1.form, 
                path: randomData1.path, 
                color: randomData1.color 
            }

            const randomData2 = createRandomDataForLine()
            const nextData = { 
                form: randomData2.form, 
                path: randomData2.path, 
                color: randomData2.color 
            }

            let nextX, nextY
            if (nextDir === Dir.NORTH) {
                maze[[x, y] + ''][Dir.NORTH] = currentData

                maze[[x, y - 1] + ''].type = TUNNEL
                maze[[x, y - 1] + ''][Dir.SOUTH] = currentData
                maze[[x, y - 1] + ''][Dir.NORTH] = nextData

                nextX = x
                nextY = y - 2    
            } else if (nextDir === Dir.SOUTH) {
                maze[[x, y] + ''][Dir.SOUTH] = currentData
                
                maze[[x, y + 1] + ''].type = TUNNEL
                maze[[x, y + 1] + ''][Dir.NORTH] = currentData
                maze[[x, y + 1] + ''][Dir.SOUTH] = nextData

                nextX = x
                nextY = y + 2
            } else if (nextDir === Dir.WEST) {
                maze[[x, y] + ''][Dir.WEST] = currentData

                maze[[x - 1, y] + ''].type = TUNNEL
                maze[[x - 1, y] + ''][Dir.EAST] = currentData
                maze[[x - 1, y] + ''][Dir.WEST] = nextData

                nextX = x - 2
                nextY = y

            } else if (nextDir === Dir.EAST) {
                maze[[x, y] + ''][Dir.EAST] = currentData

                maze[[x + 1, y] + ''].type = TUNNEL
                maze[[x + 1, y] + ''][Dir.WEST] = currentData
                maze[[x + 1, y] + ''][Dir.EAST] = nextData

                nextX = x + 2
                nextY = y
            }
            hasVisited.push([nextX, nextY])

            // save global for stair
            posEnd[0] = nextX
            posEnd[1] = nextY
            dirToPosEnd = nextDir
            pathToPosEnd = currentData.path
            colorToPosEnd = currentData.color
            formToPosEnd = currentData.form

            await visit(nextX, nextY, nextDir, nextData.form, nextData.path, nextData.color)
        }
    }

    makeMap()

    hasVisited.push(posStart)
    maze[posStart + ''] = { type: STAIR }
    const posNext: [number, number] = [...posStart]
    const posNextNext: [number, number] = [...posStart]
    let startGatesDir: Dir

    if (startDirection === 's') {
        posNext[1] = posStart[1] + 1
        posNextNext[1] = posStart[1] + 2
        startGatesDir = Dir.NORTH
    }
    if (startDirection === 'e') {
        posNext[0] = posStart[0] + 1
        posNextNext[0] = posStart[0] + 2
        startGatesDir = Dir.WEST
    }
    if (startDirection === 'n') {
        posNext[1] = posStart[1] - 1
        posNextNext[1] = posStart[1] - 2
        startGatesDir = Dir.SOUTH
    }
    if (startDirection === 'w') {
        posNext[0] = posStart[0] - 1
        posNextNext[0] = posStart[0] - 2
        startGatesDir = Dir.EAST
    }
    hasVisited.push(
        posNext,
        posNextNext
    )
    maze[posNext + ''] = { type: STAIR }
    maze[posNextNext + ''] = { type: TUNNEL, s: null, e: null, n: null, w: null }
    maze[posNextNext + ''][startGatesDir] = dataForEnter

    await visit(posNextNext[0], posNextNext[1], null, null, null, null) 

    return { 
        posStart, 
        posEnd, 
        dirToPosEnd,
        pathToPosEnd,
        colorToPosEnd,
        formToPosEnd, 
        maze,
    }
}




const addStairsData = (maze: Maze, posEnd: [number, number]) => {
    {
        // exit stair from level
        for (let i = posEnd[0] - 1; i < posEnd[0] + 2; ++i) {
            for (let j = posEnd[1] - 1; j < posEnd[1] + 2; ++j) {
                if (maze[i + ',' + j].type === TUNNEL) {
                    maze[i + ',' + j] = { type: EMPTY, s: null, e: null, n: null, w: null }
                }
            }
        }
        maze[posEnd[0] + ',' + posEnd[1]] = { type: STAIR }
    }
}


const prepareSleepEndPoints = (maze: Maze) => {
    const sleepPoints = []
    for (let key in maze) {
        if (maze[key].type === 1) {
            continue;
        }

        let n = 0
        if (maze[key].n) ++n
        if (maze[key].e) ++n
        if (maze[key].s) ++n
        if (maze[key].w) ++n

        if (n !== 1) {
            continue;
        }

        const coordsI = key.split(',')
        sleepPoints.push({ xI: +coordsI[0], yI: +coordsI[1] + 1 })
    }

    return sleepPoints
} 


export const createScheme = async (dataMaze: { 
    width?: number, 
    height?: number, 
    posStart?: [number, number], 
    posStartDir?: Dir, 
    dataForEnter: DataToCreateLine
}) => {

    const width = dataMaze.width || 21
    const height = dataMaze.height || 21
    const posStart = dataMaze.posStart || [11, 1]
    const posStartDir = dataMaze.posStartDir || Dir.SOUTH

    const dataForEnter: DataToCreateLine = dataMaze.dataForEnter
    const resultMaze = await createMaze(width, height, posStart, posStartDir, dataForEnter)

    // debugPrintMaze(resultMaze.maze, width, height, posStart, resultMaze.posEnd)

    const posEnd: [number, number] = resultMaze.posEnd 
    const dirToPosEnd: Dir = resultMaze.dirToPosEnd
    const pathToPosEnd: A3[] = resultMaze.pathToPosEnd 
    const colorToPosEnd: A3 = resultMaze.colorToPosEnd
    const formToPosEnd: number[] = resultMaze.formToPosEnd 
    const maze: Maze = resultMaze.maze
    
    addStairsData(maze, posEnd)
    const posesSleepEnds = prepareSleepEndPoints(maze)

    return {
        maze,
        posStart,
        posEnd, 
        dirToPosEnd,
        pathToPosEnd,
        colorToPosEnd,
        formToPosEnd,
        posesSleepEnds,
    }
}
