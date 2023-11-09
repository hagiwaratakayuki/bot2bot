const { History } = require('./history')
const { StateEmitter } = require('./state_emitter')
const { Context } = require('./context');
const { JSONSerializer } = require('./json_serializer');



/**
 * @typedef {import("./state_emitter").state} state
 *
 * @type {Array<state>}
 */

const stateKeys = ["start", "in", "keep", "out", "forwardToSub", "returnFromSub", "cancelback", "end", "out", "cancel"]


/**
 *  @typedef {import("./plugin").StateResponse} StateResponse
 */

class StateController extends JSONSerializer {
    /**
     * @typedef {import('./looploader/base_type').BasicLoader} BasicLoader
     * @param {BasicLoader} loader 
     * @param {Function} contextClass  
     * @param {Function} emitterClass
     * @param {Function} historyClass 
     * 
     */
    constructor(loader, contextClass = Context, emitterClass = StateEmitter, historyClass = History) {
        super();
        /**
         * @type {BasicLoader}
         */
        this.loader = loader;

        for (const stateKey of stateKeys) {
            this[stateKey] = this[stateKey].bind(this)
        }
        /**
         * @type {import("./state_emitter").StateEmitter}
         */
        this._emitter = new emitterClass(this)


        /**
         * @type {import("./history").History}
         */
        this._history = new historyClass();




        /**
         * @type {Context}
         */
        this._context = new contextClass(this._history)




    }

    toJSON() {
        /**
         * @type {Array<keyof StateController>}
         */
        const filters = ['_plugin'];
        return this._toJSON(filters)
    }



    /**
     * @param {any} request
     * @param {any?} resumeData
     */
    run(request, resumeData) {
        if (resumeData) {
            this.fromJSON(resumeData);
        }

        return this._emitter.run(request)
    }
    destroy() {
        for (const stateKey of stateKeys) {
            this[stateKey] = null
        }
    }
    start(request) {
        return this._emitter.emit("in", request);

    }
    async in(request) {
        let responses = [];
        let now = this.loader.forward();
        while (this.loader.positionState.isSubLoopOut === true) {

            const _responses = await this._emitter.emit("returnFromSub", request);
            responses = responses.concat(_responses);
            if (this._emitter.getState() === "out") {
                const _responses = await this._checkState(request, _response, now);
                responses = responses.concat(_responses);
                now = this.loader.forward();
            }
            else {
                const _responses = await this._emitter.run(request)
                responses.concat(_responses);
                return responses;
            }


        }
        const _responses = await this._inProcess(request, now);
        return responses.concat(_responses);



    }
    async keep(request) {
        let responses = []
        const now = this.loader.getNow();
        /**
         * @type {{response:StateResponse}}
         */
        const { response: headResponse } = this._history.getHead()

        /**
         * @type {StateResponse}
         */
        const response = await now[headResponse.callback || "keep"](request, this._context);
        this._history.push({ request, response, loopStepPath: this.loader.getLoopStepPath() })
        this._emitter.setState(response.state);
        responses.push(response);

        const _responses = await this._checkState(request, response, now);
        responses = responses.concat(_responses)

        return responses;
    }
    /**
     * 
     * @param {any} request
     * @param {StateResponse} response  
     * @param {import('./plugin').PlugIns} now
     *  
     * @returns 
     */
    async _checkState(request, response, now) {
        let responses = [];
        const state = this._emitter.getState();
        if (state === 'out') {
            if (now.out) {
                const _responses = await this._emitter.run(request);
                if (_responses) {
                    responses = responses.concat(_responses);
                }

            }
            this._emitter.setState("in");


        }
        if (state === "forwardToSub") {

            const _responses = this._emitter.run(request, response.subid)
            if (_responses) {
                responses = responses.concat(_responses);
            }



        }

        return responses
    }
    async out(request) {
        const responses = []
        const now = this.loader.getNow();
        const response = await now.out(request, this._context);
        responses.push(response);
        return responses;
    }
    async forwardToSub(request, subid) {
        const now = this.loader.getNow()
        const responses = []
        if (now.forwardToSub) {
            const _response = await now.forwardToSub(request, subid);
            responses.push(_response)

        }
        const subloopStep = this.loader.forwardToSub(subid)
        this._context.loopIn()
        const _responses = await this._inProcess(request, subloopStep);
        return responses.concat(_responses);


    }
    /**
     * 
     * @param {any} request 
     * @param {import('./plugin').PlugIns} now 
     * @returns 
     */
    async _inProcess(request, now) {
        const response = now.in(request, this._context)
        const responses = [];
        this._history.push({ request, response, loopStepPath: this.loader.getLoopStepPath() })
        this._emitter.setState(response.state);
        responses.push(response)
        const _responses = await this._checkState(request, response, now);


        return responses.concat(_responses)
    }
    async returnFromSub(request) {
        const responses = []
        const now = this.loader.getNow();
        this._context.loopOut();
        if (now.returnFromSub) {
            const response = await now.returnFromSub(request);
            this._history.push({ request, response, loopStepPath: this.loader.getLoopStepPath() })
            this._emitter.setState(response.state);
            responses.push(response);
        }
        return responses;


    }
    async cancelback() {

    }
    async end() {

    }
    async cancel() {

    }
}

module.exports = { StateController };