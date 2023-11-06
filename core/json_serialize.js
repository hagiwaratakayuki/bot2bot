class JSONSerializer {
    toJSON() {
        return this._toJSON();
    }
    /**
     * 
     * @param {string[]} filters 
     * @returns {any}
     */
    _toJSON(filters = []) {
        const ret = {};
        const isExecuteFilter = filters.length !== 0;
        const filterIndex = Object.fromEntries(filters.map(function (k) {
            return [k, true];
        }))
        for (const key in this) {
            if (isExecuteFilter === true && key in filterIndex) {
                continue;
            }
            const element = this[key];
            const elementType = typeof element;
            if (elementType === 'undefined' || elementType === 'function') {
                continue;
            }
            ret[key] = element;

        }
        return ret;

    }

    /**
      * 
      * @param {Object} jsonData 
      */
    fromJSON(jsonData) {
        for (const key in jsonData) {

            const prop = this[key]
            const data = jsonData[key];
            if (typeof prop === 'object' && 'fromJSON' in prop) {
                this[key].fromJSON(data);
            }
            else {
                this[key] = data;
            }


        }


    }
}

module.exports = { JSONSerializer }