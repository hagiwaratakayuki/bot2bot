const readlineSync = require('readline-sync');


/**
 * @typedef {import("../../message").CreaterRequest} CreaterRequest
 * @typedef {import("../../../core/plugin").StateResponse} StateResponse
 * @typedef {import("../../../core/plugin").PlugIns} PlugIns
 * @typedef {import("../../../core/looploader/base_type").BuilderConfigMap} BuilderConfigMap
 * @typedef {import("../../../core/looploader/save_and_load").Saver} Saver
 * @typedef {{message:string}} MessageOption
 */
const name = "message"

/**
 * 
 * @param {Saver} saver 
 */
function createrRegister(saver) {
    /**
     * @type {BuilderConfigMap}
     */
    const config = {}
    config[name] = {
        builder: createrBuilder
    }

    saver.buildersRegistration(config)
}


/**
 * 
 * @param {CreaterRequest} request 
 */

function createrBuilder(request) {
    return {
        in: function () {
            const message = readlineSync.question('please input message: ')
            while (!message) {
                readlineSync.question('please input message: ')
            }
            /**
             * @type {MessageOption}
             */
            const options = { message }
            request.saver.addLoopStep(name, options)
        }
    }

}
/**
 * 
 * @param {MessageOption} options 
 */
function executerBuilder(options) {
    /**
     * @type {PlugIns}
     */
    const res = {
        in: function () {
            console.log(options.message)
        }
    }
    return res

}