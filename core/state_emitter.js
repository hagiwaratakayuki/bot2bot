/**
 * @typedef {"start" | "in" | "keep" | "out" | "forwardToSub" | "returnFromSub" | "cancelback" | "end"| "out" | "cancel"} state
 * @typedef {{[stateKey in state]: (data:any) => void }} stateCallbacks
 */

const { JSONSerializer } = require("./json_serializer");

class StateEmitter extends JSONSerializer {
    /**
     * @param  {stateCallbacks} callbacks
     */
    constructor(callbacks, state) {
        super();
        /**
         * @type {state}
         */
        this._state = "start";

        this._callbacks = callbacks;


    }

    /**
     * 
     * @param {state} state 
     * @param {any[]} datas
     * @returns {Promise<any>} 
     */
    emit(state, ...datas) {
        return this._callbacks[state](...datas);


    }
    run(...datas) {
        return this.emit(this._state, ...datas)
    }
    toJSON() {
        /**
         * @type {Array<keyof StateEmitter>}
         */
        const filters = ['_callbacks'];
        return this._toJSON(filters);
    }

    /**
     * 
     * @param {state?} state 
     */
    setState(state) {
        this._state = state || "out";
    }
    getState() {
        return this._state;
    }

}

module.exports = { StateEmitter }