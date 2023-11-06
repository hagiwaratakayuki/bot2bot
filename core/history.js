

class History {

    constructor() {

        this._histories = [[]];
        this._historyId = 0;
        this._cursor = -1;
        /**
         * @type {{[historyId: any]: {fromID:any, nodeId:any}}}
         */
        this._branchStarts = {};
        /**
         * @type {{[historyId: any]: {[pointId: any]: any[]}}}
         */
        this._branchTree = {};
        /**
         * @type {{[historyId:any]: {cursor:any, name:any}[] }}
         */
        this._breakPointsList = {}

    }
    fromJSON(jsonData) {
        for (const key of Object.keys(this)) {
            if (key.indexOf('_') !== 0) {
                continue;
            }
            const proptype = typeof this[key];
            if (proptype === 'function' || proptype === 'undefined') {
                continue
            }
            this[key] = jsonData[key]
        }

    }
    push(data) {
        const nowHistory = this._getNowHistory();
        nowHistory.push(data);
        this._cursor = nowHistory.length - 1

    }
    startBranch(data) {
        const branch = this._getNowHistory().concat([data]);
        this._initBranch(branch);







    }
    _initBranch(branch) {
        this._histories.push(branch);
        const newHistoryId = this._historyId + 1;
        this._branchStarts[newHistoryId] = this._cursor;
        const branchPointsMap = this._branchTree[this._historyId] || {}
        const branchPoints = branchPointsMap[this._cursor] || []
        branchPoints.push(newHistoryId);
        branchPointsMap[this._cursor] = branch
        this._branchTree[this._historyId] = branchPointsMap;
        this._historyId = newHistoryId
    }
    setBreakPoint(name) {
        const breakpoints = this._breakPointsList[this._historyId] || [];
        breakpoints.push({ name, cursor: this._cursor })
        this._breakPointsList[this._historyId] = breakpoints

    }
    /**
     * 
     * @param {any} name 
     * @returns {false | any}
     */
    _getBreakpointCursorBack(name) {
        const breakpoints = this._breakPointsList[this._historyId] || [];
        let index = breakpoints.length - 1;
        while (index > -1) {
            const breakpoint = breakpoints[index];
            if (breakpoint.cursor <= this._cursor && breakpoint.name === name) {
                return breakpoint.cursor;
            }
            index--;

        }
        return false;
    }

    _getNowHistory() {
        this._histories[this._historyId];
    }



}
module.exports = { History }