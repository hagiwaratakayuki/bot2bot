import { state } from "./state_emitter";



export type PlugIns = Partial<{
    [k in state]: any
}> & {
    in: any
}

export type StateResponse = {
    state?: state
    subid?: number
    callback?: string //Funcname Use when state is keep. Default is "keep"
}

