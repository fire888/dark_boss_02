import { buildChunkBuffers, chunkTransferList, type T_ChunkOpts } from "./chunkBuffers"

// Воркер кусков уровня: опции complex02 → буферы куска. Запросы идут по очереди, ответ — с тем же id

export type T_ChunkRequest = { id: number, opts: T_ChunkOpts }

self.onmessage = (event: MessageEvent<T_ChunkRequest>) => {
    const { id, opts } = event.data
    try {
        const buffers = buildChunkBuffers(opts)
        self.postMessage({ id, buffers }, { transfer: chunkTransferList(buffers) })
    } catch (err) {
        self.postMessage({ id, error: (err as Error).message ?? String(err) })
    }
}
