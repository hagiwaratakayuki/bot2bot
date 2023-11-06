
const merge = require('deepmerge');
const { JSONSerializer } = require('../json_serialize')
/**
 * @typedef {import('./save_and_load_config').BuilderConfigMap} BuilderConfigMap

 */

const TOPKEY = '';

class Brige extends JSONSerializer {

    constructor() {
        super();

        /**
         * @type {BuilderConfigMap}
         */
        this.builderConfigMap = {};
        this.resetPosition();

        /**
         * @type {{[loopStepPath: string]: import('./save_and_load_config').LoopStep}}
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
    /**
    * 
    * @param {BuilderConfigMap} builderConfigMap 
    */
    builderRegistration(builderConfigMap) {
        this.builderConfigMap = Object.assign(this.builderConfigMap, builderConfigMap);
    }
    toJSON() {
        return this._toJSON(["builderConfigMap"]);
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
    addLoopStep(builderID, options) {
        this.loopStepPath[this.loopStepPath.length - 1] += 1;
        const { options: basicOptions, mergeFunction = this._defaultMerge } = this.builderConfigMap[builderID]
        let _options
        if (options && basicOptions) {
            _options = mergeFunction(basicOptions || {}, options)
        }
        else if (options) {
            _options = options
        }
        const loopStepPath = this._getLoopStepPathString();

        this.loopStepMap[loopStepPath] = { builderID, options: _options }
        const key = this._getStepCountKey();
        this._stepCountMap[key] = (this._stepCountMap[key] || 0) + 1;



    }
    /**
     * 
     * @param {import('./save_and_load_config').SubLoopType?} subLoopType
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
    constructor() {
        super();
        this.positionState = { isEnd: false, isSubLoopOut: false }
    }
    fromJSON(jsonData) {
        super.fromJSON(jsonData);
        this.resetPosition()
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
        const now = this.getNow();
        this.positionState = { isEnd, isSubLoopOut }
        return { now, isEnd, isSubLoopOut }
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
        return this.getNow()


    }
    getNow() {
        const loopStepPath = this._getLoopStepPathString();
        return this.loopStepMap[loopStepPath]
    }
    /**
     * 
     * @param {import('./save_and_load_config').LoopStep} loopStep 
     */
    buildStep(loopStep) {
        const builderConfig = this.builderConfigMap[loopStep.builderID];
        return builderConfig.builder(builderConfig.options)
    }
    /**
     * @typedef {import('./save_and_load_config').DocumentLoader} DocumentLoader
     * @param {import('./save_and_load_config').LoopStep} loopStep
     * @param {string} language 
     * @param {Array<keyof DocumentLoader>} targets
     * @returns {import('./save_and_load_config').Document} 
     */
    getDocument(loopStep, language, targets = ['title', 'description']) {

        const ret = {};

        const { documentLoader, options } = this.builderConfigMap[loopStep.builderID];
        for (const target of targets) {
            ret[target] = documentLoader[target](language, options);
        }
        return ret;


    }
    /**
    * 
    * @param {import('./save_and_load_config').LoopStep[]} loopSteps
    * @param {string} language 
    * @param {Array<keyof DocumentLoader>} targets
    * @returns {import('./save_and_load_config').Document[]} 
    */
    getDocumentList(loopSteps, language, targets = ['title', 'description']) {
        const ret = [];
        for (const loopStep of loopSteps) {
            ret.push(this.getDocument(loopStep, language, targets))
        }
        return ret;
    }
}


module.exports = { Saver, Loader };