import { 
    PerspectiveCamera,
    Scene, 
    Fog,
    HemisphereLight,
    DirectionalLight,
    WebGLRenderer,
    Texture,
    SRGBColorSpace,
    Object3D,
    AxesHelper,
    SpotLight,
} from 'three'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { Saturate3 } from './shaders/saturate';
import { Core } from "./types"
import { Tween, Easing } from '@tweenjs/tween.js'

export class Studio {
    containerDom: HTMLElement
    camera: PerspectiveCamera
    scene: Scene
    fog: Fog
    hemiLight: HemisphereLight
    dirLight: DirectionalLight
    renderer: WebGLRenderer
    envMap: Texture
    _root: Core
    spotLight: SpotLight
    amb: THREE.AmbientLight
    ssaoPass: SSAOPass
    saturatePass: ShaderPass
    composer: EffectComposer | null
    
    init (root: Core) {
        this._root = root
        this.containerDom = document.getElementById('container-game')

        this.scene = new Scene()
        
        const { studioConf } = this._root

        const fov = studioConf.cameraFov ?? 45
        this.camera = new PerspectiveCamera(fov, window.innerWidth / window.innerHeight, .1, 1000)
        this.camera.position.copy(studioConf.cameraPos)
        this.camera.lookAt(...studioConf.cameraLookAt.toArray())
        this.camera.updateProjectionMatrix()

        if (studioConf.spotLightParams) {
            this.spotLight = new SpotLight()
            this.spotLight.color.set(studioConf.spotLightParams.color)
            this.spotLight.intensity = studioConf.spotLightParams.intensity
            this.spotLight.position.copy(studioConf.spotLightParams.pos)
            this.spotLight.angle = studioConf.spotLightParams.angle
            this.spotLight.penumbra = studioConf.spotLightParams.penumbra
            this.spotLight.decay = studioConf.spotLightParams.decay
            this.spotLight.distance = studioConf.spotLightParams.distance
            const target = new Object3D()
            this.spotLight.target = target
            target.position.set(...studioConf.spotLightParams.targetPos.toArray())
            this.camera.add(this.spotLight.target)
            this.scene.add(this.spotLight)
        }

        if (studioConf.hemisphereLightParams) {
            this.hemiLight = new HemisphereLight(studioConf.hemisphereLightParams.skyColor, studioConf.hemisphereLightParams.groundColor, studioConf.hemisphereLightParams.intensity)
            this.hemiLight.position.copy(studioConf.hemisphereLightParams.pos)
            this.scene.add(this.hemiLight)
        }

        this.scene.add(this.camera)

        if (studioConf.sceneBackground) {
            this.scene.background = studioConf.sceneBackground
        }

        if (studioConf.fogParams) {
            this.fog = new THREE.Fog(studioConf.fogParams.color, studioConf.fogParams.near, studioConf.fogParams.far)
            this.addFog()
        }

        if (studioConf.ambientLightParams) {
            this.amb = new THREE.AmbientLight(studioConf.ambientLightParams.color, studioConf.ambientLightParams.intensity) 
            this.scene.add(this.amb)
        }

        if (studioConf.directionalLightParams) {
            this.dirLight = new DirectionalLight()
            this.dirLight.color = studioConf.directionalLightParams.color
            this.dirLight.intensity = studioConf.directionalLightParams.intensity
            this.dirLight.position.copy(studioConf.directionalLightParams.pos)
            this.scene.add(this.dirLight)
        }

        this.renderer = new WebGLRenderer({ antialias: true })
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.containerDom.appendChild(this.renderer.domElement)

        if (studioConf.SSAO || studioConf.SSMA || studioConf.bokehPass || studioConf.saturatePass) {
            this.composer = new EffectComposer(this.renderer)
            const renderPass = new RenderPass(this.scene, this.camera)
            this.composer.addPass(renderPass)
        }

        if (studioConf.SSMA) {
            const smaaPass = new SMAAPass( window.innerWidth * this.renderer.getPixelRatio(), window.innerHeight * this.renderer.getPixelRatio() );
            this.composer.addPass(smaaPass)
        }

        if (studioConf.SSAO) {
            this.ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight)
            this.ssaoPass.kernelRadius = studioConf.SSAO.kernelRadius
            this.ssaoPass.minDistance = studioConf.SSAO.minDistance
            this.ssaoPass.maxDistance = studioConf.SSAO.maxDistance
            this.ssaoPass.enabled = studioConf.SSAO.enabled
            this.composer.addPass(this.ssaoPass)
        }

        if (studioConf.bokehPass) {
            const bokehPass = new BokehPass(this.scene, this.camera, studioConf.bokehPass)
            this.composer.addPass(bokehPass)
        }

        if (studioConf.saturatePass) {
            this.saturatePass = new ShaderPass(Saturate3)
            this.composer.addPass(this.saturatePass) 
        }

        if (this.composer) {
            const outputPass = new OutputPass()
            this.composer.addPass(outputPass)
        }

