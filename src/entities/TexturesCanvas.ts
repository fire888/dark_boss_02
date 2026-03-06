import * as THREE from 'three' 
        
const S = 256

const show = (iron00Map: HTMLCanvasElement) => {
    document.body.appendChild(iron00Map)
    iron00Map.style.position = 'absolute'
    iron00Map.style.left = '0'
    iron00Map.style.top = '0'
    iron00Map.style.zIndex = '100'
    iron00Map.style.border = '1px solid red'
}

const ROAD_COLOR = "#234e6c"
const ROAD_COLOR_L = "#4db5ff"

export class TexturesCanvas {
    iron00Map: THREE.CanvasTexture
    env: THREE.CubeTexture

    constructor() {}

    async init() {
        { // 1
            const texEmpty = createEmpty()
            const tex1 = create1()
            const texSide = createSide()
            const tex2 = createTex2()
            const tex3 = createTex3() 
            const tex4 = createTex4()
            const texHighTech = createTexHighTech()
            const texTree = createTree()
           // show(texTree)

            ///////////////////////////////

            const canMain = document.createElement('canvas')
            canMain.width = S * 4
            canMain.height = S * 4

            const ctx = canMain.getContext('2d')

            ctx.drawImage(texEmpty, 0, 0)
            ctx.drawImage(tex1, S, 0)
            ctx.drawImage(texSide, S * 2, 0)
            ctx.drawImage(tex2, S * 3, 0)
            ctx.drawImage(tex3, 0, S)
            ctx.drawImage(tex4, S, S)
            ctx.drawImage(texHighTech, S * 2, S)
            ctx.drawImage(texTree, S * 3, S)

            // show(canMain)

            this.iron00Map = new THREE.CanvasTexture(canMain) 
            this.iron00Map.minFilter = THREE.LinearMipmapLinearFilter
            //NearestFilter | NearestMipmapNearestFilter | NearestMipmapLinearFilter | LinearFilter | LinearMipmapNearestFilter | LinearMipmapLinearFilter
        }

        {
            const canEnv = document.createElement('canvas')
            canEnv.width = S
            canEnv.height = S

            const ctx = canEnv.getContext('2d')
            ctx.fillStyle = "#6e7d80"
            ctx.fillRect(0, 0, S, S)

            const offset = .04 * S
            const s = S - 2 * offset
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(offset, offset, s, s)

            const offset2 = .15 * S
            const s2 = S - 2 * offset2
            ctx.fillStyle = "#6b5e5e"
            ctx.fillRect(offset2, offset2, s2, s2)

            ctx.fillStyle = "#ffffff"
            ctx.arc(S * .5, S * .5, S * .3, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = "#54574f"
            for (let i = 0; i < 10; i++) {
                ctx.fillRect(offset + i * (S - 2 * offset) / 10, offset + .01 * S, S * .03, S * .9)
                ctx.fillRect(offset + i * (S - 2 * offset) / 10, S - (.15 * S), S * .03, S * .09)

                ctx.fillRect(offset, offset + i * (S - 2 * offset) / 10, S * .09, S * .03)
                ctx.fillRect(S * .9 , offset + i * (S - 2 * offset) / 10, S * .09, S * .03)
            }

            const f = new CanvasFastBlur(2)
            f.initCanvas(canEnv)
            f.gBlur()

            //show(canEnv)

            const dataURL = canEnv.toDataURL()
            const img = document.createElement('img')
            img.src = dataURL

            const loadCubeTexture = (src: string[]) => {
                return new Promise(res => {
                    new THREE.CubeTextureLoader().load(src, cubeTexture => {
                        res(cubeTexture)
                    })
                })
            }

            this.env = await loadCubeTexture([
                dataURL, dataURL, dataURL, dataURL, dataURL, dataURL
            ]) as THREE.CubeTexture
        }
    }
}

const createEmpty = () => {
    const iron00Map = document.createElement('canvas')
    iron00Map.width = S
    iron00Map.height = S

    const ctx = iron00Map.getContext('2d')
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, S, S)

    const offset = .02 * S
    const s = S - 2 * offset
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(offset, offset, s, s)

    return iron00Map
}

const create1 = () => { // треугольник светлый в центре, черные треугольники по бокам
    const iron00Map = document.createElement('canvas')
    iron00Map.width = S
    iron00Map.height = S

    const ctx = iron00Map.getContext('2d')

    const offset = .01 * S
    const s = S - 2 * offset
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(offset, offset, s, s)

    ctx.beginPath()
    ctx.strokeStyle = "#000000"
    ctx.fillStyle = "#4b4b4b"
    ctx.lineWidth = S * .05
    ctx.moveTo(S * 0.2, S * 0.2)
    ctx.lineTo(S * 0.5, S * 0.8)
    ctx.lineTo(S * 0.8, S * 0.2)
    ctx.closePath()
    ctx.stroke()

    ctx.beginPath()
    ctx.fillStyle = ROAD_COLOR
    ctx.moveTo(S * 0.1, S * 0.3)
    ctx.lineTo(S * 0.1, S * 0.9)
    ctx.lineTo(S * 0.4, S * 0.9)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.fillStyle = ROAD_COLOR
    ctx.moveTo(S * 0.9, S * 0.3)
    ctx.lineTo(S * 0.9, S * 0.9)
    ctx.lineTo(S * 0.6, S * 0.9)
    ctx.closePath()
    ctx.fill()

    return iron00Map
}

