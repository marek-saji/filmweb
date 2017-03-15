/* eslint-env node, mocha */

const filmwebFactory = require('..');
const {waitForEmptyQueue} = require('../lib/delayUtils');

const {login, password} = require('./lib/credentials');

describe('FilmWeb#authenticate()', function () {
    this.slow(20000);
    this.timeout(30000);

    beforeEach(function () {
        this.timeout(120000);
        waitForEmptyQueue();
    });

    describe('with valid credentials', function () {
        var filmweb;

        before(function () {
            filmweb = filmwebFactory.createInstance();
        });

        after(function () {
            filmweb.destroy();
        });

        it('should succeed', function () {
            return filmweb.authenticate(login, password);
        });
    });

    describe('with invalid credentials', function () {
        var filmweb;

        before(function () {
            filmweb = filmwebFactory.createInstance();
        });

        after(function () {
            filmweb.destroy();
        });

        it('should fail', function () {
            return filmweb.authenticate('login', 'password')
                .then(
                    () => Promise.reject(),
                    () => Promise.resolve()
                );
        });
    });

    describe('with valid credentials on already authenticated instance', function () {
        it.skip('should fail');
    });
});
