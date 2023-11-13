
const readlineSync = require('readline-sync');



/**
 * @typedef {import("../../message").CreaterRequest} CreaterRequest
 * @typedef {import("../../../core/plugin").StateResponse} StateResponse
 * @typedef {import("../../../core/plugin").PlugIns} PlugIns
 * @typedef {import("../../../core/looploader/base_type").BuilderConfigMap} BuilderConfigMap
 * 
 * @typedef {import("../../../core/looploader/save_and_load").Saver} Saver
 */
const name = "example"

/**
 * 
 * @param {Saver} saver 
 */
function createrRegister(saver) {


    saver.builderRegistration(name, {
        builder: createrBuilder
    })
}

/**
 * 
 * @param {any} options 
 */
function createrBuilder(options) {
    /**
     * @type {PlugIns}
     */

    const plugins = {
        /**
         * 
         * @param {CreaterRequest} request 
         */
        in: function (request) {
            console.log("hello! start selection")
            /**
             * @type {StateResponse}
             */
            const ret = {
                state: "keep",
                callback: "select"

            };
            return ret;

        },
        /**
         * 
         * @param {CreaterRequest} request
         * @param {any} context
         * @param {import('../../../core/state_controller').StateController} controller
         */
        select: function (request, context, controller) {
            const pluginNames = controller.loader.getSubLoopDocuments('', ["title"]).map(function (r) {
                return r.document.title

            })

            const index = readlineSync.keyInSelect(pluginNames, 'select function');
            if (index === -1) {
                return;
            }
            /**
             * @type {StateResponse}
             */
            const response = {
                state: "forwardToSub",
                subid: index
            }
            return response


        },
        /**
         * 
         * @param {CreaterRequest} request 
         */
        returnFromSub: function () {
            /**
            * @type {StateResponse<typeof>}
            */
            const ret = {
                state: "keep",
                callback: "final"

            };
            return ret;

        },
        /**
         * 
         * @param {CreaterRequest} request
         * @returns {StateResponse} 
         */
        final: function (request) {

            const isEnd = readlineSync.keyInYN('finish it?');
            if (isEnd === true) {
                return {
                    state: "out"
                }
            }
            return {
                state: "keep",
                callback: "select"

            }

        }
    }
    return plugins

}
function executeRegister() {

}

function executerBuilder() {

}

module.exports = { name, createrRegister, executeRegister }