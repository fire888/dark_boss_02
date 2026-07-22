import * as THREE from 'three'
import { TSchemePoint, Scheme } from './Scheme'
import { _M, IArraysGeom } from '_CORE/_M/_m'
import { Root } from '../../../index' 
import { Node } from './Node'
import { TNodes } from './InnerLab'


export class Edge {
    id: string
    node0Id: string
    node1Id: string
    p0: THREE.Vector3
    p1: THREE.Vector3
    p2: THREE.Vector3
    p3: THREE.Vector3

    _root: Root

    constructor(key: string, sh: Scheme, nodes: TNodes, root: Root) {
        this._root = root

        const line = sh.lines[key]
        this.node0Id = line.p0
        this.node1Id = line.p1

        this.p0 = nodes[this.node0Id].neighbors[this.node1Id].leftPLocal.clone().add(nodes[this.node0Id].pos)
        this.p1 = nodes[this.node0Id].neighbors[this.node1Id].rightPLocal.clone().add(nodes[this.node0Id].pos)

        this.p2 = nodes[this.node1Id].neighbors[this.node0Id].leftPLocal.clone().add(nodes[this.node1Id].pos)
        this.p3 = nodes[this.node1Id].neighbors[this.node0Id].rightPLocal.clone().add(nodes[this.node1Id].pos)
        
        this.id = key


    }

    getAttr() {
        const v: number[] = []
        const c: number[] = []

        const _v = _M.createPolygonV(this.p0, this.p1, this.p2, this.p3)
        v.push(..._v)
        c.push(..._M.fillColorFace([1, 0, 1])) 


        return { v, c }
    }
}