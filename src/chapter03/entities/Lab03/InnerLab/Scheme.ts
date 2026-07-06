import * as THREE from 'three'

type IPoint = { 
    points: { 
        [key: string]: { 
            pos: THREE.Vector3,
            neighbors?: string[]
        }
    },
    lines: { 
        [key: string]: {
            p0: string, 
            p1: string, 
            dist: number 
        } 
    } 
}

export class Scheme {
    scheme: IPoint
    constructor() {
        const BOUNDS = new THREE.Box3(
            new THREE.Vector3(-50, -50, -50), 
            new THREE.Vector3(50, 50, 50)
        )

        const agent = {
            pos: new THREE.Vector3(0, 0, 0),
            dir: new THREE.Vector3(0, 0, -1),
            currentPointId: 'p0'
        }

        const SH: IPoint = { 
            points: {
                p0: { 
                    pos: agent.pos.clone(), 
                    neighbors: [] 
                },
            }, 
            lines: {} 
        }

        let MAX_POINTS = 400
        let count = 0

        const agentTryFindNewPoint = (maxAngle: number = Math.PI * .5) => {
            const dist = Math.random() * 5 + 5
            const h = Math.random() * dist * .5 * (Math.random() < .5 ? 1 : -1)

            const dir = 
                agent.dir.clone()
                    .applyAxisAngle(
                        new THREE.Vector3(0, 1, 0), 
                        Math.random() * maxAngle * (Math.random() < .5 ? 1 : -1)
                    )
            const newPos = agent.pos.clone()
                .add(dir.clone().multiplyScalar(dist))
                .add(new THREE.Vector3(0, h, 0))

            return { newPos, dir, dist }
        }

        const calkNextPoint = () => {
            const maxAttempts = 10

            let count = 0
            while (count < maxAttempts) { 
                ++count

                let { newPos, dir, dist } = agentTryFindNewPoint(count / maxAttempts * Math.PI * 4)

                if (BOUNDS.containsPoint(newPos)) {
                    return { newPos, dir, dist }
                } else {
                    //  console.log('try findPoint: count:', count, 'newPos:', newPos)
                }
            }

            return null
        }

        let CC_ID = 0
        const fillBranch = (MAX_POINTS: number) => {
            let count = 0
            while (count < MAX_POINTS) {
                ++count
                ++CC_ID

                const nextPoint = calkNextPoint()
                if (nextPoint) { 
                    let { newPos, dir, dist } = nextPoint
                    let newPointId = `p${CC_ID}`

                    // 
                    for (let key in SH.points) {
                        const p = SH.points[key]
                        if (newPos.distanceTo(p.pos) < 3) { 
                            newPointId = key
                            newPos = p.pos.clone()
                            break
                        }
                    }

                    if (!SH.points[newPointId]) {
                        SH.points[newPointId] = { 
                            pos:newPos.clone(),
                            neighbors: [] 
                        }
                    }
                    SH.lines[`l${CC_ID}`] = { p0: agent.currentPointId, p1: newPointId, dist }

                    agent.pos.copy(newPos)
                    agent.dir.copy(dir)
                    agent.currentPointId = newPointId
                } else {
                    count = MAX_POINTS + 1
                }
            }

            // fill neighbors
            const lines = SH.lines
            for (let key in lines) {
                const l = lines[key]
                if (l) {
                    const { p0, p1 } = l
                    if (
                        SH.points[p0] && 
                        SH.points[p0].neighbors && 
                        !SH.points[p0].neighbors.includes(p1)
                    ) { 
                        SH.points[p0].neighbors?.push(p1) 
                    }

                    if (
                        SH.points[p1] && 
                        SH.points[p1].neighbors && 
                        !SH.points[p1].neighbors.includes(p0)
                    ) { 
                        SH.points[p1].neighbors?.push(p0) 
                    }
                }
            }
        }

        fillBranch(20)

        //let cc = 0
        for (let key in SH.points) { 
            if (Math.random() < 1.1 && SH.points[key].neighbors?.length === 2) {
                // if (cc !== 0) {
                //     break
                // }
                // ++cc

                console.log('branch')
                const posP1 = SH.points[SH.points[key].neighbors![0]].pos.clone()
                const posP2 = SH.points[SH.points[key].neighbors![1]].pos.clone()

                posP2.sub(posP1).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5)
                const dir = posP2.clone()
                console.log('dir:', dir)

                agent.pos.copy(SH.points[key].pos.clone())
                agent.dir.copy(dir)

                fillBranch(10)
            }
        }

        console.log('Scheme generated:', SH)

        this.scheme = SH

        // const makeBranch = (v3Start: THREE.Vector3, v3Dir: THREE.Vector3, num: number) => {
        //     MAX_BRANCHES--
        //     if (MAX_BRANCHES < 0) return

        //     const v3 = v3Start.clone()
        //     const v3CurrDir = v3Dir.clone() 

        //     const branch: THREE.Vector3[] = [ v3.clone() ]

        //     for (let i = 0; i < num; i++) {
        //         const addDir = new THREE.Vector3(Math.random() -.5, Math.random() * .1 - .05, Math.random() -.5)
        //         v3CurrDir.add(addDir)

        //         const d = Math.random() * 5 + 5
        //         v3.add(v3CurrDir.clone().multiplyScalar(d))
        //         branch.push(v3.clone())

        //         if (Math.random() < .3) {
        //             const dir = v3CurrDir
        //                 .clone()
        //                 .applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5 * Math.random() < .5 ? 1 : -1)

        //             makeBranch(v3, dir, Math.floor(Math.random() * 10) + 2)
        //         }
        //     }

        //     this.scheme.push(branch)

        //     //return branch
        // }



        // const v3 = new THREE.Vector3(0, 0, 0)
        // const currDir = new THREE.Vector3(0, 0, -1)

        // makeBranch(v3, currDir, 20)

    }
}   