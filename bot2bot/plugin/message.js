
/**
 * 
 * @typedef {import("../../core/plugin").StateResponse} StateResponse
 * @typedef {import("../../core/plugin").PlugIn} PlugIns
 * @typedef {import("../../core/looploader/base_type").BuilderConfig} BuilderConfig
 * @typedef {import("../../core/looploader/save_and_load").Saver} Saver
 * @typedef {{message:string}} MessageOption
 * @typedef {import('../../core/looploader/base_type').BasicLoader} Loader
 * 
 */
const name = "message"



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

module.exports = { name, executeRegister }