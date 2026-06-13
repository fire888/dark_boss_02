import * as THREE from 'three'

export class Scheme {
    scheme: THREE.Vector3[][] = []
    constructor() {

        let MAX_BRANCHES = 100

        const makeBranch = (v3Start: THREE.Vector3, v3Dir: THREE.Vector3, num: number) => {
            MAX_BRANCHES--
            if (MAX_BRANCHES < 0) return

            const v3 = v3Start.clone()
            const v3CurrDir = v3Dir.clone() 

            const branch: THREE.Vector3[] = [ v3.clone() ]

            for (let i = 0; i < num; i++) {
                const addDir = new THREE.Vector3(Math.random() -.5, Math.random() * .1 - .05, Math.random() -.5)
                v3CurrDir.add(addDir)

                const d = Math.random() * 5 + 5
                v3.add(v3CurrDir.clone().multiplyScalar(d))
                branch.push(v3.clone())

                if (Math.random() < .3) {
                    const dir = v3CurrDir
                        .clone()
                        .applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5 * Math.random() < .5 ? 1 : -1)

                    makeBranch(v3, dir, Math.floor(Math.random() * 10) + 2)
                }
            }

            this.scheme.push(branch)

            //return branch
        }



        const v3 = new THREE.Vector3(0, 0, 0)
        const currDir = new THREE.Vector3(0, 0, -1)

        makeBranch(v3, currDir, 20)

    }
}   