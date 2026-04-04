import { distance } from "three/examples/jsm/nodes/Nodes"
import { Root } from "../index"
import * as THREE from "three"

export class PlayerWallDirection {
    _root: Root
    _currentDirBottom = new THREE.Vector3(0, -1, 0)
    _raycaster = new THREE.Raycaster()

    constructor() {
        this._root = null as any
    }

    init(root: Root) {
        this._root = root
    }

    update() {
        const { camera } = this._root.studio
        const { lab, phisics } = this._root

        let bottomType = 'level'
        let frontType = 'level'
        const frontPoligonNormal = new THREE.Vector3()

        const target = camera.position.clone().add(this._currentDirBottom.clone())
        this._raycaster.set(camera.position, target)
        const intersects = this._raycaster.intersectObjects(lab.currentLevelMeshes)
        if (intersects.length > 0) {
            if (intersects[0].object.name.includes('roadwall')) {
                bottomType = 'roadwall'
            }
        }

        const frontVec = new  THREE.Vector3() 
        camera.getWorldDirection(frontVec)
        frontVec.setY(0).normalize().add(camera.position)
        this._raycaster.set(camera.position, frontVec)
        const intersects2 = this._raycaster.intersectObjects(lab.currentLevelMeshes)
        if (intersects2.length > 0) {
            if (intersects2[0].object.name.includes('roadwall') && intersects2[0].distance < 0.6) {
                frontType = 'roadwall'
                if (intersects2[0]?.face?.normal) frontPoligonNormal.copy(intersects2[0].face.normal)
            }
        }

        if (frontType === 'roadwall') {
            console.log('#### direction')
            camera.up.copy(frontPoligonNormal)
            this._currentDirBottom.copy(frontPoligonNormal).negate()
            const grav = this._currentDirBottom.clone().multiplyScalar(200.82)
            phisics.world.gravity.set(grav.x, grav.y, grav.z)
        }

        return bottomType
    }

}