const createSide = () => { // решетка
    const iron00Map = document.createElement('canvas')
    iron00Map.width = S
    iron00Map.height = S

    const ctx = iron00Map.getContext('2d')
    ctx.fillStyle = "#ffffff"

    const offset1 = .01 * S
    const s = S - 2 * offset1
    ctx.fillRect(offset1, offset1, s, s)

    const offset = .1 * S
    const SIZE = S * .03
    const n = 10
    ctx.fillStyle = '#000000'
    const step = (S - 2 * offset) / (n - 1)
    for (let i = 0; i < n; i++) { 
        for (let j = 0; j < n; j++) {
            ctx.fillRect(
                offset + i * step - SIZE * .5,
                offset + j * step - SIZE * .5,
                SIZE, SIZE
            )
        }
    }

    return iron00Map
}

const createTex2 = () => { // решетка паралельная
    const iron00Map = document.createElement('canvas')
    iron00Map.width = S
    iron00Map.height = S

    const ctx = iron00Map.getContext('2d')
    ctx.fillStyle = "#484848"
    const offset1 = S * .01
    const s = S - 2 * offset1
    ctx.fillRect(offset1, offset1, s, s)

    ctx.fillStyle = "#000000"
    const offset2 = S * .03
    const s2 = S - 2 * offset2
    ctx.fillRect(offset2, offset2, s2, s2)

    const SIZE = S * .03
    const n = 10
    ctx.fillStyle = '#414141'
    const step = (S - 2 * offset2) / (n - 1)
    for (let i = 1; i < (n - 1); i++) { 
        ctx.fillRect(
            offset2 + i * step - SIZE * .5,
            offset2 + SIZE,
            SIZE,
            S - (offset2 * 2) - SIZE - SIZE
        )
    }

    return iron00Map
}

const createTex3 = () => { // решетка крестик
    const iron00Map = document.createElement('canvas')
    iron00Map.width = S
    iron00Map.height = S
    const ctx = iron00Map.getContext('2d')
    
    ctx.fillStyle = ROAD_COLOR
    const offset2 = 0
    const s2 = S - 2 * offset2
    ctx.fillRect(offset2, offset2, s2, s2)
    
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = S * .1
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(S, S)
    ctx.moveTo(0, S)
    ctx.lineTo(S, 0)
    ctx.stroke()

    const bolt = (x: number, y: number, r: number) => {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = '#333333'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, y, r * .93, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
    }

    bolt(0, 0, S * .15)
    bolt(S, 0, S * .15)
    bolt(S, S, S * .15)
    bolt(0, S, S * .15)

    return iron00Map
}

const createTex4 = () => { // решетка крестик + кружок
    const iron00Map = document.createElement('canvas')
    iron00Map.width = S
    iron00Map.height = S
    const ctx = iron00Map.getContext('2d')
    
    ctx.fillStyle = ROAD_COLOR
    const offset2 = 0
    const s2 = S - 2 * offset2
    ctx.fillRect(offset2, offset2, s2, s2)
    
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = S * .1
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(S, S)
    ctx.moveTo(0, S)
    ctx.lineTo(S, 0)
    ctx.stroke()

    const bolt = (x: number, y: number, r: number, hole: boolean) => {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = '#333333'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, y, r - 3, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        if (hole) {
            ctx.beginPath()
            ctx.arc(x, y, r * .45, 0, Math.PI * 2)
            ctx.fillStyle = '#610c4d'
            ctx.fill()
        }
    }

    bolt(0, 0, S * .15, false)
    bolt(S, 0, S * .15, false)
    bolt(S, S, S * .15, false)
    bolt(0, S, S * .15, false)
    bolt(S * .5, S * .5, S * .45, true)

    return iron00Map
}

const createTexHighTech = () => { // высокотехнологичная решетка
    const iron00Map = document.createElement('canvas')
    iron00Map.width = S
    iron00Map.height = S
    const ctx = iron00Map.getContext('2d')
    
    ctx.fillStyle = "#ffffff"
    const offset2 = S * .01
    const s2 = S - 2 * offset2
    ctx.fillRect(offset2, offset2, s2, s2)
    
    ///////////////////////////

    ctx.strokeStyle = "#000000" 
    ctx.lineWidth = S * .005  
    
    ctx.beginPath()
    ctx.moveTo(0, S * .7)
    ctx.lineTo(S * .3, S * .7)
    ctx.lineTo(S * .438, S * 1)

    ctx.moveTo(S * .438, 0)
    ctx.lineTo(S * .73, S * .7)
    ctx.lineTo(S * 1.3, S * .7)

    ctx.stroke()

    return iron00Map
}

