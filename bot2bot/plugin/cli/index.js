const { Saver } = require("../../../core/looploader/save_and_load")
const select = require("./select")
const parroting = require("./parroting")
const registers = [
    select.createrRegister,
    parroting.createrRegister
]
/**
 * 
 * @param {import("../../../core/looploader/base_type").BasicLoader} loader 
 * @param {import("../../../core/looploader/save_and_load").Saver} saver 
 */
function createrRouter(loader, saver) {
    const routeSaver = new Saver();

    for (const register of registers) {
        register(saver);
        register(loader);
        register(routeSaver)


    }
    routeSaver.addLoopStep(select.name, {})
    routeSaver.startSubLoop('selection');
    routeSaver.addLoopStep(parroting.name, {})

    loader.fromJSON(routeSaver.toJSON());

}

module.exports = { createRouter: createrRouter }