
const merge = require('deepmerge');
const { JSONSerializer } = require('../json_serializer')
const { getSubLoopType, getSubLoopTypeId } = require('./loop_type');
/**
 * @typedef {import('./base_type').BuilderConfigMap} BuilderConfigMap
 * @typedef {import('./base_type').DocumentPropertis} DocumentPropertis
 * @typedef {import('./base_type').Document} Document
 * @typedef {import('./base_type').SubLoopDocumentList} SubLoopDocumentList
 * @typedef {import('./base_type').LoopStep } LoopStep
 * @typedef {Pick<LoopStep, 'subLoops'> | LoopStep} RouteStep
*/

const PATH_DElIMITER = '/';

class Brige extends JSONSerializer {

    constructor() {
        super();
        /**
         * @type {import('./base_type').BuilderConfig[]}
         */
        this._startConfigures = []

        /**
         * @type {BuilderConfigMap}
         */
        this.builderConfigMap = {};
        this.resetPosition();


        /**
         * @type {RouteStep}
         */
        this._rootLoop = {
            s: {
                '': {
                    t: '0',
                    stp: []

                }
            }
        };




    }


    resetPosition() {
        /**
        * @type {number[]}
        */
        this.loopStepPath = [-1];
        this.loopStepKeyPath = ['']
    }
    getLoopStepPath() {
        return [[].concat(this.loopStepPath), [].concat(this.loopStepKeyPath)]
    }
    setLoopStepPath([loopStepPath, loopStepKeyPath]) {
        this.loopStepPath = [].concat(loopStepPath)
        this.loopStepKeyPath = [].concat(loopStepKeyPath)

    }
    /**
    * 
    * @param {BuilderConfigMap} builderConfigMap 
    */
    buildersRegistration(builderConfigMap) {
        this.builderConfigMap = Object.assign(this.builderConfigMap, builderConfigMap);
    }
    /**
    * @param {any} builderID 
    * @param {import('./base_type').BuilderConfig} builderConfig 
    */
    builderRegistration(builderID, builderConfig) {
        this.builderConfigMap[builderID] = builderConfig
    }
    _toJSON(filters = []) {
        return super._toJSON(["builderConfigMap"].concat(filters));
    }

    /**
     * 
     * @param {number[]?} loopStepPath
     * @param {string[]?} loopStepKeyPath
     */
    _getLoopStep(loopStepPath, loopStepKeyPath) {
        const _loopStepPath = loopStepPath || this.loopStepPath
        const _loopStepKeyPath = loopStepKeyPath || this.loopStepKeyPath
        const limit = _loopStepPath.length
        let index = 0;
        /**
         * @type {RouteStep}
         */
        let result = this._rootLoop;
        while (index < limit) {
            result = result.s[_loopStepKeyPath[index]].stp[_loopStepPath[index]]
            index++;

        }


        return result;
    }

    _getUpperLoopStep() {
        return this._getLoopStep(this.loopStepPath.slice(0, -1), this.loopStepKeyPath.slice(0, -1))
    }






}
class Saver extends Brige {
    /**
     * 
     * @param {string} builderID
     * @param {Object?} options
     *  
    */
    addStartStep(builderID, options) {
        const _options = this._mergeOptions(builderID, options)
        this._startConfigures.push({ builderID, options: _options })
    }

    /**
     * 
     * @param {string} builderID
     * @param {Object?} options
     *  
     */
    addLoopStep(builderID, options) {
        this.loopStepPath[this.loopStepPath.length - 1] += 1;

        let _options = this._mergeOptions(builderID, options);

        const upperLoop = this._getUpperLoopStep();

        /**
         * @type {RouteStep}
         */

        const step = { bID: builderID, o: _options, s: {} }
        upperLoop.s[this.loopStepKeyPath[this.loopStepKeyPath.length - 1]].stp.push(step)



    }
    _mergeOptions(builderID, options) {
        const { options: basicOptions, mergeFunction = this._defaultMerge } = this.builderConfigMap[builderID]
        let _options
        if (options && basicOptions) {
            _options = mergeFunction(basicOptions || {}, options)
        }
        else if (options) {
            _options = options
        }
        return options;
    }
    /**
     * 
     * @param {import('./base_type').SubLoopType} subLoopType
     * @param {string} [subLoopKey = '']
     */
    startSubLoop(subLoopType, subLoopKey = '') {
        const step = this._getLoopStep()
        if (subLoopKey in step.s === false) {
            step.s[subLoopKey] = {
                t: getSubLoopTypeId(subLoopKey),
                stp: []
            }
        }

        this.loopStepPath.push(-1)
        this.loopStepKeyPath.push(subLoopKey)

    }

    endSubLoop() {
        this.loopStepPath.pop()
        this.loopStepKeyPath.pop()
    }

    _defaultMerge(basicOptions, options) {
        return merge(basicOptions, options)

    }




}
/**
 * @implements {import('./base_type.d.ts').BasicLoader}
 */
class Loader extends Brige {
    constructor(isFirst = false, language = '', i18n = {}) {
        super();
        this._isFirst = isFirst
        this.positionState = { isEnd: false, isSubLoopOut: false };
        this._language = language
        this._i18n = i18n
    }
    fromJSON(jsonData) {

        super.fromJSON(jsonData);
        if (this._isFirst === true) {
            this.resetPosition();
        }

    }
    toJSON() {
        /**
         * @type {Array<keyof Loader>}
         */
        const filters = ['_cache', '_cacheKey', '_isFirst', '_i18n', '_language'];
        return super._toJSON(filters);
    }


