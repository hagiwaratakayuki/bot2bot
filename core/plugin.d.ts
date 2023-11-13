import { state } from "./state_emitter";



export type PlugIns = Partial<{
    [k in state]: Function
}> & {
    in: Function
}

export type StateResponse<T> = {
    state?: state
    subid?: number
    callback?: keyof T //Funcname Use when state is keep. Default is "keep"
}

