import { Core } from "./types";

export class Debug {

    init(root: Core) {
        // console camera position
        document.body.addEventListener('keydown', (event: KeyboardEvent) => {   
            if (event.code === 'KeyP') {
                const { studio } = root
                console.log(
                    JSON.stringify(
                        [ ...studio.camera.position.toArray() ]
                    )
                )
            }
        })
    }
}