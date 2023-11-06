const { History } = require('./history')
const { StateEmitter } = require('./state_emitter')



/**
 * @typedef {import("./state_emitter").state} state
 */


const stateKeys = ["start", "in", "keep", "out", "gosub", "outback", "cancelback", "end", "out", "cancel"]




class StateController {
    /**
     *  
     * @param {Function} emitterCls
     * @param {Function} historyClass 
     * 
     */
    constructor(emitterCls, historyClass, datas) {


        for (const stateKey of stateKeys) {
            this[stateKey] = this[stateKey].bind(this)
        }
        /**
         * @type {import("./state_emitter").StateEmitter}
         */
        this._emitter = new emitterCls(this)


        /**
         * @type {import("./history").History}
         */
        this._history = new historyClass();


        this._cancelbacks = []
        this._outbacks = []

        this._func = null



    }
    toJSON() {
        const response = {};
        for (const key in this) {
            const prop = this[key]
            if (typeof prop === "function" || prop.isJSONIgnore || key === "_func") {
                continue;

            }
            if ('toJSON' in prop === true) {
                response[key] = prop.toJSON();
            }
            else {
                response[key] = prop;
            }



        }
        return response;
    }


    /**
     * 
     * @param {Object} jsonData 
     */
    fromJSON(jsonData) {
        for (const [key, data] of Object.entries(jsonData)) {

            if ('fromJSON' in this[key]) {
                this[key].fromJSON(data);
            }
            else {
                this[key] = data
            }


        }


    }
    /**
     * @param {{state?: state}?} datas 
     */
    run(datas) {
        if (datas) {
            this.fromJSON(datas);
        }
        return this._emitter.run()
    }
    destroy() {
        for (const stateKey of stateKeys) {
            this[stateKey] = null
        }
    }
    start() {
        this._func();

    }
    in() {

    }
    keep() {

    }
    out() {

    }
    gosub() {

    }
    outback() {

    }
    cancelback() {

    }
    end() {

    }
    out() {

    }
    cancel() {

    }
}

module.exports = { Executer: StateController };