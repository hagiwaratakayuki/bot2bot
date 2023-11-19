const { Loader } = require("../../../core/looploader/save_and_load");
const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const { StateController } = require("../../../core/state_controller");
const parroting = require("../../plugin/parroting")
const message = require("../../plugin/message");

const executeRegisters = [
    parroting.executeRegister,
    message.executeRegister
]

/**
 * 
 * @param {import("../../../core/looploader/base_type").BasicLoader} loader 
 */
function executeRouter(loader) {
    for (const register of executeRegisters) {
        register(loader);
    }
}

function main() {
    execute().then(function () {
        process.exit();
    })
}

async function execute() {

    const JSONData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'bot2bot/exampledata/cli.json'), { encoding: "utf-8" }))
    const loader = new Loader(true);
    executeRouter(loader);
    loader.fromJSON(JSONData)
    const controller = new StateController(loader)

    while (controller.isEnd() === false) {
        await controller.run({})


    }

}

if (require.main === module) {
    main();
}
module.exports = execute