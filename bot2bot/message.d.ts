import { Saver } from "../core/looploader/save_and_load"

export type CreaterRequest<T = any> = {
    input: T
    saver: Saver
}