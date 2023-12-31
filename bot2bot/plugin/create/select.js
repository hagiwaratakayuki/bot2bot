

/**
 *  
 * @typedef { import('../../../core/plugin').StateResponse } StateResponse
 * 
 * @typedef import("../../../core/looploader/base_type").BuilderConfig
 * @typedef { import("../../core/looploader/save_and_load").Saver } Saver
 * @typedef { { message: string } } MessageOption
 * @typedef { import("../../connecter/message").Message } Message
 * @typedef { import("../../connecter/message").CallbackMessage } CallbackMessage
 * @typedef { import("../../create_request").CreateRequest <CallbackMessage> } CreateRequest

* */
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
     * @type {import('../../../core/plugin').PlugIn}
     */

    const plugins = {
        /**
         * 
         * @param {CreateRequest} request 
         */
        in: function (request, context, controller) {
            const pluginNames = controller.loader.getSubLoopDocuments('', ["title"]).map(function (r) {
                return r.document.title

            })
            /**
             * @type {StateResponse & Message}
             */
            const ret = {
                state: "keep",
                callback: "select",
                responseType: "selection",
                text: "select one",
                selectOptions: pluginNames


            };
            return ret;

        },
        /**
         * 
         * @param {CreateRequest} request
         * @param {any} context
         * @param {import('../../../core/state_controller').StateController} controller
         * @returns {StateResponse}
         */
        select: function (request, context, controller) {



            if (request.input.selection === -1) {
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
         * @param {CreateRequest} request 
         */
        returnFromSub: function (request) {
            /**
            * @type {StateResponse}
            */
            const ret = {
                state: "keep",
                callback: "beforeFinal"

            };
            return ret;

        },
        /**
         * 
         * @param {CreateRequest} request
         * @returns {StateResponse & Message} 
         */
        beforeFinal: function (request) {
            return {
                state: "keep",
                callback: "final",
                responseType: "YN",
                text: 'finish it?'


            }

        },
        /**
         * 
         * @param {CreateRequest} request
         * @returns {StateResponse} 
         */
        final: function (request) {



            if (request.input.YN === true) {
                return {
                    state: "out"
                }
            }
            return {
                state: "keep",
                callback: "in"

            }

        }
    }
    return plugins

}


module.exports = { name, createrRegister }