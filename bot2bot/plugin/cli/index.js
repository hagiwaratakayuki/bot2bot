const { Saver } = require("../../../core/looploader/save_and_load")
const select = require("./select")
const parroting = require("./parroting")
const createRegisters = [
    select.createrRegister,
    parroting.createrRegister
]

const executeRegisters = [
    parroting.executeRegister
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