const createTree = () => {
    const iron00Map = document.createElement('canvas')
    iron00Map.width = S
    iron00Map.height = S
    const ctx = iron00Map.getContext('2d')
    
    ctx.fillStyle = ROAD_COLOR_L
    const offset2 = S * 0
    const s2 = S - 2 * offset2
    ctx.fillRect(offset2, offset2, s2, s2)
    
    ///////////////////////////

    ctx.fillStyle = "#000000"
    const N = 15
    for (let i = 0; i < N; ++i) {
        for (let j = 0; j < N; ++ j) {
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(S / N * i + 3, S / N * j + 3, S / 50, S / 50)
            ctx.fillStyle = "#000000"
            ctx.fillRect(S / N * i, S / N * j, S / 50, S / 50)
        }
    }

    ctx.strokeStyle = "#ffffff" 
    ctx.lineWidth = S * .05  
    
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(S * .5, S)
    ctx.lineTo(S, S * 0.025)
    ctx.lineTo(0, S * 0.025)

    ctx.stroke()

    return iron00Map
}


class CanvasFastBlur {
    blurRadius: number
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    canvas_off: HTMLCanvasElement
    ctx_off: CanvasRenderingContext2D
	constructor(radius: number = 6){
		this.blurRadius = radius;
		
	}
	initCanvas(canvas: HTMLCanvasElement){
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		let w = canvas.width;
		let h = canvas.height;
		this.canvas_off = document.createElement("canvas");
		this.ctx_off = this.canvas_off.getContext("2d");
		this.canvas_off.width = w;
		this.canvas_off.height = h;
		this.ctx_off.drawImage(canvas, 0, 0);
	}
	recoverCanvas(){
		let w = this.canvas_off.width;
		let h = this.canvas_off.height;
		this.canvas.width = w;
		this.canvas.height = h;
		this.ctx.drawImage(this.canvas_off,0,0);
	}
	gBlur() {
		let start = +new Date();
		const blur = this.blurRadius;
		let canvas = this.canvas;
		let ctx = this.ctx;
		
		let sum = 0;
		let delta = 5;
		let alpha_left = 1 / (2 * Math.PI * delta * delta);
		let step = blur < 3 ? 1 : 2;
		for (let y = -blur; y <= blur; y += step) {
			for (let x = -blur; x <= blur; x += step) {
				let weight = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta));
				sum += weight;
			}
		}
		let count = 0;
		for (let y = -blur; y <= blur; y += step) {
			for (let x = -blur; x <= blur; x += step) {
				count++;
				ctx.globalAlpha = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta)) / sum * blur;
				ctx.drawImage(canvas,x,y);
			}
		}
		ctx.globalAlpha = 1;
		console.log("time: "+(+new Date() - start))
	}
	mBlur(distance: number){
		distance = distance<0?0:distance;
		console.log(distance);
		let w = this.canvas.width;
		let h = this.canvas.height;
		this.canvas.width = w;
		this.canvas.height = h;
		let ctx = this.ctx;
		ctx.clearRect(0,0,w,h);
		let canvas_off = this.canvas_off;
		
		for(let n=0;n<5;n+=0.1){
			ctx.globalAlpha = 1/(2*n+1);
			let scale = distance/5*n;
			ctx.transform(1+scale,0,0,1+scale,0,0);
			ctx.drawImage(canvas_off, 0, 0);
		}
		ctx.globalAlpha = 1;
		if(distance<0.01){
			window.requestAnimationFrame(()=>{
				this.mBlur(distance+0.0005);
			});
		}
	}
	
}






// function drawToCanvas(imgData) {
// 	var context = canvas_blur.getContext('2d');
// 	var img = new Image();
// 	img.src = imgData;
// 	img.onload = function() {
// 		context.clearRect(0, 0, canvas_blur.width, canvas_blur.height);
// 		var img_w = img.width > canvas_blur.width ? canvas_blur.width : img.width;
// 		var img_h = img.height > canvas_blur.height ? canvas_blur.height : img.height;
// 		var scale = (img_w / img.width < img_h / img.height) ? (img_w / img.width) : (img_h / img.height);
// 		img_w = img.width * scale;
// 		img_h = img.height * scale;
// 		canvas_blur.style.width = img_w + "px";
// 		canvas_blur.style.height = img_h + "px";
// 		canvas_blur.width = img_w;
// 		canvas_blur.height = img_h;
// 		context.drawImage(img, 0, 0, img.width, img.height, (canvas_blur.width - img_w) / 2, (canvas_blur.height - img_h) / 2, img_w, img_h);
// 		canvasBlur.initCanvas(canvas_blur);
// 	}
// }
/**********************************************************************************/
