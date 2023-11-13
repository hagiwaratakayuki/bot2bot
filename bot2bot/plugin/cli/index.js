const { Saver } = require("../../../core/looploader/save_and_load")
const select = require("./select")
const parroting = require("./parroting")
const message = require("./message");
const createRegisters = [
    select.createrRegister,
    parroting.createrRegister,
    message.createrRegister
]

const executeRegisters = [
    parroting.executeRegister,
    message.executeRegister
]
/**
 * 
 * @param {import("../../../core/looploader/base_type").BasicLoader} loader 
 * @param {import("../../../core/looploader/save_and_load").Saver} saver 
 */
function createRouter(loader, saver) {
    const routeSaver = new Saver();

    for (const register of createRegisters) {
        register(saver);
        register(loader);
        register(routeSaver)


    }
    routeSaver.addLoopStep(select.name, {})
    routeSaver.startSubLoop('selection');
    routeSaver.addLoopStep(parroting.name, {})
    routeSaver.addLoopStep(message.name, {})
    loader.fromJSON(routeSaver.toJSON());

}
/**
 * 
 * @param {import("../../../core/looploader/base_type").BasicLoader} loader 
 */
function executeRouter(loader) {
    for (const register of executeRegisters) {
        register(loader);
    }
}

module.exports = { createRouter, executeRouter }