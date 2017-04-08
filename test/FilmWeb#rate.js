/* eslint-env node, mocha */

const filmwebFactory = require('..');
const {waitForEmptyQueue} = require('../lib/delayUtils');

const {login, password} = require('./lib/credentials');
const MOVIE_URL = 'http://www.filmweb.pl/film/Scott+Pilgrim+kontra+%C5%9Bwiat-2010-220748';
const REVIEW = 'Superb!';
const OTHER_REVIEW = 'Marvelous!';

describe('FilmWeb#rate()', function () {
    var filmweb;

    this.slow(40000);
    this.timeout(60000);

    beforeEach(function () {
        this.timeout(120000);
        waitForEmptyQueue();
    });

    before(function createInstance () {
        filmweb = filmwebFactory.createInstance();
        return filmweb.authenticate(login, password);
    });

    after(function () {
        filmweb.destroy();
    });


    describe('on unrated movie', function () {
        before(function () {
            return filmweb.removeRating(MOVIE_URL);
        });

        it('should succeed', function () {
            return filmweb.rate(MOVIE_URL, 9);
        });

        it.skip('should set rating');

        it.skip('should not set review');
    });

    describe('on already rated movie', function () {
        before(function () {
            return filmweb.rate(MOVIE_URL, 9);
        });

        it('should succeed', function () {
            return filmweb.rate(MOVIE_URL, 10);
        });

        it.skip('should set rating');

        it.skip('should not set review');
    });

    describe('on already rated movie with the same value', function () {
        before(function () {
            return filmweb.rate(MOVIE_URL, 10);
        });

        it('should succeed', function () {
            return filmweb.rate(MOVIE_URL, 10);
        });

        it.skip('should set rating');

        it.skip('should not set review');
    });

    describe('on already rated and reviewed movie', function () {
        before(function () {
            return filmweb.rate(MOVIE_URL, 10, REVIEW);
        });

        it('should succeed', function () {
            return filmweb.rate(MOVIE_URL, 10);
        });

        it.skip('should set rating');

        it.skip('should not remove review');
    });

    describe('with review on unrated movie', function () {
        before(function () {
            return filmweb.removeRating(MOVIE_URL);
        });

        it('should succeed', function () {
            return filmweb.rate(MOVIE_URL, 10, REVIEW);
        });

        it.skip('should set rating');

        it.skip('should set review');
    });

    describe('with review on already rated movie', function () {
        before(function () {
            return filmweb.rate(MOVIE_URL, 9);
        });

        it('should succeed', function () {
            return filmweb.rate(MOVIE_URL, 10, REVIEW);
        });

        it.skip('should set rating');

        it.skip('should set review');
    });

    describe('with review on already rated and reviewed movie', function () {
        before(function () {
            return filmweb.rate(MOVIE_URL, 10, REVIEW);
        });

        it('should succeed', function () {
            return filmweb.rate(MOVIE_URL, 10, OTHER_REVIEW);
        });

        it.skip('should set rating');

        it.skip('should set review');
    });
});
