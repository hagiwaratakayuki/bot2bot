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

        const _responses = await this._checkState(request, response);
        responses = responses.concat(_responses)

        return responses;
    }
    /**
     * 
     * @param {any} request
     * @param {StateResponse} response  
     
     *  
     * @returns 
     */
    async _checkState(request, response) {
        let responses = [];
        const state = this._emitter.getState();
        if (state !== 'keep') {
            const _responses = await this._emitter.run(request, response)
            responses = responses.concat(_responses)

        }
        return responses
    }

    async out(request, response) {
        let responses = []
        const now = this.loader.getNow();
        if (now.out) {
            const response = await this._call('out', now, request);
            responses.push(response);
            if (this._emitter.getState() !== 'out') {
                return responses
            }
        }



        while (this.loader.positionState.isSubLoopEnd === true && this._emitter.getState() === 'out' && this.loader.isTopLoop() === false) {
            this.loader.forward()
            let _responses = await this._emitter.emit("returnFromSub", request);
            responses = responses.concat(_responses);
            let _state = this._emitter.getState();
            if (_state !== 'out') {
                if (_state === 'keep') {
                    return responses
                }
                const _responses = await this._emitter.run(request, response)
                responses = responses.concat(_responses)
            }
            const _now = this.loader.getNow();
            if (_now.out) {
                const response = await this._call('out', _now, request);
                responses.push(response);

            }

        }
        if (this.isEnd() === false && this._emitter.getState() === 'out') {
            this._emitter.setState("in")
        }



        return responses;
    }
    /**
     * 
     * @param {any} request 
     * @param {{ subid?:any, subkey?:any, subLoopInit?:any }} response 
     * @returns 
     */
    async forwardToSub(request, response) {

        let responses = []
        let _subLoopInit = response.subLoopInit || {}
        const hookResponses = await this._callHookFunction(request, response, false);
        for (const hookResponse of hookResponses) {
            if (!!hookResponse.subLoopInit === true) {
                _subLoopInit = Object.assign(_subLoopInit, hookResponse.subLoopInit)
            }

        }
        if (this._emitter.getState() === "forwardToSub") {
            const subloopStep = this.loader.forwardToSub(response.subid, response.subkey)
            this._context.forwardToSub(_subLoopInit)
            const _responses = await this._inProcess(request, subloopStep);
            responses = responses.concat(_responses);
        }
        return responses





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
        const _responses = await this._checkState(request, response);


        return responses.concat(_responses)
    }
    returnFromSub(request, response) {
        const responses = []

        this._context.returnFromSub();

        return this._callHookFunction("returnFromSub", request, response);


    }
    back(request, response) {
        const stepIndex = this.loader.getRelativePosition("now", -1)
        this.loader.setStepIndex(stepIndex)
        return this._callHookFunction("back", request, response)
    }
    break(request, response) {
        const stepIndex = this.loader.getRelativePosition("super")
        this.loader.setStepIndex(stepIndex)
        this._context.returnFromSub()
        return this._callHookFunction("break", request, response)
    }
    continue(request, response) {
        const stepIndex = this.loader.getRelativePosition("now", "start")
        this.loader.setStepIndex(stepIndex)
        return this._callHookFunction("continue", request, response)

    }
    /**
     * 
     * @param {state} state 
     * @param {any} request 
     * @param {any} response 
     * @param {boolean} [isAutoForword=true] 
     */
    async _callHookFunction(state, request, response, isAutoForword = true) {
        let responses = []
        const now = this.loader.getNow();
        const callable = !!now[state]
        if (callable) {
            await this._call(state, now, request, response)
            const state = this._emitter.getState()
            if (state !== "out" && state !== "keep") {
                const _responses = await this._emitter.run(request, response);
                responses = responses.concat(_responses)
            }

        }

        if (isAutoForword === true && this.isEnd() !== true && (callable === false || this._emitter.getState() === "out")) {
            this._emitter.setState("in")

        }
        return responses;


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
        this._history.push({ request, response, context, loopStepPath: this.loader.getStepIndex(), state: this._emitter.getState() })
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