const path = require("node:path");
const { Saver, Loader } = require("../../../core/looploader/save_and_load");
const { Creater } = require("../../creater");
const { createRouter } = require("../../plugin/cli");
const fs = require("node:fs")
const process = require("node:process")



function main() {
    create().then(function () {
        process.exit(0)
    })
}

async function create() {
    const saver = new Saver()
    const loader = new Loader(true);
    const creater = new Creater(saver, loader)
    createRouter(loader, saver)
    while (creater.controller.isEnd() === false) {
        await creater.run({})

    }
    const data = JSON.stringify(saver.toJSON())
    fs.writeFileSync(path.join(process.cwd(), 'bot2bot/exampledata/cli.json'), data)


}

if (require.main === module) {
    main();
}

module.exports = create