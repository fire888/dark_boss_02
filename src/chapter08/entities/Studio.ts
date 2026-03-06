import { 
    PerspectiveCamera,
    Scene, 
    Fog,
    HemisphereLight,
    DirectionalLight,
    WebGLRenderer,
    Texture,
    EquirectangularReflectionMapping,
    SRGBColorSpace,
    Object3D,
    Vector3,
    AxesHelper,
    Quaternion,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
//import { BokehPass } from 'three/examples/jsm/postprocessing/';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { Root } from "../index";
import { Tween, Interpolation, Easing } from '@tweenjs/tween.js'



const params = {
    threshold: 0.65,
    strength: 0.2,
    radius: 0,

    focus: 500.0,
    aperture: 5,
    maxblur: 0.01
}

export class Studio {
    containerDom: HTMLElement
    camera: PerspectiveCamera
    scene: Scene
    fog: Fog
    hemiLight: HemisphereLight
    dirLight: DirectionalLight
    renderer: WebGLRenderer
    envMap: Texture
    composer: EffectComposer
    _root: Root

    init (root: Root) {
        this._root = root
        this.containerDom = document.getElementById('container-game')
        this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, .001, 1000)
        this.camera.position.set(1, 30, 70)
        this.camera.lookAt(0, 1, 0)

        this.scene = new Scene()
        //debugger
        //root.loader.assets.envMap.encoding = THREE.sRGBEncoding;
        root.loader.assets.mapEnv.mapping = EquirectangularReflectionMapping;
        root.loader.assets.mapEnv.colorSpace = SRGBColorSpace;

        this.scene.background = root.loader.assets.mapEnv
        this.envMap = root.loader.assets.mapEnv
        //this.scene.background = new THREE.Color(0x999999)
        //this.fog = new THREE.Fog(0x00001a, 1, 50)
        //this.fog = new THREE.Fog(0x00001a, 1, 50)
        //this.scene.fog = this.fog

       this.hemiLight = new HemisphereLight(0x6767f3, 0xffffff, 5)
       this.hemiLight.position.set( 0, 20, 0 )
       this.scene.add(this.hemiLight)

        this.dirLight = new DirectionalLight( 0xffffff, 3 )
        this.dirLight.position.set(-3, 10, 2)
        // this.dirLight.castShadow = true
        // this.dirLight.shadow.camera.top = 2
        // this.dirLight.shadow.camera.bottom = -2
        // this.dirLight.shadow.camera.left = -2
        // this.dirLight.shadow.camera.right = 2
        // this.dirLight.shadow.camera.near = 0.1
        // this.dirLight.shadow.camera.far = 40
        this.scene.add(this.dirLight)

        this.renderer = new WebGLRenderer({ antialias: true })
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        //this.renderer.shadowMap.enabled = true
        this.containerDom.appendChild(this.renderer.domElement)


        const renderScene = new RenderPass(this.scene, this.camera)

        const smaaPass = new SMAAPass( window.innerWidth * this.renderer.getPixelRatio(), window.innerHeight * this.renderer.getPixelRatio() );

        const bokehPass = new BokehPass(this.scene, this.camera, {
            focus: 50,
            aperture: 0.00002,
            //maxblur: 0.015
            maxblur: 0.01
        } );

        //const bloomPass = new UnrealBloomPass( new THREE.Vector2(window.innerWidth, window.innerHeight),1.5,0.4,0.85)
        //bloomPass.threshold = params.threshold
        //bloomPass.strength = params.strength
        //bloomPass.radius = params.radius

        const outputPass = new OutputPass();

        this.composer = new EffectComposer(this.renderer)
        this.composer.addPass(renderScene)
        this.composer.addPass(smaaPass)
        this.composer.addPass(bokehPass)
        //this.composer.addPass(bloomPass)
        this.composer.addPass(outputPass)

        window.addEventListener( 'resize', this.onWindowResize.bind(this))
        this.onWindowResize()

        // const gui = new GUI();
        // const bloomFolder = gui.addFolder( 'bloom' );
        // bloomFolder.add(params, 'threshold',0.0,1.0).onChange( function ( value ) {
        //     bloomPass.threshold = Number( value );
        // });

        // bloomFolder.add( params, 'strength', 0.0, 3.0 ).onChange( function ( value ) {
        //     bloomPass.strength = Number( value );
        // });

        // gui.add( params, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
        //     bloomPass.radius = Number( value );
        // });

        // gui.add( params, 'focus', 1, 300, .0001 ).onChange( v => {
        //     // @ts-ignore:next-line
        //     bokehPass.uniforms.focus.value = v
        // });
        // gui.add( params, 'aperture', 0, .1, 0.000001 ).onChange( v => {
        //     // @ts-ignore:next-line
        //     bokehPass.uniforms.aperture.value = v
        // });
        // gui.add( params, 'maxblur', 0.0, 0.05, 0.0001 ).onChange( v => {
        //     // @ts-ignore:next-line
        //     bokehPass.uniforms.maxblur.value = v
        // })

        //const smaaFolder = gui.addFolder( 'SMAA' );
        //smaaFolder.add( params, 'enabled' );
    }

    render () {
        //this.renderer.render(this.scene, this.camera)
        this.composer.render()
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.composer.setSize(window.innerWidth, window.innerHeight)
    }

    add (m: Object3D) {
        this.scene.add(m)
    }

    remove (m: Object3D) {
        this.scene.remove(m)
    }

    addAxisHelper () {
        const axesHelper = new AxesHelper(15)
        this.scene.add(axesHelper)
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

    cameraFlyToLevel () {
        const { PLAYER_START_POS } = this._root.CONSTANTS

        //const from = [PLAYER_START_POS[0], PLAYER_START_POS[1] + 300, PLAYER_START_POS[2] - 1500]
        const from = [PLAYER_START_POS[0], PLAYER_START_POS[1], PLAYER_START_POS[2] - 1500]
        const to = PLAYER_START_POS
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

    showFinalView () {
        this.camera.position.set(17.5, 1, -6)
        this.camera.lookAt(14, .5, 0)
    }
}
