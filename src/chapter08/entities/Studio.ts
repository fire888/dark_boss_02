import { 
    EquirectangularReflectionMapping,
    SRGBColorSpace,
    Vector3,
    Quaternion,
} from 'three'
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { Root } from "../index";
import { Tween, Easing } from '@tweenjs/tween.js'
import { Studio } from '_CORE/Studio';

export class StudioCustom extends Studio {
    init (root: Root) {
        super.init(root)

        root.loader.assets.mapEnv.mapping = EquirectangularReflectionMapping;
        root.loader.assets.mapEnv.colorSpace = SRGBColorSpace;
        this.scene.background = root.loader.assets.mapEnv
    }

    cameraFlyAway (dir: string) {
        return new Promise(res => {
            const t = 5000
            {
                const savedPos = new Vector3().copy(this.camera.position) 
                const newPos = new Vector3().copy(this.camera.position) 
                const dist = 500
                if (dir === 'n') {
                    newPos.z -= dist
                }
                if (dir === 's') {
                    newPos.z += dist
                }
                if (dir === 'e') {
                    newPos.x += dist
                }
                if (dir === 'w') {
                    newPos.x -= dist
                }
        
                

                const obj = { v: 0 }
                new Tween(obj)
                    .easing(Easing.Exponential.InOut)
                    .to({ v: 1 },  t)
                    .onUpdate(() => {
                        this.camera.position.lerpVectors(savedPos, newPos, obj.v)
                    })
                    .onComplete(() => {
                        res(true)
                    })
                    .start()
            }

            {
                const targetQ = new Quaternion(
                    4.1079703617011707e-17, 
                    0.6708824723277438, 
                    -0.7415636913464778, 
                    4.540768004856799e-17, 
                )
                const savedQ = new Quaternion().copy(this.camera.quaternion)
                const obj = { v: 0 }
                new Tween(obj)
                    .easing(Easing.Exponential.InOut)
                    .to({ v: 1 }, t)
                    .onUpdate(() => {
                        this.camera.quaternion.slerpQuaternions(savedQ, targetQ, obj.v * 5)
                    })
                    .onComplete(() => {})
                    .start()  
            }  
        })
    }

    cameraFlyToLevel (playerStartPosition: number[]) {
        const from = [playerStartPosition[0], playerStartPosition[1], playerStartPosition[2] - 1500]
        const to = [...playerStartPosition]
        const time = 5000

        return new Promise(res => {
            const savedPos = new Vector3().fromArray(from)
            const targetPos = new Vector3().fromArray(to)

            const savedQ = new Quaternion().copy(this.camera.quaternion)

            this.camera.position.copy(savedPos)
            this.camera.lookAt(targetPos)

            const targetQ = new Quaternion().copy(this.camera.quaternion)
        
            const obj = { v: 0 }
            new Tween(obj)
                .easing(Easing.Exponential.InOut)
                .to({ v: 1 }, time)
                .onUpdate(() => {
                    this.camera.position.lerpVectors(savedPos, targetPos, obj.v)
                    this.camera.quaternion.slerpQuaternions(savedQ, targetQ, Math.min(1., obj.v * 1.3))
                })
                .onComplete(() => {
                    res(true)
                })
                .start()
        })
    }
}
