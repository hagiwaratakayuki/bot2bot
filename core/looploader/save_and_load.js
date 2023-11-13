
const merge = require('deepmerge');
const { JSONSerializer } = require('../json_serializer')
/**
 * @typedef {import('./base_type').BuilderConfigMap} BuilderConfigMap
 * @typedef {import('./base_type').DocumentPropertis} DocumentPropertis
 * @typedef {import('./base_type').Document} Document
 * @typedef {import('./base_type').SubLoopDocumentList} SubLoopDocumentList

 */

const TOPKEY = '';

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
         * @type {{[loopStepPath: string]: import('./base_type').LoopStep}}
         */
        this.loopStepMap = {}

        /**
       * @type {{[key:string]: number}}
       */
        this._stepCountMap = {}

    }
    resetPosition() {
        /**
        * @type {number[]}
        */
        this.loopStepPath = [-1];
    }
    getLoopStepPath() {
        return [].concat(this.loopStepPath)
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
     */
    _getLoopStepPathString(loopStepPath) {
        return (loopStepPath || this.loopStepPath).join("_")
    }
    /**
     * 
     * @param {string} stepPathString 
     */
    _parseLoopStepPath(stepPathString) {
        return stepPathString.split("_").map(parseInt)

    }
    _getParentStatePath() {
        return this._getLoopStepPathString(this.loopStepPath.slice(0, -1))
    }
    _getStepCountKey() {
        if (this.loopStepPath.length === 1) {
            return TOPKEY;
        }

        return this._getParentStatePath();

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

        const loopStepPath = this._getLoopStepPathString();

        this.loopStepMap[loopStepPath] = { builderID, options: _options }
        const key = this._getStepCountKey();
        this._stepCountMap[key] = (this._stepCountMap[key] || 0) + 1;



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
     * @param {import('./base_type').SubLoopType?} subLoopType
     */
    startSubLoop(subLoopType) {
        const parentLoopStepPath = this._getLoopStepPathString();
        this.loopStepMap[parentLoopStepPath].subLoopType = subLoopType;
        this.loopStepPath.push(-1)
    }

    endSubLoop() {
        this.loopStepPath.pop()
    }

    _defaultMerge(basicOptions, options) {
        return merge(basicOptions, options)

    }




}
/**
 * @implements {import('./base').BasicLoader}
 */
class Loader extends Brige {
    constructor(isFirst = false) {
        super();
        this._isFirst = isFirst
        this.positionState = { isEnd: false, isSubLoopOut: false };
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
        const filters = ['_cache', '_cacheKey', '_isFirst'];
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
        const parentLoopStepPath = this._getStepCountKey();

        if (this.loopStepPath.length !== 1) {

            const parentLoopStep = this.loopStepMap[parentLoopStepPath]
            if (parentLoopStep.subLoopType === 'selection') {

                isSubLoopOut = true;

            }
            if (parentLoopStep.subLoopType === 'loop') {



                isSubLoopOut = this._stepCountMap[parentLoopStepPath] <= step;


            }



        }

        if (isSubLoopOut === false) {
            this.loopStepPath[tailIndex] = step


        }
        else {
            this.loopStepPath.pop()
        }
        if (this.loopStepPath.length === 1) {

            isEnd = this._stepCountMap[this._getStepCountKey()] - 1 === this.loopStepPath[0];

        }

        this.positionState = { isEnd, isSubLoopOut }
        return this.getNow();
    }
    back() {
        const tailIndex = this.loopStepPath.length - 1;
        const nextStep = this.loopStepPath[tailIndex] - 1;
        let isSubLoopOut = false;
        if (this.loopStepPath.length !== 1) {

            const parentloopStepPath = this._getParentStatePath();
            const parentLoopStep = this.loopStepMap[parentloopStepPath];

            if (parentLoopStep.subLoopType === 'selection') {

                isSubLoopOut = true;

            }
            if (parentLoopStep.subLoopType === 'loop') {


                isSubLoopOut = nextStep === -1;


            }
        }
        if (isSubLoopOut === true) {
            this.loopStepPath.pop()

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
     */
    forwardToSub(subLoopNumber) {
        if (!subLoopNumber) {
            this.loopStepPath.push(0) // go to fix position
        }
        else {
            this.loopStepPath.push(subLoopNumber);
        }
        this.positionState.isEnd = false;
        this.positionState.isSubLoopOut = false
        return this.getNow()


    }
    /**
     * 
     * @returns {import('../plugin').PlugIns}
     */
    getNow() {
        const loopStepPath = this._getLoopStepPathString();
        if (this._cacheKey === loopStepPath) {
            return this._cache

        }
        const loopStep = this.loopStepMap[loopStepPath]

        this._cache = this.buildStep(loopStep);
        this._cacheKey = loopStepPath;
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
        const builderConfig = this.builderConfigMap[loopStep.builderID];
        return builderConfig.builder(loopStep.options)
    }
    /**
    * 
   
    * @param {string} language 
    * @param {DocumentPropertis?} filter
    * @returns {SubLoopDocumentList}  
    */
    getSubLoopDocuments(language, filter = ["description", "title"]) {
        const key = this._getLoopStepPathString();
        const subLoopsCount = this._stepCountMap[key]
        /**
         * @type {SubLoopDocumentList}
         */
        const documentList = [];
        for (let index = 0; index < subLoopsCount; index++) {
            const document = this.getSubLoopDocument(index, language, filter);
            documentList.push({ subid: index, document });
        }
        return documentList;

    }
    /**
     * 
     * @param {any} subid 
     * @param {string} language 
     * @param {DocumentPropertis?} filter
     * @returns {SubLoopDocumentList}  
     */
    getSubLoopDocument(subid, language, filter = ["description", "title"]) {
        const document = {}
        const key = this._getLoopStepPathString(this.loopStepPath.concat([subid]));
        const { builderID, options } = this.loopStepMap[key];

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