const { name } = require('../parroting');


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

* /
/**
 *
 * @param {Saver} saver
 */
function createrRegister(saver) {



    saver.builderRegistration(name, {
        builder: createrBuilder,
        documentLoader: {
            title: function () {
                return "parroting";
            }
        }
    });
}
function createrBuilder() {
    return {
        /**
         *
         * @param {CreateRequest} request
         */
        in: function (request) {

            request.saver.addLoopStep(name, {});
            /**
             * @type {Message & StateResponse}
             */
            const response = {
                responseType: "message",
                text: "parroting add",
                state: "out",

            }
            return response


        }
    };

}

module.exports = { name, createrRegister }