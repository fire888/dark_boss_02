import { _M } from './_m'
import { DataToCreateLine } from '../entities/labyrinth/types'
import { createLineGeom } from './_lineGeom'
import { createRandomDataForLine } from './_lineGeom'
import { vC_H } from '../constants/CONSTANTS'

export const createStair = (data: {
    stairDataBottom: DataToCreateLine,
    stairDataCenterB: DataToCreateLine,
    stairDataCenterT: DataToCreateLine,
    stairDataTop: DataToCreateLine,
    n?: number,
    w?: number,
    h?: number
}) => {

    let { 
        stairDataBottom, 
        stairDataCenterB, 
        stairDataCenterT, 
        stairDataTop, 
        n, 
        w, 
        h = 3 
    } = data

    if (!n) {
        n = 10
    }
    if (!w) {
        w = 3
    }
    if (!stairDataCenterB) {
        stairDataCenterB = createRandomDataForLine()
    }
    if (!stairDataCenterT) {
        stairDataCenterT = createRandomDataForLine()
    }

    const v = []
    const c = []
    const vC = []

    // part enter
    {
        // enter bottom
        /**                        /
                                 /
                               /
                 /-----------/ 
               /
             /  <--!!!!!
         */

        // geometry      
        const arr = _M.interpolateArrays({
            paths: [stairDataBottom.path, stairDataCenterB.path],
            forms: [stairDataBottom.form, stairDataCenterB.form],
            colors: [stairDataBottom.color, stairDataCenterB.color],
            n,
        })

        const stepX = w / n
        const stepY = h / 2 / n
        for (let i = 0; i < arr.paths.length; ++i) {
            const r = createLineGeom({ 
                path: arr.paths[i],
                form: arr.forms[i],
                color: arr.colors[i],
                isClosed: true,
            })
            if (stairDataBottom.dir === 'n') {
                _M.translateVertices(r.v, 0, stepY * i, -w * 1.5 + stepX * i + stepX / 2)
            }
            if (stairDataBottom.dir === 's') {
                _M.translateVertices(r.v, 0, stepY * i, w * 1.5 - stepX * i - stepX / 2)
            }
            if (stairDataBottom.dir === 'w') {
                _M.rotateVerticesY(r.v, Math.PI / 2)
                _M.translateVertices(r.v, -w - w / 2 + i * stepX, stepY * i, 0)
            }
            if (stairDataBottom.dir === 'e') {
                _M.rotateVerticesY(r.v, Math.PI / 2)
                _M.translateVertices(r.v, w + w / 2 - i * stepX, stepY * i, 0)
            }


            v.push(...r.v)
            c.push(...r.c)
        }

        // collision
        const _vC = [
            ..._M.createPolygon(
                [-w * .5, 0, -w * 1.5],
                [-w * .5, h * .5, -w * .5],
                [w * .5, h * .5, -w * .5],
                [w * .5, 0, -w * 1.5],
            ),
            ..._M.createPolygon( // left
                [-w * .5, h * .5, -w * .5],
                [-w * .5, 0, -w * 1.5],
                [-w * .5, vC_H, -w * 1.5],
                [-w * .5, vC_H, -w * .5],
            ),

            ..._M.createPolygon( // right
                [w * .5, 0, -w * 1.5],
                [w * .5, h * .5, -w * .5],
                [w * .5, vC_H, -w * .5],
                [w * .5, vC_H, -w * 1.5],
            ),
        ]
        if (stairDataBottom.dir === 'n') {
        }
        if (stairDataBottom.dir === 's') {
            _M.rotateVerticesY(_vC, Math.PI)
        }
        if (stairDataBottom.dir === 'w') {
            _M.rotateVerticesY(_vC, Math.PI * .5)
        }
        if (stairDataBottom.dir === 'e') {
            _M.rotateVerticesY(_vC, Math.PI * 1.5)
        }
        vC.push(..._vC)
    }


    // part Exit
    {
        /**
                             /  <--!!!!!
                            /
                           /
              /-----------/ 
             /
            /  
        */
        const t = []
        const arr = _M.interpolateArrays({
            paths: [stairDataCenterT.path, stairDataTop.path],
            forms: [stairDataCenterT.form, stairDataTop.form],
            colors: [stairDataCenterT.color, stairDataTop.color],
            n,
        })

        const stepX = w / n
        const stepY = h / 2 / n
        for (let i = 0; i < arr.paths.length; ++i) {
            const r = createLineGeom({ 
                path: arr.paths[i],
                form: arr.forms[i],
                color: arr.colors[i],
                isClosed: true,
            })
            if (stairDataTop.dir === 's') {
                _M.translateVertices(r.v, 0, stepY * i + h / 2, w * .5 + stepX * i + stepX / 2)
            }
            if (stairDataTop.dir === 'n') {
                _M.translateVertices(r.v, 0, stepY * i + h / 2, -w * .5 - stepX * i - stepX / 2)
            }
            if (stairDataTop.dir === 'e') {
                _M.rotateVerticesY(r.v, Math.PI / 2)
                _M.translateVertices(r.v, w / 2 + i * stepX, stepY * i + h / 2, 0)
            }
            if (stairDataTop.dir === 'w') {
                _M.rotateVerticesY(r.v, Math.PI / 2)
                _M.translateVertices(r.v, -w / 2 - i * stepX, stepY * i  + h / 2, 0)
            }

            v.push(...r.v)
            c.push(...r.c)
        }

        // collision
        const _vC = [
            ..._M.createPolygon(
                [-w * .5, h * .5, -w * .5],
                [w * .5, h * .5, -w * .5],
                [w * .5, h, -w * 1.5],
                [-w * .5, h, -w * 1.5],
            ),
            ..._M.createPolygon( // left
                [-w * .5, h * .5, -w * .5],
                [-w * .5, h, -w * 1.5],
                [-w * .5, vC_H * 1.5, -w * 1.5],
                [-w * .5, vC_H, -w * .5],
            ),
            ..._M.createPolygon( // right
                [w * .5, h, -w * 1.5],
                [w * .5, h * .5, -w * .5],
                [w * .5, vC_H, -w * .5],
                [w * .5, vC_H * 1.5, -w * 1.5],
            ),
        ]
        if (stairDataTop.dir === 'n') {
        }
        if (stairDataTop.dir === 's') {
            _M.rotateVerticesY(_vC, Math.PI)
        }
        if (stairDataTop.dir === 'w') {
            _M.rotateVerticesY(_vC, Math.PI * .5)
        }
        if (stairDataTop.dir === 'e') {
            _M.rotateVerticesY(_vC, Math.PI * 1.5)
        }
        vC.push(..._vC)
    }


    /*
                      / 
                     /
                    /
          /--------/  <-!!!!
         /
        /
    */
    {

        const arr = _M.interpolateArrays({
            paths: [stairDataCenterB.path, stairDataCenterT.path],
            forms: [stairDataCenterB.form, stairDataCenterT.form],
            colors: [stairDataCenterB.color, stairDataCenterT.color],
            n,
        })
        const step = w / n
        for (let i = 0; i < arr.paths.length; ++i) {
            const r = createLineGeom({ 
                path: arr.paths[i],
                form: arr.forms[i],
                color: arr.colors[i],
                isClosed: true,
            })

            if (stairDataBottom.dir === 'n' && stairDataTop.dir === 's') {
                _M.translateVertices(r.v, 0, h / 2, -w / 2 + step / 2 + step * i) 
            }

            if (stairDataBottom.dir === 's' && stairDataTop.dir === 'n') {
                _M.translateVertices(r.v, 0, h / 2, w / 2 - step / 2 - step * i) 
            }

            if (stairDataBottom.dir === 'w' && stairDataTop.dir === 'e') {
                _M.rotateVerticesY(r.v, Math.PI / 2)
                _M.translateVertices(r.v, -w / 2 + step / 2 + step * i, h / 2, 0) 
            }

            if (stairDataBottom.dir === 'e' && stairDataTop.dir === 'w') {
                _M.rotateVerticesY(r.v, Math.PI / 2)
                _M.translateVertices(r.v, w / 2 - step / 2 - step * i, h / 2, 0) 
            }

            if (stairDataBottom.dir === 'n' && stairDataTop.dir === 'w') {
                _M.translateVertices(r.v, w / 2, h / 2, 0)
                _M.rotateVerticesY(r.v, -Math.PI / 2 / n * i)
                _M.translateVertices(r.v, -w / 2, 0, -w / 2) 

                // collision form 
                /*
                        - -
                      /    
                     /  
                    |
                    |       *  
                */
                const radius = w
                const angleStep = Math.PI * .5 / 5
                const arcVC = [] 
                for (let i = 0; i < 5; ++i) {
                    const add = Math.PI * .5
                    arcVC.push(..._M.createPolygon(
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5, Math.sin(-angleStep * (i + 1) - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5 + w, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5 +w, Math.sin(-angleStep * (i + 1) - add) * radius],
                    ))
                }
                _M.translateVertices(arcVC, w * .5, 0, w * .5)
                _M.rotateVerticesY(arcVC, Math.PI)
                vC.push(...arcVC)
            }

            if (stairDataBottom.dir === 'n' && stairDataTop.dir === 'e') {
                _M.translateVertices(r.v, -w / 2, h / 2, 0)
                _M.rotateVerticesY(r.v, Math.PI / 2 / n * i)
                _M.translateVertices(r.v, w / 2, 0, -w / 2)

                // collision form 
                /*
                        - -
                    /    
                    /  
                    |
                    |       *  
                */
                const radius = w
                const angleStep = Math.PI * .5 / 5
                const arcVC = [] 
                for (let i = 0; i < 5; ++i) {
                    const add = Math.PI * .5
                    arcVC.push(..._M.createPolygon(
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5, Math.sin(-angleStep * (i + 1) - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * (i + 1) - add) * radius],
                    ))
                }
                _M.translateVertices(arcVC, w * .5, 0, w * .5)
                _M.rotateVerticesY(arcVC, Math.PI * .5)
                vC.push(...arcVC)
            }

            if (stairDataBottom.dir === 's' && stairDataTop.dir === 'e') {
                _M.translateVertices(r.v, -w / 2, h / 2, 0)
                _M.rotateVerticesY(r.v, -Math.PI / 2 / n * i)
                _M.translateVertices(r.v, w / 2, 0, w / 2)

                // collision form 
                /*
                        - -
                    /    
                    /  
                    |
                    |       *  
                */
                const radius = w
                const angleStep = Math.PI * .5 / 5
                const arcVC = [] 
                for (let i = 0; i < 5; ++i) {
                    const add = Math.PI * .5
                    arcVC.push(..._M.createPolygon(
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5, Math.sin(-angleStep * (i + 1) - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * (i + 1) - add) * radius],
                    ))
                }
                _M.translateVertices(arcVC, w * .5, 0, w * .5)
                vC.push(...arcVC)
            }

            if (stairDataBottom.dir === 's' && stairDataTop.dir === 'w') {
                _M.translateVertices(r.v, w / 2, h / 2, 0)
                _M.rotateVerticesY(r.v, Math.PI / 2 / n * i)
                _M.translateVertices(r.v, -w / 2, 0, w / 2) 

                // collision form 
                /*
                        - -
                    /    
                    /  
                    |
                    |       *  
                */
                const radius = w
                const angleStep = Math.PI * .5 / 5
                const arcVC = [] 
                for (let i = 0; i < 5; ++i) {
                    const add = Math.PI * .5
                    arcVC.push(..._M.createPolygon(
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5, Math.sin(-angleStep * (i + 1) - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * (i + 1) - add) * radius],
                    ))
                }
                _M.translateVertices(arcVC, w * .5, 0, w * .5)
                _M.rotateVerticesY(arcVC, Math.PI * 1.5)
                vC.push(...arcVC)
            }

            if (stairDataBottom.dir === 'e' && stairDataTop.dir === 'n') {
                _M.translateVertices(r.v, -w / 2, h / 2, 0)
                _M.rotateVerticesY(r.v, Math.PI / 2 - Math.PI / 2 / n * i)
                _M.translateVertices(r.v, w / 2, 0, -w / 2)

                // collision form 
                /*
                        - -
                    /    
                    /  
                    |
                    |       *  
                */
                const radius = w
                const angleStep = Math.PI * .5 / 5
                const arcVC = [] 
                for (let i = 0; i < 5; ++i) {
                    const add = Math.PI * .5
                    arcVC.push(..._M.createPolygon(
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5, Math.sin(-angleStep * (i + 1) - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * (i + 1) - add) * radius],
                    ))
                }
                _M.translateVertices(arcVC, w * .5, 0, w * .5)
                _M.rotateVerticesY(arcVC, Math.PI * .5)
                vC.push(...arcVC)
            }

            if (stairDataBottom.dir === 'e' && stairDataTop.dir === 's') {
                _M.translateVertices(r.v, w / 2, h / 2, 0)
                _M.rotateVerticesY(r.v, Math.PI / 2 + Math.PI / 2 / n * i)
                _M.translateVertices(r.v, w / 2, 0, w / 2)

                // collision form 
                /*
                        - -
                    /    
                    /  
                    |
                    |       *  
                */
                const radius = w
                const angleStep = Math.PI * .5 / 5
                const arcVC = [] 
                for (let i = 0; i < 5; ++i) {
                    const add = Math.PI * .5
                    arcVC.push(..._M.createPolygon(
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5, Math.sin(-angleStep * (i + 1) - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * (i + 1) - add) * radius],
                    ))
                }
                _M.translateVertices(arcVC, w * .5, 0, w * .5)
               // _M.rotateVerticesY(arcVC, Math.PI * .5)
                vC.push(...arcVC)
            }

            if (stairDataBottom.dir === 'w' && stairDataTop.dir === 'n') {
                _M.translateVertices(r.v, -w / 2, h / 2, 0)
                _M.rotateVerticesY(r.v, Math.PI / 2 + Math.PI / 2 / n * i)
                _M.translateVertices(r.v, -w / 2, 0, -w / 2)

                // collision form 
                /*
                        - -
                    /    
                    /  
                    |
                    |       *  
                */
                const radius = w
                const angleStep = Math.PI * .5 / 5
                const arcVC = [] 
                for (let i = 0; i < 5; ++i) {
                    const add = Math.PI * .5
                    arcVC.push(..._M.createPolygon(
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5, Math.sin(-angleStep * (i + 1) - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5 + w, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5 +w, Math.sin(-angleStep * (i + 1) - add) * radius],
                    ))
                }
                _M.translateVertices(arcVC, w * .5, 0, w * .5)
                _M.rotateVerticesY(arcVC, Math.PI)
                vC.push(...arcVC)
            }

            if (stairDataBottom.dir === 'w' && stairDataTop.dir === 's') {
                _M.translateVertices(r.v, w / 2, h / 2, 0)
                _M.rotateVerticesY(r.v, Math.PI / 2 - Math.PI / 2 / n * i)
                _M.translateVertices(r.v, -w / 2, 0, w / 2) 

                // collision form 
                /*
                        - -
                    /    
                    /  
                    |
                    |       *  
                */
                const radius = w
                const angleStep = Math.PI * .5 / 5
                const arcVC = [] 
                for (let i = 0; i < 5; ++i) {
                    const add = Math.PI * .5
                    arcVC.push(..._M.createPolygon(
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5, Math.sin(-angleStep * (i + 1) - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * i - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * i - add) * radius],
                        [Math.cos(-angleStep * (i + 1) - add) * radius, h * .5 + vC_H, Math.sin(-angleStep * (i + 1) - add) * radius],
                    ))
                }
                _M.translateVertices(arcVC, w * .5, 0, w * .5)
                _M.rotateVerticesY(arcVC, Math.PI * 1.5)
                vC.push(...arcVC)
            }

            v.push(...r.v)
            c.push(...r.c)
        }

        // collision
        const _vC = [
            ..._M.createPolygon(
                [-w * .5, h * .5, w * .5],
                [w * .5, h * .5, w * .5],
                [w * .5, h * .5, -w * .5],
                [-w * .5, h * .5, -w * .5],
            ),
        ]   

        if (
            (stairDataBottom.dir === 'n' && stairDataTop.dir === 's') ||
            (stairDataBottom.dir === 's' && stairDataTop.dir === 'n')
        ) {
            _vC.push(
                ..._M.createPolygon( // left
                    [-w * .5, h * .5, w * .5],
                    [-w * .5, h * .5, -w * .5],
                    [-w * .5, h, -w * .5],
                    [-w * .5, h, w * .5],
                ),
                ..._M.createPolygon( // right
                    [w * .5, h * .5, -w * .5],
                    [w * .5, h * .5, w * .5],
                    [w * .5, h, w * .5],
                    [w * .5, h, -w * .5],
                ),
            )
        }

        if (
            (stairDataBottom.dir === 'w' && stairDataTop.dir === 'e') ||
            (stairDataBottom.dir === 'e' && stairDataTop.dir === 'w')
        ) {
            const _wallsVC = []
            _wallsVC.push(
                ..._M.createPolygon( // left
                    [-w * .5, h * .5, w * .5],
                    [-w * .5, h * .5, -w * .5],
                    [-w * .5, h, -w * .5],
                    [-w * .5, h, w * .5],
                ),
                ..._M.createPolygon( // right
                    [w * .5, h * .5, -w * .5],
                    [w * .5, h * .5, w * .5],
                    [w * .5, h, w * .5],
                    [w * .5, h, -w * .5],
                ),
            )
            _M.rotateVerticesY(_wallsVC, Math.PI * .5)
            _vC.push(..._wallsVC)
        }

    
        vC.push(..._vC)
    }

    return {
        v,
        vC,
        c,
    }
}
