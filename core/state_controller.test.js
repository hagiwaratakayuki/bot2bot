const assert = require('node:assert');
const { StateContoller } = require('./state_controller')


describe('Executer', function () {

    it('execute first', function () {
        const controlller = new StateContoller(StateEmitter, History);
        controlller._func = function () {
            console.log('ok');
        }
        controlller.run();


    });

});