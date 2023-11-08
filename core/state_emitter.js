/**
 * @typedef {"start" | "in" | "keep" | "out" | "forwardToSub" | "outback" | "cancelback" | "end"| "out" | "cancel"} state
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
     * @param {any} data
     * @returns {Promise<any>} 
     */
    emit(state, data) {
        return this._callbacks[state](data);


    }
    run(data) {
        return this.emit(this._state, data)
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