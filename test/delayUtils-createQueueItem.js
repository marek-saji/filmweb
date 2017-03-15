/* eslint-env node, mocha */

const assert = require('assert');
const {createQueueItem} = require('../lib/delayUtils');

describe('delayUtils/createQueueItem()', function () {

    this.timeout(60000);

    it('should queue items', function () {
        let result = [];
        let items = [0,1,2].map(() => createQueueItem());
        return Promise.all([
            items[0].waitForItsTurn
                .then(() => { result.push(0); })
                .then(items[0].done),
            items[1].waitForItsTurn
                .then(() => { result.push(1); })
                .then(items[1].done),
            items[2].waitForItsTurn
                .then(() => { result.push(2); })
                .then(items[2].done),
        ]).then(() => { assert.deepEqual(result, [0,1,2]); });
    });

    it('should queue chained items', function () {
        let result = [];
        let items = [0,1,2].map(() => createQueueItem());
        return Promise.all([
            items[0].waitForItsTurn
                .then(() => { result.push(0); })
                .then(items[0].done),
            items[1].waitForItsTurn
                .then(() => { result.push(1); })
                .then(items[1].done)
                .then(items[2].waitForItsTurn)
                .then(() => { result.push(2); })
                .then(items[2].done),
        ]).then(() => { assert.deepEqual(result, [0,1,2]); });
    });

});
