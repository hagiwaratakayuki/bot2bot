
const { JSONSerializer } = require('./json_serializer')

class Context extends JSONSerializer {
    /**
     * @typedef {import('./history').History} History
     * @param {History} history 
     */
    constructor(history) {
        super();
        this.globalData = {}

        this.loopDatas = []
        this.datas = []
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
    fromJSON(jsonData) {
        super.fromJSON(jsonData);
        this._resumeLoop()

    }

    loopIn() {
        const loopData = {}
        this.loopData = loopData;
        this.loopDatas.push(loopData);
        this.subLoopData = null
        this.data = {};
        this.datas.push(this.data)
    }
    loopOut() {
        this.subLoopData = this.loopDatas.pop()
        this.loopData = this.loopDatas[this.loopDatas.length - 1]
        this.datas.pop()
        this.data = this.datas[this.datas.length - 1]

    }
    _resumeLoop() {
        this.loopData = this.loopDatas[this.loopDatas.length - 1]
        this.data = this.datas[this.datas.length - 1]
    }

    moveLoop(data) {
        this.data = {}
        this.datas[this.datas.length - 1] = this.data
    }

}

module.exports = { Context }