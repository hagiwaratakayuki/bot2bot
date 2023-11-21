import { state } from "./state_emitter";


export type PlugIn = Partial<{
    [k in state]: Function
}> & {
    in: Function
}


export type Builder = (options: any, language: string, i18n?: any) => PlugIn

export type StateResponse = {
    state?: state
    subid?: number
    callback?: string //Funcname Use when state is keep. Default is "keep"
    subLoopInit?: any
}

