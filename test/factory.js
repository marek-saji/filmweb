/* eslint-env node, mocha */

const assert = require('assert');

const filmwebFactory = require('..');
const FilmWeb = require('../lib/class.FilmWeb');
const {waitForEmptyQueue} = require('../lib/delayUtils');

describe('factory', function () {

    beforeEach(function () {
        this.timeout(120000);
        waitForEmptyQueue();
    });

    describe('#createInstance()', function () {
        it('should return a new instance of FilmWeb class', function () {
            let instance = filmwebFactory.createInstance();
            assert(instance instanceof FilmWeb);
            instance.destroy();
        });
    });
});
