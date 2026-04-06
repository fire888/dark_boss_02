import {
	Controls,
	//Euler,
	// Vector3,
	// Object3D
} from 'three';
import * as THREE from 'three'; 

const _euler = new THREE.Euler( 0, 0, 0, 'YXZ' );
const _vector = new THREE.Vector3();
const _objecProxi = new THREE.Object3D() 
// const transformMatrix = new THREE.Matrix4();

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

const _PI_2 = Math.PI / 2;

// top matrix
//const m4 = new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0))
// z matrix
//const m4 = new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))
// custom
const m4 = new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(.5, .5, 0))

class PointerLockControls extends Controls {

	constructor( camera, domElement = null ) {

		super( camera, domElement );

		//this.vecTop = new Vector3(0, 1, 0)

		this.isLocked = false;

		// Set to constrain the pitch of the camera
		// Range is 0 to Math.PI radians
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

		this.pointerSpeed = 1.0;

		// event listeners
		this._onPointerlockChange = onPointerlockChange.bind( this );
		this._onPointerlockError = onPointerlockError.bind( this );

		if ( this.domElement !== null ) {

			this.connect();

		}

	}

	connect() {

		this.domElement.ownerDocument.addEventListener( 'mousemove', this._onMouseMove.bind( this ) );
		this.domElement.ownerDocument.addEventListener( 'pointerlockchange', this._onPointerlockChange );
		this.domElement.ownerDocument.addEventListener( 'pointerlockerror', this._onPointerlockError );

	}

	disconnect() {

		this.domElement.ownerDocument.removeEventListener( 'mousemove', this._onMouseMove.bind(this) );
		this.domElement.ownerDocument.removeEventListener( 'pointerlockchange', this._onPointerlockChange );
		this.domElement.ownerDocument.removeEventListener( 'pointerlockerror', this._onPointerlockError );

	}

	dispose() {

		this.disconnect();

	}

	getObject() {

		console.warn( 'THREE.PointerLockControls: getObject() has been deprecated. Use controls.object instead.' ); // @deprecated r169

		return this.object;

	}

	getDirection( v ) {

		return v.set( 0, 0, - 1 ).applyQuaternion( this.object.quaternion );

	}

	moveForward( distance ) {

		if ( this.enabled === false ) return;

		// move forward parallel to the xz-plane
		// assumes camera.up is y-up

		const camera = this.object;

		_vector.setFromMatrixColumn( _objecProxi.matrix, 0 );

		_vector.crossVectors( _objecProxi.up, _vector );

		_objecProxi.position.addScaledVector( _vector, - distance )
		camera.matrix.copy(_objecProxi.matrix)

		//camera.position.addScaledVector( _vector, distance );

	}

	moveRight( /*distance*/ ) {

		if ( this.enabled === false ) return;

		//const camera = this.object;


		//_vector.setFromMatrixColumn( camera.matrix, 0 );

		//camera.position.addScaledVector( _vector, distance );

	}

	setTopAndFrontVector(vt, vf) {
		m4.lookAt(new THREE.Vector3(), vf, vt)
	}

	_onMouseMove( event ) {

		if ( this.enabled === false || this.isLocked === false ) return;

		const camera = this.object;
		
		
		_euler.setFromQuaternion( _objecProxi.quaternion );

		_euler.y -= event.movementX * 0.002 * this.pointerSpeed;
		_euler.x -= event.movementY * 0.002 * this.pointerSpeed;

		_euler.x = Math.max( _PI_2 - this.maxPolarAngle, Math.min( _PI_2 - this.minPolarAngle, _euler.x ) );

		_objecProxi.quaternion.setFromEuler( _euler );
		
		m4.decompose(new THREE.Vector3(), camera.quaternion, new THREE.Vector3())
		camera.quaternion.multiply(_objecProxi.quaternion)
		
		this.dispatchEvent( _changeEvent );

	}

	lock() {

		this.domElement.requestPointerLock();

	}

	unlock() {

		this.domElement.ownerDocument.exitPointerLock();

	}

}

// event listeners
function onPointerlockChange() {

	if ( this.domElement.ownerDocument.pointerLockElement === this.domElement ) {

		this.dispatchEvent( _lockEvent );

		this.isLocked = true;

	} else {

		this.dispatchEvent( _unlockEvent );

		this.isLocked = false;

	}

}

function onPointerlockError() {

	console.error( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );

}

export { PointerLockControls };
