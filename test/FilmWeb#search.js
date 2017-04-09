/* eslint-env node, mocha */

const assert = require('chai').assert;

const filmwebFactory = require('..');
const {waitForEmptyQueue} = require('../lib/delayUtils');

const {login, password} = require('./lib/credentials');

const BAD_QUERY = 'sldjfslkdjf';
const GOOD_QUERY = 'star wars';
const PRECISE_QUERY = 'star wars new hope';

const TIMEOUT = 40000;
const AUTH_TIMEOUT = 40000;

describe('FilmWeb#search()', function () {
    var filmweb;

    this.slow(10000);
    this.timeout(TIMEOUT);

    beforeEach(function () {
        this.timeout(120000);
        waitForEmptyQueue();
    });

    before(function createInstance () {
        filmweb = filmwebFactory.createInstance();
    });

    after(function () {
        filmweb.destroy();
    });


    describe('with nonsense query', function () {
        var searchPromise;
        before(function getResults () {
            searchPromise = filmweb.search(BAD_QUERY);
        });

        it('should not return any results', function () {
            return searchPromise
                .then(({total}) => {
                    if (0 !== total)
                    {
                        throw new Error(`Got ${total} results.`);
                    }
                });
        });
    });

    describe('with sensible query', function () {
        var searchPromise;
        before(function getResults () {
            searchPromise = filmweb.search(GOOD_QUERY);
        });

        it('should return results', function () {
            return searchPromise;
        });

        it('should return more than 5 pages of results', function () {
            return searchPromise
                .then(({totalPages}) => assert.isAbove(totalPages, 5));
        });

        it('all results [on the page] should contain search query', function () {
            var titleRegExp = new RegExp(GOOD_QUERY, 'i');
            return searchPromise
                .then(({items}) => {
                    items.forEach(item => {
                        assert.match(
                            [item.title]
                                .concat(item.alternativeTitles.map(title => title.value))
                                .join('\0'),
                            titleRegExp
                        );
                    });
                });
        });
    });

    describe('first element of search result', function () {
        const EXPECTED_PROPS = [
            'url', 'title', 'year', 'posterUrl',
            'ratings', 'alternativeTitles', 'directors', 'cast',
        ];
        var result;
        before(function getResults () {
            return filmweb.search(PRECISE_QUERY)
                .then(({items: [firstResult]}) => { result = firstResult; } );
        });

        for (let prop of EXPECTED_PROPS)
        {
            it('should contain ' + prop, function () {
                assert(prop in result);
            });
        }

        it('should contain average rating', function () {
            assert('average' in result.ratings);
        });

        it('should have some directors', function () {
            assert.isAbove(result.directors.length, 0);
        });

        it('should have url and name in first director', function () {
            assert('url' in result.directors[0]);
            assert('name' in result.directors[0]);
        });

        it('should have some cast', function () {
            assert.isAbove(result.directors.length, 0);
        });

        it('should have url and name in first cast member', function () {
            assert('url' in result.cast[0]);
            assert('name' in result.cast[0]);
        });
    });

    describe('with sensible query on authenticated instance', function () {
        var searchPromise;

        this.timeout(AUTH_TIMEOUT + TIMEOUT);

        before(function getResults () {
            this.timeout(AUTH_TIMEOUT);
            searchPromise = filmweb
                .authenticate(login, password)
                .then(() => filmweb.search(GOOD_QUERY));
        });

        it('should contain user rating data when authenticated', function () {
            this.timeout(TIMEOUT);
            return searchPromise.then(({items}) => {
                items.forEach(item => {
                    if (! ('user' in item.ratings))
                    {
                        throw Error('Missing user rating data.');
                    }
                });
            });
        });
    });
});
