import { Root } from '../index'

export const pipelinePlay = async (root: Root) => {
    console.log('[MESSAGE:] START PLAY')

    const { ticker, level } = root

    // догружает куски впереди, удаляет пройденные, возвращает упавшего игрока
    ticker.on(() => level.update())
}