        window.addEventListener( 'resize', this.onWindowResize.bind(this))
        this.onWindowResize()
    }

    render () {
        if (this.spotLight) {
            this.camera.getWorldPosition(this.spotLight.position)
            this.spotLight.position.y += .1
        }

        if (this.composer) {
            this.composer.render()
        } else {
            this.renderer.render(this.scene, this.camera)
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(window.innerWidth, window.innerHeight)
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight)
        }
    }

    add (m: Object3D) {
        this.scene.add(m)
    }

    remove (m: Object3D) {
        this.scene.remove(m)
    }

    addAxisHelper (x = 0, y = 0, z = 0, size = 15) {
        const axesHelper = new AxesHelper(size)
        axesHelper.position.set(x, y, z)
        this.scene.add(axesHelper)
    }

    cameraFlyToLevel (playerStartPosition: number[]) {
        const time = 5000

        const savedPos = new THREE.Vector3().fromArray([playerStartPosition[0], playerStartPosition[1], playerStartPosition[2] - 10])
        const targetPos = new THREE.Vector3().fromArray(playerStartPosition)

        const startFogFar = .5
        const endFogFar = 3

        this.camera.position.copy(savedPos)
        this.camera.lookAt(targetPos)
        const savedQ = new THREE.Quaternion().copy(this.camera.quaternion)
        this.camera.lookAt(new THREE.Vector3().copy(targetPos).setZ(targetPos.z + 100000))
        const startQ = new THREE.Quaternion().copy(this.camera.quaternion) 
        const targetQ = new THREE.Quaternion().copy(savedQ)

        if (this.ssaoPass) {
            this.ssaoPass.maxDistance = 0
        }

        return new Promise(res => {
            this.camera.position.copy(savedPos)
            this.camera.lookAt(targetPos)

            const obj = { v: 0 }
            new Tween(obj)
                .easing(Easing.Linear.In)
                .to({ v: 1 }, time)
                .onUpdate(() => {
                    if (this.ssaoPass) {
                        this.ssaoPass.maxDistance = obj.v * 15
                        this.ssaoPass.minDistance = (1 - obj.v) * 0.05
                    }

                    this.camera.position.lerpVectors(savedPos, targetPos, obj.v)
                    this.camera.quaternion.slerpQuaternions(startQ, targetQ, Math.min(1., obj.v * 1.3))
                    this.fog.far = startFogFar + (endFogFar - startFogFar) * obj.v
                })
                .onComplete(() => {
                    res(true)
                })
                .start()
        })
    }

    hideSSAO (time: number = 3000) {
        if (!this.ssaoPass) return

        const startMax = this.ssaoPass.maxDistance
        const startMin = this.ssaoPass.minDistance
        const targetMax = 0
        const targetMin = 0.2001

        return new Promise(res => {
            const obj = { v: 0 }
            new Tween(obj)
                .easing(Easing.Linear.In)
                .to({ v: 1 }, time)
                .onUpdate(() => {
                    this.ssaoPass.maxDistance = (1 - obj.v) * startMax
                    this.ssaoPass.minDistance = startMin + obj.v * (targetMin - startMin)
                })
                .onComplete(() => {
                    res(true)
                })
                .start()
        })
    }

    animateFogTo(far: number, color: number[], time: number) {
        console.log(' !!! deplecated')

        const startFogFar = this.fog.far
        const endFogFar = far
        const startColor = new THREE.Color().copy(this.fog.color)
        const endColor = new THREE.Color().fromArray(color)
        
        return new Promise(res => {        
            const obj = { v: 0 }
            new Tween(obj)
                .easing(Easing.Exponential.InOut)
                .to({ v: 1 }, time)
                .onUpdate(() => {
                    this.fog.far = startFogFar + (endFogFar - startFogFar) * obj.v
                    this.fog.color.lerpColors(startColor, endColor, obj.v)
                })
                .onComplete(() => {
                    res(true)
                })
                .start()
        })
    } 

    animateBackgroundTo(color: number[], time: number) {
        // @ts-ignore
        const startColor = new THREE.Color().copy(this.scene.background)
        const endColor = new THREE.Color().fromArray(color)
        
        return new Promise(res => {        
            const obj = { v: 0 }
            new Tween(obj)
                .easing(Easing.Exponential.InOut)
                .to({ v: 1 }, time)
                .onUpdate(() => {
                    // @ts-ignore
                    this.scene.background.lerpColors(startColor, endColor, obj.v)
                })
                .onComplete(() => {
                    res(true)
                })
                .start()
        })
    }

    animateLightTo(colorDir: number[], colorAmb: number[], time: number = 3000) {
        const startColorDir = new THREE.Color().copy(this.dirLight.color)
        const endColorDir = new THREE.Color().fromArray(colorDir)
        const startColorAmb = new THREE.Color().copy(this.amb.color)
        const endColorAmb = new THREE.Color().fromArray(colorAmb)

        return new Promise(res => {        
            const obj = { v: 0 }
            new Tween(obj)
                .easing(Easing.Exponential.InOut)
                .to({ v: 1 }, time)
                .onUpdate(() => {
                    this.dirLight.color.lerpColors(startColorDir, endColorDir, obj.v)
                    this.amb.color.lerpColors(startColorAmb, endColorAmb, obj.v)
                })
                .onComplete(() => {
                    res(true)
                })
                .start()
        })
    }

    addFog() {
        this.scene.fog = this.fog
    }

    removeFog() {
        this.scene.fog = null
    }

    setFogNearFar(near = .2, far = 100) {
        this.fog.near = near
        this.fog.far = far
    }

    setFogColor(color: number[]) {
        this.fog.color = new THREE.Color().fromArray(color)
    }
    
    setSceneBackground(color: number[]) {
        this.scene.background = new THREE.Color().fromArray(color)
    }

    setSaturation(sat: number) { 
        if (this.saturatePass) {
            this.saturatePass.uniforms['effect'].value = sat
        }
    }
}
