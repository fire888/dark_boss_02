import { buildChunkBuffers, type T_ChunkBuffers, type T_ChunkOpts } from "./chunkBuffers"
import type { T_ChunkRequest } from "./levelWorker"

type T_ChunkResponse = { id: number, buffers?: T_ChunkBuffers, error?: string }

// Строит куски уровня в Web Worker; без воркера — в основном потоке той же функцией
export class ChunkBuilder {
    private _worker: Worker | null = null
    private _nextId = 0
    private _requests = new Map<number, { resolve: (buffers: T_ChunkBuffers) => void, reject: (err: Error) => void }>()

    constructor (useWorker: boolean) {
        if (!useWorker || !window.Worker) {
            console.log('[MESSAGE:] LEVEL: NO WORKER')
            return
        }
        try {
            this._worker = new Worker(new URL('./levelWorker.ts', import.meta.url))
            this._worker.onmessage = (event: MessageEvent<T_ChunkResponse>) => this._onResponse(event.data)
            console.log('[MESSAGE:] LEVEL: WORKER')
        } catch (err) {
            console.log('[MESSAGE:] LEVEL: NO WORKER', err)
            this._worker = null
        }
    }

    build (opts: T_ChunkOpts): Promise<T_ChunkBuffers> {
        if (!this._worker) {
            // отложенно, чтобы вызывающий код успел отработать кадр
            return new Promise(resolve => setTimeout(() => resolve(buildChunkBuffers(opts)), 0))
        }
        const id = this._nextId++
        return new Promise((resolve, reject) => {
            this._requests.set(id, { resolve, reject })
            const request: T_ChunkRequest = { id, opts }
            this._worker.postMessage(request)
        })
    }

    private _onResponse ({ id, buffers, error }: T_ChunkResponse) {
        const request = this._requests.get(id)
        if (!request) return
        this._requests.delete(id)
        if (buffers) request.resolve(buffers)
        else request.reject(new Error(error ?? 'chunk build failed'))
    }
}
