/* eslint-env node, mocha */

const filmwebFactory = require('..');
const {waitForEmptyQueue} = require('../lib/delayUtils');

const {login, password} = require('./lib/credentials');
const MOVIE_URL = 'http://www.filmweb.pl/film/Scott+Pilgrim+kontra+%C5%9Bwiat-2010-220748';
const REVIEW = 'Superb!';

describe('FilmWeb#removeRating()', function () {
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


    describe('on a rated movie', function () {
        before(function () {
            return filmweb.rate(MOVIE_URL, 9);
        });

        it('should succeed', function () {
            return filmweb.removeRating(MOVIE_URL);
        });

        it.skip('should clear rating and review');
    });

    describe('on a rated and reviewed movie', function () {
        before(function () {
            return filmweb.rate(MOVIE_URL, 9, REVIEW);
        });

        it('should succeed', function () {
            return filmweb.removeRating(MOVIE_URL);
        });

        it.skip('should clear rating and review');
    });

    describe('on unrated movie', function () {
        before(function () {
            return filmweb.removeRating(MOVIE_URL);
        });

        it('should succeed', function () {
            return filmweb.removeRating(MOVIE_URL);
        });

        it.skip('should clear rating and review');
    });
});