    forward() {


        const tailIndex = this.loopStepPath.length - 1;
        const step = this.loopStepPath[tailIndex] + 1;

        /**
         * @type {boolean}
         */
        let isEnd = false;
        /**
         * @type {boolean}
         */
        let isSubLoopOut = false;

        const upperLoop = this._getUpperLoopStep()



        if (this.loopStepPath.length !== 1) {

            const subLoopState = upperLoop.s[this.loopStepKeyPath[this.loopStepKeyPath - 1]]
            const subLoopStepType = getSubLoopType(subLoopState.t)
            if (subLoopStepType === 'selection') {

                isSubLoopOut = true;

            }
            if (subLoopStepType === 'loop') {



                isSubLoopOut = subLoopState.stp.length <= step;


            }



        }

        if (isSubLoopOut === false) {
            this.loopStepPath[tailIndex] = step


        }
        else {
            this.loopStepPath.pop()
            this.loopStepKeyPath.pop()
        }
        if (this.loopStepPath.length === 1) {

            isEnd = this.loopStepPath[0] === this._rootLoop.s[''].stp.length - 1;

        }

        this.positionState = { isEnd, isSubLoopOut }
        return this.getNow();
    }
    back() {
        const tailIndex = this.loopStepPath.length - 1;
        const nextStep = this.loopStepPath[tailIndex] - 1;
        let isSubLoopOut = false;
        if (this.loopStepPath.length !== 1) {

            const upperLoopStep = this._getUpperLoopStep();


            if (upperLoopStep.s === 'selection') {

                isSubLoopOut = true;

            }
            if (parentLoopStep.subLoopType === 'loop') {


                isSubLoopOut = nextStep === -1;


            }
        }
        if (isSubLoopOut === true) {
            this.loopStepPath.pop();
            this.loopStepKeyPath.pop();

        }
        this.positionState = { isEnd: false, isSubLoopOut }
        return this.getNow();






    }
    backAll() {
        if (this.loopStepPath.length === 1 && this.loopStepPath[0] === 0) {
            throw Error("this is start. it can not to back");

        }
        if (this.loopStepPath.length === 1) {
            this.resetPosition();
        }
        else {
            this.loopStepPath.pop()
        }

        this.positionState = { isEnd: false, isSubLoopOut: true }
        return this.getNow()

    }
    /**
     * 
     * @param {number?} subLoopNumber
     * @param {string?} subLoopKey
     */
    forwardToSub(subLoopNumber, subLoopKey = '') {
        if (!subLoopNumber) {
            this.loopStepPath.push(0) // go to fix position
        }
        else {
            this.loopStepPath.push(subLoopNumber);
        }
        this.loopStepKeyPath.push(subLoopKey)
        this.positionState.isEnd = false;
        this.positionState.isSubLoopOut = false
        return this.getNow()


    }
    /**
     * 
     * @returns {import('../plugin').PlugIn}
     */
    getNow() {
        const loopStep = this._getLoopStep();
        if (this._cacheKey === loopStep) {
            return this._cache

        }

        //@ts-ignore
        this._cache = this.buildStep(loopStep);
        this._cacheKey = loopStep;
        return this._cache;
    }
    getStartStep() {
        const ret = []
        for (const loopStep of this._startConfigures) {
            ret.push(this.buildStep(loopStep))
        }
        return ret;
    }
    /**
     * 
     * @param {import('./base_type').LoopStep} loopStep 
     */
    buildStep(loopStep) {
        const builderConfig = this.builderConfigMap[loopStep.bID];
        return builderConfig.builder(loopStep.o, this._language, this._i18n)
    }
    /**
    * 
   
    * @param {string} language 
    * @param {DocumentPropertis?} filter
    * @param {string} [subLoopKey=''] 
    * @returns {SubLoopDocumentList}  
    */
    getSubLoopDocuments(language, filter = ["description", "title"], subLoopKey = '') {
        // @ts-ignore
        const subLoopsCount = this._getLoopStep().s[subLoopKey].steps.length
        /**
         * @type {SubLoopDocumentList}
         */
        const documentList = [];
        for (let subid = 0; subid < subLoopsCount; subid++) {
            const document = this.getSubLoopDocument(subid, language, filter, subLoopKey);
            documentList.push({ subid, document });
        }
        return documentList;

    }
    /**
     * 
     * @param {any} subid 
     * @param {string} language 
     * @param {DocumentPropertis?} filter
     * @param {string} [subLoopKey=''] 
     * @returns {Document}  
     */
    getSubLoopDocument(subid, language, filter = ["description", "title"], subLoopKey = '') {
        const document = {}
        const { builderID, options } = this._getLoopStep(this.loopStepPath.concat([subid]), this.loopStepKeyPath.concat([subLoopKey]));

        const { documentLoader } = this.builderConfigMap[builderID]

        if (!documentLoader) {
            throw builderID + " has no document";

        }
        for (const property of filter) {
            document[property] = documentLoader[property].call(language, options)
        }
        return document;




    }



}


module.exports = { Saver, Loader };