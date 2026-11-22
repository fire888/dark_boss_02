import * as THREE from "three"
import { Root } from "../index"
import { LevelPlan } from "./LevelPlan"
import { ChunkBuilder } from "./ChunkBuilder"
import type { T_ChunkBuffers } from "./chunkBuffers"
import { IS_USE_WORKER, CHUNKS_BEHIND, CHUNKS_AHEAD, FALL_DEPTH } from "../constants/CONSTANTS"

type T_Chunk = {
    mesh: THREE.Mesh,
    collisionName: string,
}

// Бесконечный уровень: куски LevelPlan строятся в воркере по мере того, как игрок идёт вперёд.
// Держатся куски от current − CHUNKS_BEHIND до current + CHUNKS_AHEAD, где current — кусок, к середине одной
// из комнат которого игрок ближе всего; остальные удаляются вместе с телами физики.
export class InfiniteLevel {
    current = 0

    private _root: Root
    private _plan: LevelPlan
    private _builder: ChunkBuilder
    private _chunks = new Map<number, T_Chunk>()
    private _pending = new Set<number>()
    // имя тела уникально: Phisics удаляет тела по имени отложенно, в update
    private _collisionCount = 0

    init (root: Root) {
        this._root = root
        this._plan = new LevelPlan()
        this._builder = new ChunkBuilder(IS_USE_WORKER)
    }

    // строит кусок старта и ставит туда игрока; остальные куски — в фоне
    async start () {
        await this._ensure(0)
        this.respawn()
        this._schedule()
    }

    respawn () {
        const [x, y, z] = this._plan.spawnAt(this.current)
        this._root.phisics.setPlayerPosition(x, y, z)
        this._root.phisics.playerBody.velocity.set(0, 0, 0)
    }

    update () {
        const { position } = this._root.phisics.playerBody

        // текущий кусок — тот из соседних, у которого ближайшая в плане комната
        const distanceTo = (index: number) => Math.min(...this._plan.roomCentersAt(index)
            .map(([x, z]) => Math.hypot(position.x - x, position.z - z)))
        let nearest = this.current
        for (const index of [this.current - 1, this.current + 1]) {
            if (index >= 0 && distanceTo(index) < distanceTo(nearest)) nearest = index
        }
        if (nearest !== this.current) {
            this.current = nearest
            console.log('[MESSAGE:] LEVEL: CHUNK CURRENT', this.current)
            this._schedule()
        }

        if (position.y < this._plan.lowestFloorAt(this.current) - FALL_DEPTH) this.respawn()
    }

    private _schedule () {
        const first = Math.max(0, this.current - CHUNKS_BEHIND)
        const last = this.current + CHUNKS_AHEAD
        for (const index of [...this._chunks.keys()]) {
            if (index < first || index > last) this._remove(index)
        }
        // ближние — раньше: воркер отвечает по очереди
        for (let index = this.current; index <= last; ++index) this._ensure(index)
        for (let index = this.current - 1; index >= first; --index) this._ensure(index)
    }

    private async _ensure (index: number) {
        if (this._chunks.has(index) || this._pending.has(index)) return
        this._pending.add(index)
        const { opts, origin } = this._plan.chunkAt(index)
        const date = Date.now()
        try {
            const buffers = await this._builder.build(opts)
            // пока строился, игрок ушёл — кусок уже не нужен
            const isNeeded = index >= this.current - CHUNKS_BEHIND && index <= this.current + CHUNKS_AHEAD
            if (isNeeded) this._add(index, buffers, new THREE.Vector3(...origin))
            console.log('[MESSAGE:] LEVEL: CHUNK', index, ((Date.now() - date) / 1000).toFixed(2), 'sec', isNeeded ? '' : '(skip)')
        } catch (err) {
            console.error('[MESSAGE:] LEVEL: CHUNK', index, err)
        } finally {
            this._pending.delete(index)
        }
    }

    private _add (index: number, buffers: T_ChunkBuffers, origin: THREE.Vector3) {
        const { studio, phisics, materials } = this._root

        const geometry = new THREE.BufferGeometry()
        geometry.setIndex(new THREE.BufferAttribute(buffers.index, 1))
        geometry.setAttribute('position', new THREE.BufferAttribute(buffers.position, 3))
        geometry.setAttribute('normal', new THREE.BufferAttribute(buffers.normal, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(buffers.color, 3))
        geometry.setAttribute('uv', new THREE.BufferAttribute(buffers.uv, 2))
        geometry.setAttribute('uv2', new THREE.BufferAttribute(buffers.uv2, 2))
        const mesh = new THREE.Mesh(geometry, materials.level)
        mesh.position.copy(origin)
        studio.add(mesh)

        // тело физики из vCollide; Trimesh копирует вершины, меш в сцену не идёт
        const collisionGeometry = new THREE.BufferGeometry()
        collisionGeometry.setAttribute('position', new THREE.BufferAttribute(buffers.collide, 3))
        const collisionMesh = new THREE.Mesh(collisionGeometry)
        collisionMesh.name = `level|${index}|${this._collisionCount++}`
        collisionMesh.position.copy(origin)
        phisics.addMeshToCollision(collisionMesh)
        collisionGeometry.dispose()

        this._chunks.set(index, { mesh, collisionName: collisionMesh.name })
    }

    private _remove (index: number) {
        const chunk = this._chunks.get(index)
        if (!chunk) return
        this._root.studio.remove(chunk.mesh)
        chunk.mesh.geometry.dispose()
        this._root.phisics.removeMeshFromCollision(chunk.collisionName)
        this._chunks.delete(index)
    }
}
