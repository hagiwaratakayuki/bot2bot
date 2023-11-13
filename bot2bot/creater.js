const { JSONSerializer } = require("../core/json_serializer");
const { StateController } = require("../core/state_controller");

class Creater extends JSONSerializer {
    /**
     * @param {import("../core/looploader/save_and_load").Saver} saver 
     * @param {import("../core/looploader/base_type").BasicLoader} loader
     * @param {Function} controllerClass 
     *
     */
    constructor(saver, loader, controllerClass = StateController) {
        super();
        /**
         * @type {StateController}
         */
        this.controller = new StateController(loader)
        this.saver = saver

    }
    run(input, jsonData) {
        const request = {
            request: input,
            saver: this.saver
        }
        return this.controller.run(request, jsonData);
    }

}

module.exports = { Creater }