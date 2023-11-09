import { Builder, PlugIns } from "../plugin";



export type i18nFunc = (language: string, options: any) => string

export type DocumentLoader {
    title: i18nFunc
    description: i18nFunc

}

export type Document = Partial<{
    [k in keyof DocumentLoader]: string
}>

export type BulderConfig = {
    builder: Builder
    options?: Object // Custamized default option
    mergeFunction?: Function // option merge function default is Object.assign
    documentLoader: DocumentLoader

}

export type BuilderConfigMap = { [name: string]: BulderConfig }
export type SubLoopType = "selection" | "loop"

export type LoopStep = {
    builderID: string
    options: Object
    subLoopType?: SubLoopType


}

export type PositionState {
    isEnd: boolean
    isSubLoopOut: boolean
}
export type LoopStepPath = number[]



export interface BasicLoader {


    positionState: PositionState
    getLoopStepPath(): LoopStepPath
    setLoopStepPath(LoopStepPath: LoopStepPath): void
    forward(): PlugIns
    back(): PlugIns
    backAll(): PlugIns

    forwardToSub(subid?: any): PlugIns
    getNow(): PlugIns
    buildStep(loopStep: LoopStep): PlugIns




}
