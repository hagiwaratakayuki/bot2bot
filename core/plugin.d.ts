import { state } from "./state_emitter";



export type PlugIns = Partial<{
    [k in state]: Function
}> & {
    in: Function
}

export type StateResponse = {
    state?: state
    subid?: number
    callback?: string //Funcname Use when state is keep. Default is "keep"
    subLoopInit?: any
}

