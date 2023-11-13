const readlineSync = require('readline-sync');


/**
 * @typedef {import("../../message").CreaterRequest} CreaterRequest
 * @typedef {import("../../../core/plugin").StateResponse} StateResponse
 * @typedef {import("../../../core/plugin").PlugIns} PlugIns
 * @typedef {import("../../../core/looploader/base_type").BuilderConfigMap} BuilderConfigMap
 * @typedef {import("../../../core/looploader/save_and_load").Saver} Saver
 * @typedef {{message:string}} MessageOption
 */
const name = "parroting"

/**
 * 
 * @param {Saver} saver 
 */
function createrRegister(saver) {



    saver.builderRegistration(name, {
        builder: createrBuilder,
        documentLoader: {
            title: function () {
                return "parroting"
            }
        }
    })
}


/**
 * 
 * @param {CreaterRequest} request 
 */

function createrBuilder() {
    return {
        /**
         * 
         * @param {{saver:Saver}} request 
         */
        in: function (request) {

            request.saver.addLoopStep(name, {})
            console.log("parroting add")


        }
    }

}

/**
 * 
 * @param {Saver} saver 
 */
function executeRegister(saver) {
    saver.builderRegistration(name, {
        builder: executerBuilder
    })

}

/**
 * 
 * @param {any} options 
 */
function executerBuilder(options) {
    /**
     * @type {PlugIns}
     */
    const res = {
        in: function () {
            const message = readlineSync.question("say samething: ")
            console.log("you said " + message)
        }
    }
    return res

}
module.exports = { name, createrRegister, executeRegister }
