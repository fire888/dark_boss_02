import { Core, Studio } from "_CORE"
import { PerspectiveCamera } from "three"

export class StudioCustom extends Studio {
    normCamera: PerspectiveCamera
    carCamera: PerspectiveCamera
    init(root: Core): void {
        super.init(root)

        this.carCamera = new PerspectiveCamera(90, 1, 0.1, 1000)
        this.carCamera.position.set(0, 1.4, -.5)
        this.carCamera.lookAt(0, 1.4, -10)
    }

    toggleToCarCamera() {
        console.log('ERERERE')
        this.normCamera = this.camera
        this.camera = this.carCamera
        if (this.renderPass) {
            this.renderPass.camera = this.camera
        }
    }
}