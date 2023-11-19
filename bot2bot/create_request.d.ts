import { Saver } from "../core/looploader/save_and_load"

export type CreateRequest<T = any> = {
    input: T
    saver: Saver
}