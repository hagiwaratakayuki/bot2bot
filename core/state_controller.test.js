const assert = require('node:assert');
const { StateController } = require('./state_controller')
const { Saver, Loader } = require('./looploader/save_and_load');



/**
 * @typedef {import('./plugin').StateResponse} StateResponse
 */

describe('Executer', function () {

    it('execute first', async function () {
        let mockBulderArgs;
        let inArgs;
        let outArgs;
        let keepArgs;
        let callBackName;

        function keepfunc(args) {
            keepArgs = args;
            /**
             * @type {StateResponse}
             */
            let response = {}

            if (args[0].isForwardToSub === true) {
                response.state = "forwardToSub"
                if (args[0].subid) {
                    response.s
                }

            }
            return response
        }

        function mockBulder(...args) {
            mockBulderArgs = args;
            const isKeep = args[0].isKeep
            const callback = args[0].callback

            return {
                in: function (...args) {
                    inArgs = args;
                    /**
                     * @type {StateResponse}
                     */
                    const ret = { state: "out" };
                    if (isKeep) {
                        ret.state = "keep"
                        ret.callback = callback
                    }
                    return ret;


                },
                out: function (...args) {
                    outArgs = args;
                    return { mode: "out" };
                },
                keep: function (...args) {
                    callBackName = "keep"
                    return keepfunc(args)

                },
                keepTest: function (...args) {
                    callBackName = "keep"
                    return keepfunc(args)

                },


            }

        }


        /**
         * @type {import('./base_type').DocumentLoader}
         */
        const mockDocumentLoader = {
            title: function (language, options) {

            },
            description: function (language, options) {

            }
        };
        const saver = new Saver()
        const builderConfigMap = {
            'test': {
                builder: mockBulder,
                options: { loop: 'foo', notMerge: true },
                documentLoader: mockDocumentLoader


            }
        }
        saver.builderRegistration(builderConfigMap);
        saver.addLoopStep('test', { loop: 1 })
        saver.addLoopStep('test', { loop: 2, isKeep: true })
        saver.startSubLoop('loop');
        saver.addLoopStep('test', { subloop: 1 });
        saver.addLoopStep('test', { subloop: 2 });

        saver.endSubLoop();

        saver.addLoopStep('test', { loop: 3 })
        saver.startSubLoop('selection');


        saver.endSubLoop();


        let jsonData = saver.toJSON()

        let loader = new Loader(true)
        loader.builderRegistration(builderConfigMap);




        let controlller = new StateController(loader);
        let res = await controlller.run({}, { loader: jsonData });
        console.log(inArgs);
        console.log(outArgs);
        console.log(res);

        jsonData = controlller.toJSON()

        loader = new Loader()
        loader.builderRegistration(builderConfigMap);
        controlller = new StateController(loader);

        res = await controlller.run({}, jsonData);
        res = await controlller.run({});
        console.log(keepArgs)
        console.log(mockBulderArgs);






    });

});