
const { JSONSerializer } = require('./json_serializer')

class Context extends JSONSerializer {
    /**
     * @typedef {import('./history').History} History
     * @param {History} history 
     */
    constructor(history) {
        super();
        this._globalData = {}

        this._loopDatas = []
        this._datas = []
        /**
         * @type {History}
         */
        this.history = history

    }
    toJSON() {
        /**
         * @type {Array<keyof Context>} 
         * 
         */
        const filter = ['data', 'loopData', 'history'];
        return this._toJSON(filter);
    }


    forwardToSub() {
        this.setLoopData({})
        this._subLoopData = null

        this._datas.push({})
    }
    returnFromSub() {
        this._subLoopData = this._loopDatas.pop()
        this._datas.pop()

    }


    moveLoop() {

        this.setData({})
    }
    getGlobalData() {
        return this._globalData
    }
    setGlobalData(data) {
        this._globalData = data;
    }
    getData() {
        return this._datas[this._datas.length - 1]
    }
    setData(data) {
        this._datas[this._datas.length - 1] = data
    }
    getLoopData() {
        return this._loopDatas[this._loopDatas.length - 1]
    }
    setLoopData(data) {
        this._loopDatas[this._loopDatas.length - 1] = data
    }
    getSubLoopData() {
        return this._subLoopData
    }


}

module.exports = { Context }