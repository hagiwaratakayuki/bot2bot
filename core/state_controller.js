const { History } = require('./history')
const { StateEmitter } = require('./state_emitter')
const { Context } = require('./context');
const { JSONSerializer } = require('./json_serializer');
const merge = require('deepmerge')


/**
 * @typedef {import("./state_emitter").state} state
 * @typedef {import("./plugin").PlugIn} PlugIns
 */
/** 
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
    async start(request) {
        const responses = []
        for (const plugins of this.loader.getStartStep()) {
            const response = await plugins.start(request, this._context);
            if (response) {
                responses.push(response)
            }

        }
        const inResponses = await this._emitter.emit("in", request);
        return responses.concat(inResponses)

    }
    async in(request) {
        let responses = [];
        let now = this.loader.forward();

        this._context.moveLoop()
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
        const response = await this._call(headResponse.callback || "keep", now, request)
        responses.push(response);

        const _responses = await this._checkForwordState(request, response);
        responses = responses.concat(_responses)

        return responses;
    }
    /**
     * 
     * @param {any} request
     * @param {StateResponse} response  
     * @param {PlugIns} now
     *  
     * @returns 
     */
    async _checkForwordState(request, response, now) {
        let responses = [];
        const state = this._emitter.getState();
        if (state === 'out') {
            const _responses = await this._emitter.run(request)
            responses = responses.concat(_responses)

        }
        else if (state === "forwardToSub") {

            const _responses = await this._emitter.run(request, response.subid, response.subkey, response.subLoopInit)
            if (_responses) {
                responses = responses.concat(_responses);
            }



        }

        return responses
    }

    async out(request) {
        let responses = []
        const now = this.loader.getNow();
        if (now.out) {
            const response = await this._call('out', now, request, this._context);
            responses.push(response);
            if (this._emitter.getState() !== 'out') {
                return responses
            }
        }



        while (this.loader.positionState.isSubLoopEnd === true && this._emitter.getState() === 'out' && this.loader.isTopLoop() === false) {
            this.loader.forward()
            const _responses = await this._emitter.emit("returnFromSub", request);
            responses = responses.concat(_responses);
            if (this.isEnd() === true) {
                return responses;
            }
            if (this._emitter.getState() === 'out' && this.loader.isTopLoop() === true) {
                break
            }



        }
        if (this._emitter.getState() === 'out') {
            this._emitter.setState("in")
        }



        return responses;
    }
    async forwardToSub(request, subid, subkey, subLoopInit) {
        const now = this.loader.getNow()
        const responses = []
        let _subLoopInit = subLoopInit || {}
        if (now.forwardToSub) {
            /**
             * @type {StateResponse}
             */
            const _response = await this._call('forwardToSub', now, request, subid, subkey, subLoopInit);
            responses.push(_response)
            subLoopInit = Object.assign({}, _subLoopInit, _response.subLoopInit)

        }

        const subloopStep = this.loader.forwardToSub(subid, subkey)
        this._context.forwardToSub(_subLoopInit)
        const _responses = await this._inProcess(request, subloopStep);
        return responses.concat(_responses);


    }
    /**
     * 
     * @param {any} request 
     * @param {PlugIns} now 
     * @returns 
     */
    async _inProcess(request, now) {
        const response = await this._call("in", now, request)
        const responses = [];

        responses.push(response)
        const _responses = await this._checkForwordState(request, response);


        return responses.concat(_responses)
    }
    async returnFromSub(request) {
        const responses = []
        const now = this.loader.getNow();
        this._context.returnFromSub();
        if (now.returnFromSub) {


            const response = await this._call('returnFromSub', now, request)
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
    /**
     * 
     * @param {state | string} funcname
     * @param {PlugIns} plugins  
     */
    async _call(funcname, plugins, request, ...args) {

        const context = merge({}, this._context.toJSON())
        /**
         * @type {StateResponse}
         */
        const response = await plugins[funcname].call(plugins, request, this._context, this, ...args) || {}
        this._history.push({ request, response, context, loopStepPath: this.loader.getLoopStepPath(), state: this._emitter.getState() })
        this._emitter.setState(response.state || "out");
        return response;

    }
    reset() {
        this._emitter.setState("start")
        this.loader.resetPosition()
    }
    isEnd() {

        return this.loader.positionState.isEnd === true && this._emitter.getState() === "out";
    }
}

module.exports = { StateController };