const path = require("node:path");
const { Saver, Loader } = require("../../../core/looploader/save_and_load");
const { Creater } = require("../../creater");

const fs = require("node:fs")


const select = require("../../plugin/create/select")
const parroting = require("../../plugin/create/parroting")
const message = require("../../plugin/create/message");
const createRegisters = [
    select.createrRegister,
    parroting.createrRegister,
    message.createrRegister
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

const process = require("node:process");
const { Connector } = require("../../connecter/cli");


function main() {
    create().then(function () {
        process.exit(0)
    })
}

async function create() {
    const saver = new Saver()
    const loader = new Loader(true);
    const creater = new Creater(saver, loader)
    const connecter = new Connector(creater)

    createRouter(loader, saver)
    await connecter.run()

    const data = JSON.stringify(saver.toJSON())
    fs.writeFileSync(path.join(process.cwd(), 'bot2bot/exampledata/cli.json'), data)


}

if (require.main === module) {
    main();
}

module.exports = create