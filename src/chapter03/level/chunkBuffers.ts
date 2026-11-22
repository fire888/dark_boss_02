import { level00 } from "geometry/09_level00/level00"

// Кусок уровня: level00 → типизированные массивы, готовые к BufferAttribute, с нормалями.
// Чистая функция — исполняется в Web Worker (levelWorker.ts), а без воркера — в основном потоке.

export type T_ChunkOpts = NonNullable<Parameters<typeof level00>[0]>

export type T_ChunkBuffers = {
    index: Uint32Array,
    position: Float32Array,
    normal: Float32Array,
    color: Float32Array,
    uv: Float32Array,
    uv2: Float32Array,
    collide: Float32Array, // vCollide — triangle soup без индекса
}

export const buildChunkBuffers = (opts: T_ChunkOpts): T_ChunkBuffers => {
    const geom = level00(opts)
    const position = new Float32Array(geom.v)
    const index = new Uint32Array(geom.index)
    return {
        index,
        position,
        normal: computeNormals(position, index),
        color: new Float32Array(geom.c),
        uv: new Float32Array(geom.uv),
        uv2: new Float32Array(geom.uv2),
        collide: new Float32Array(geom.vCollide),
    }
}

// все буферы куска — чтобы передать их из воркера без копирования
export const chunkTransferList = (buffers: T_ChunkBuffers): ArrayBuffer[] => [
    buffers.index.buffer, buffers.position.buffer, buffers.normal.buffer, buffers.color.buffer,
    buffers.uv.buffer, buffers.uv2.buffer, buffers.collide.buffer,
] as ArrayBuffer[]

// нормали вершин индексной геометрии — сумма нормалей треугольников вершины, как computeVertexNormals у three;
// вершины между гранями не сварены, поэтому выходит нормаль грани
const computeNormals = (position: Float32Array, index: Uint32Array): Float32Array => {
    const normal = new Float32Array(position.length)
    for (let i = 0; i < index.length; i += 3) {
        const a = index[i] * 3, b = index[i + 1] * 3, c = index[i + 2] * 3
        const abX = position[b] - position[a], abY = position[b + 1] - position[a + 1], abZ = position[b + 2] - position[a + 2]
        const acX = position[c] - position[a], acY = position[c + 1] - position[a + 1], acZ = position[c + 2] - position[a + 2]
        const nX = abY * acZ - abZ * acY
        const nY = abZ * acX - abX * acZ
        const nZ = abX * acY - abY * acX
        for (const vertex of [a, b, c]) {
            normal[vertex] += nX
            normal[vertex + 1] += nY
            normal[vertex + 2] += nZ
        }
    }
    for (let i = 0; i < normal.length; i += 3) {
        const length = Math.hypot(normal[i], normal[i + 1], normal[i + 2]) || 1
        normal[i] /= length
        normal[i + 1] /= length
        normal[i + 2] /= length
    }
    return normal
}
