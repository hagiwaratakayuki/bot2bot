export type PlugIn = {
    enter: Function
    out?: Function
    [key: string]: Function
}

export type Builder = (options?: any) => PlugIn