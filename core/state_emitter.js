/**
 * @typedef {"start" | "in" | "keep" | "out" | "gosub" | "outback" | "cancelback" | "end"| "out" | "cancel"} state
 * @typedef {{[stateKey in state]: (data:any) => void }} stateCallbacks
 */

class StateEmitter {
    /**
     * @param  {stateCallbacks} callbacks
     */
    constructor(callbacks, state) {
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
     */
    emit(state, data) {
        return this._callbacks[state](data);


    }
    run() {
        return this.emit(this._state)
    }
    toJSON() {
        return this._state;
    }
    /**
     * 
     * @param {state} jsonData 
     */
    fromJSON(jsonData) {
        this._state = jsonData
    }
}

module.exports = { StateEmitter }