const { Saver, Loader } = require("../../../core/looploader/save_and_load");
const { Creater } = require("../../creater");
const { createRouter } = require("../../plugin/cli");
const process = require("node:process")



function main() {
    create().then(function () {
        process.exit(0)
    })
}

async function create(jsonData) {
    const saver = new Saver()
    const loader = new Loader(true);
    const creater = new Creater(saver, loader)
    createRouter(loader, saver)
    while (creater.controller.isEnd() === false) {
        await creater.run({})

    }

}

if (require.main === module) {
    main();
}