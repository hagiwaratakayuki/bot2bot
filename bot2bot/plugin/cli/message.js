const readlineSync = require('readline-sync');


/**
 * @typedef {import("../../message").CreaterRequest} CreaterRequest
 * @typedef {import("../../../core/plugin").StateResponse} StateResponse
 * @typedef {import("../../../core/plugin").PlugIns} PlugIns
 * @typedef {import("../../../core/looploader/base_type").BuilderConfig} BuilderConfig
 * @typedef {import("../../../core/looploader/save_and_load").Saver} Saver
 * @typedef {{message:string}} MessageOption
 * @typedef {import('../../../core/looploader/base_type').BasicLoader} Loader
 */
const name = "message"

/**
 * 
 * @param {Saver} saver 
 */
function createrRegister(saver) {
    /**
     * @type {BuilderConfig}
     */
    const config = {
        builder: createrBuilder,
        documentLoader: {
            title: function () {
                return "message"
            }
        }
    }

    saver.builderRegistration(name, config)
}


/**
 * 
 * @param {CreaterRequest} request 
 */

function createrBuilder() {
    return {
        in: function (request) {
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
 * @param {Loader} loader 
 */
function executeRegister(loader) {
    loader.builderRegistration(name, {
        builder: executerBuilder,
        documentLoader: {
            title: function () {
                return "message"
            }
        }
    })

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

module.exports = { name, createrRegister, executeRegister }