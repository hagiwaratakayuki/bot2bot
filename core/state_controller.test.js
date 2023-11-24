const assert = require('node:assert');
const { StateController } = require('./state_controller')
const { Saver, Loader } = require('./looploader/save_and_load');




/**
 * @typedef {import('./state_controller').StateResponse} StateResponse
 * @typedef {{isForwardToSub?:true subid?:any}} SubloopRequest
 * @typedef {[SubloopRequest, import('./context').Context]} MockArg
 */
describe('Executer', function () {

    it('execute first', async function () {
        let mockBulderArgs;
        let inArgs;
        let outArgs;
        let keepArgs;
        let callBackName;
        /**
         * @type {{[k in import('./state_emitter').state]:{options: any, language: any, i18n:any}}}
         */
        let builderArgs = {};
        /**
         * 
         * @param {MockArg} args 
         * @returns 
         */
        function keepfunc(args) {
            keepArgs = args;
            /**
             * @type {StateResponse}
             */
            let response = {}

            if (args[0].isForwardToSub === true) {
                response.state = "forwardToSub"
                if (args[0].subid) {
                    response.subid = args[0].subid
                }

            }
            return response
        }
        let isReturnFromSubCalled = false
        /**
         * 
         * @type  {import('./plugin').Builder}  
         * 
         */
        function mockBulder(options, language, i18n) {
            mockBulderArgs = { options, language, i18n };
            const isKeep = options.isKeep
            const callback = options.callback

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
                    builderArgs['in'] = { options, language, i18n }
                    return ret;


                },
                out: function (...args) {
                    outArgs = args;
                    builderArgs['out'] = { options, language, i18n }
                    return { mode: "out" };
                },
                keep: function (...args) {
                    callBackName = "keep"
                    builderArgs['keep'] = { options, language, i18n }
                    return keepfunc(args)

                },
                keepTest: function (...args) {
                    callBackName = "keepTest"
                    builderArgs['keep'] = { options, language, i18n }
                    return keepfunc(args)

                },
                returnFromSub: function (...args) {
                    isReturnFromSubCalled = true
                    builderArgs['returnFromSub'] = { options, language, i18n }
                    return { mode: "returnFromSub" }
                }


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
        saver.buildersRegistration(builderConfigMap);
        saver.addLoopStep('test', { loop: 1 })
        saver.addLoopStep('test', { loop: 2, isKeep: true })
        saver.startSubLoop('loop');
        saver.addLoopStep('test', { subloop: 1 });
        saver.addLoopStep('test', { subloop: 2 });

        saver.endSubLoop();

        saver.addLoopStep('test', { loop: 3, isKeep: true })
        saver.startSubLoop('selection');
        saver.addLoopStep('test', { selectoption: 1 });
        saver.addLoopStep('test', { selectoption: 2 });


        saver.endSubLoop();


        let jsonData = saver.toJSON()

        let loader = new Loader(true)
        loader.buildersRegistration(builderConfigMap);




        let controlller = new StateController(loader);
        let res = await controlller.run({}, { loader: jsonData });
        /*console.log(inArgs);
        console.log(outArgs);
        console.log(res);
        */

        jsonData = controlller.toJSON()

        loader = new Loader(true)
        loader.buildersRegistration(builderConfigMap);
        controlller = new StateController(loader);

        res = await controlller.run({}, jsonData);
        res = await controlller.run({});//keep here
        res = await controlller.run({ isForwardToSub: true }); // forward to sub
        res = await controlller.run({}); //step sub 
        res = await controlller.run({});
        /**
         * @type {SubloopRequest}
         */
        let mockRequest = { isForwardToSub: true, subid: 1 }

        res = await controlller.run(mockRequest);
        assert(builderArgs['in'].options.selectoption, 1)
        assert(res[3].mode, 'returnFromSub');
        assert(res[4].mode, 'out');
        /* console.log(keepArgs)
         console.log(inArgs)
         console.log(mockBulderArgs);
         console.log(controlller.loader.positionState)*/






    });

});