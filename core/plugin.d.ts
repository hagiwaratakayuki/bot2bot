import { state } from "./state_emitter"
import { Context } from "./context";
import { state } from "./state_emitter";

export type StateResponse = {
    state: state
    callback?: string

}

export type PlugIns = Partial<{
    [k in state]: any
}> & {
    in: any
}

export interface StateResponse {
    state?: state
    subid?: any
    callback?: string //Funcname Use when state is keep. Default is "keep"
}

