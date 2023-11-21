
const merge = require('deepmerge');
const { JSONSerializer } = require('../json_serializer')
/**
 * @typedef {import('./base_type').BuilderConfigMap} BuilderConfigMap
 * @typedef {import('./base_type').DocumentPropertis} DocumentPropertis
 * @typedef {import('./base_type').Document} Document
 * @typedef {import('./base_type').SubLoopDocumentList} SubLoopDocumentList
 * @typedef {import('./base_type').SubLoopType} SubLoopType
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
         * @type {{[loopStepPath: string]: import('./base_type').LoopStep}}
         */
        this.loopStepMap = {}
        /**
         * @type {{[loopKey: string]: SubLoopType}}
        */
        this.subLoopTypeMap = {}




    }
    /**
     * 
     * @param {string?} loopKey 
     */
    _getSubLoopType(loopKey) {
        return this.subLoopTypeMap[loopKey || this._getLoopKey()]

    }
    /**
     * 
     * @param {SubLoopType} subLoopType 
     * @param {string?} loopKey 
     */
    _setSubLoopType(subLoopType, loopKey) {
        return this.subLoopTypeMap[loopKey || this._getLoopKey()] = subLoopType

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
    _getLoopStepPathString(loopStepPath, loopStepKeyPath) {
        const _loopStepPath = loopStepPath || this.loopStepPath
        const _loopStepKeyPath = loopStepKeyPath || this.loopStepKeyPath
        const zipLimit = Math.min(_loopStepPath.length, _loopStepKeyPath.length);
        let index = 0;
        let keys = []
        while (index < zipLimit) {
            keys.push(_loopStepKeyPath[index])
            keys.push(_loopStepPath[index]);
            index++;

        }
        while (index < loopStepKeyPath.length) {
            keys.push(_loopStepKeyPath[index]);
            index++
        }
        while (index < loopStepPath.length) {
            keys.push(_loopStepPath[index]);
            index++
        }

        return keys.join(PATH_DElIMITER);
    }
    /**
     * 
     * @param {string} stepPathString 
     */
    _parseLoopStepPath(stepPathString) {
        return stepPathString.split(PATH_DElIMITER).map(parseInt)

    }
    _getUpperLoopPath() {
        return this._getLoopStepPathString(this.loopStepPath.slice(0, -1), this.loopStepKeyPath.slice(0, -1))
    }
    _getLoopKey() {


        return this._getLoopStepPathString(this.loopStepPath.slice(0, -1), this.loopStepKeyPath.s);

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

        this.loopStepMap[loopStepPath] = { builderID, options: _options, subLoops: {} }
        const upperStatePath = this._getUpperLoopPath();
        const subLoopKey = this.loopStepKeyPath[this.loopStepKeyPath.length - 1];
        const subLoopData = this.loopStepMap[upperStatePath].subLoops[subLoopKey]
        subLoopData.count = (subLoopData.count || 0) + 1;


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
     * @param {string?} subLoopKey
     */
    startSubLoop(subLoopType, subLoopKey = '') {

        this.loopStepPath.push(-1)
        this.loopStepKeyPath.push(subLoopKey)
        this._setSubLoopType(subLoopType)
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

        const upperLoopPath = this._getUpperLoopPath()
        const upperLoop = this.loopStepMap[upperLoopPath]


        if (this.loopStepPath.length !== 1) {

            const loopState = upperLoop.subLoops[this.loopStepKeyPath[this.loopStepKeyPath - 1]]
            if (loopState.type === 'selection') {

                isSubLoopOut = true;

            }
            if (loopState.type === 'loop') {



                isSubLoopOut = loopState.count <= step;


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

            isEnd = this === this.loopStepPath[0];

        }

        this.positionState = { isEnd, isSubLoopOut }
        return this.getNow();
    }
    back() {
        const tailIndex = this.loopStepPath.length - 1;
        const nextStep = this.loopStepPath[tailIndex] - 1;
        let isSubLoopOut = false;
        if (this.loopStepPath.length !== 1) {

            const parentloopStepPath = this._getUpperLoopPath();
            const parentLoopStep = this.loopStepMap[parentloopStepPath];

            if (parentLoopStep.subLoopType === 'selection') {

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
        return builderConfig.builder(loopStep.options, this._language, this._i18n)
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