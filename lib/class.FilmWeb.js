const AUTH_URL = 'https://ssl.filmweb.pl/login';
const BASE_URL = 'http://www.filmweb.pl';

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';

const webdriver = require('selenium-webdriver');
const phantomjsPath = require('phantomjs-prebuilt').path;
const phantomjsCapabilities = webdriver.Capabilities.phantomjs();

const log = require('./log');
const {simulateHumanDelay, throttleRequest} = require('./delayUtils');

const browsers = new WeakMap;
const logins = new WeakMap;


phantomjsCapabilities.set('phantomjs.binary.path', phantomjsPath);
phantomjsCapabilities.set('phantomjs.page.settings.userAgent', USER_AGENT);



function exitHandler ()
{
    let browser = browsers.get(this);
    if (browser)
    {
        log(2, 'Quit a browser');
        browser.quit();
        browsers.delete(this);
    }
}

function bootstrap (url)
{
    let browser = browsers.get(this);

    if (! browser)
    {
        return Promise.reject(new Error('Missing browser instance.'));
    }
    else if (url)
    {
        return browser.goToUrl(url);
    }
    else
    {
        return Promise.resolve();
    }
}

function createBrowser ()
{
    log(2, 'Create new browser');

    let browser = new webdriver.Builder()
        .withCapabilities(
            // Overwriteable with SELENIUM_BROWSER env variable
            phantomjsCapabilities
        )
        .build();

    browser.goToUrl =
        (url) => throttleRequest().then(() => browser.get(url));

    browser.querySelector =
        (selector) => browser.findElement(webdriver.By.css(selector));

    browser.querySelectorAll =
        (selector) => browser.findElements(webdriver.By.css(selector));

    browser.waitUntilElementLocated =
        (selector, timeout, failMessage) => browser.wait(webdriver.until.elementLocated(webdriver.By.css(selector)), timeout, failMessage);

    browsers.set(this, browser);

    // Clean up on exit
    process.on('exit', exitHandler.bind(this));
}

// This function will be serialized.
// Do not use any fancy syntax.
function searchDataCollector (context)
{
    var results = {items: []};
    var list;

    var query = function (context, selector) {
        var element = context.querySelector(selector);
        return element || {};
    };

    if (context.querySelector('.searchNoResults'))
    {
        results.total = 0;
        results.page = 0;
        results.totalPages = 0;
    }
    else
    {
        results.nav = context.querySelector('#searchPaginator .config').textContent;

        list = context.querySelector('.resultsList');
        Array.prototype.forEach.call(list.children, function (listItem) {
            var queryListItem = query.bind(null, listItem);
            var result = {};
            var subList;

            result.url = queryListItem('a.hitTitle').href;
            result.title = queryListItem('a.hitTitle').textContent;
            result.year = queryListItem('a.hitTitle ~ .hitTitle').textContent;
            result.posterUrl = queryListItem('.hitImage img').src;

            result.ratingValue = queryListItem('.rateInfo strong').textContent;
            result.ratingUser = queryListItem('.ribbonButton strong').textContent;

            result.titles = [];
            subList = queryListItem('.sep-line').children;
            Array.prototype.forEach.call(subList, function (subItem) {
                if (! subItem.querySelector('ul'))
                {
                    result.titles.push(subItem.textContent);
                }
            });

            result.directors = [];
            result.cast = [];
            subList = queryListItem('.filmInfo');
            Array.prototype.forEach.call(subList, function (subItem) {
                var peopleList;
                if (/reżyser/i.test(subItem.textContent))
                {
                    subList.activeContainer = results.directors;
                }
                else if (/obsada/i.test(subItem.textContent))
                {
                    subList.activeContainer = results.cast;
                }
                else if (subList.activeContainer)
                {
                    peopleList = query(subItem, 'a');
                    Array.prototype.forEach.call(peopleList, function (person) {
                        subList.activeContainer.push({
                            url: person.href,
                            name: person.textContent,
                        });
                    });
                }
            });

            results.items.push(result);
        });
    }

    return results;
}

function collectSearchResults (element)
{
    let browser = browsers.get(this);
    return browser.executeScript(searchDataCollector, element);
}

function formatRawSearchResults (rawResults)
{
    let results = {
        total: rawResults.total,
        page: rawResults.page,
        totalPages: rawResults.totalPages,
    };

    if (rawResults.nav)
    {
        let rawResultsNav = JSON.parse(rawResults.nav);

        results.total = rawResultsNav.countItems;
        results.page = rawResultsNav.activePage;
        results.totalPages = rawResultsNav.totalPages;
    }

    results.items = rawResults.items.map(formatRawSearchResultItem);

    return results;
}

function formatRawSearchResultItem (rawItem)
{
    let result = {};
    let value;

    result.url = rawItem.url.trim();
    result.title = rawItem.title.trim();
    result.year = rawItem.year.trim().replace(/[()]/g, '');
    result.posterUrl = rawItem.posterUrl.trim();

    result.ratings = {};
    value = parseFloat((rawItem.ratingValue || '').replace(',', '.'));
    result.ratings.average = value || undefined;
    value = parseInt(rawItem.ratingUser, 10);
    result.ratings.user = value || null;

    result.alternativeTitles = rawItem.titles.map(formatRawSearchResultsTitle);
    result.directors = rawItem.directors.map(formatRawSearchResultsPerson);
    result.cast = rawItem.cast.map(formatRawSearchResultsPerson);

    if (rawItem.hasOwnProperty('debug'))
    {
        result.debug = rawItem.debug;
    }

    return result;
}

function formatRawSearchResultsTitle (rawTitle)
{
    const parts = rawTitle.trim().split(' : ');
    const title = {
        value: parts[0],
        countries: [],
    };
    const types = [];

    for (let i = 1; i < parts.length; i += 1)
    {
        let value = parts[i].trim();
        let match = value.match(/^\((.*)\)$/);
        if (match)
        {
            types.push(match[1]);
        }
        else
        {
            title.countries.push(value.replace(/[\/ ]*$/, ''));
        }
    }

    // I haven’t seen any titles with multiple types specified, so we
    // return this as a string, but to support that case, we collect all
    // types and return them.
    if (types.length)
    {
        title.type = types.join(', ');
    }

    return title;
}

function formatRawSearchResultsPerson (rawPerson)
{
    let person = {};
    person.url = rawPerson.url.trim();
    person.name = rawPerson.name.trim();
    return person;
}

function normalizeRatingValue (value)
{
    if (! value)
    {
        value = null;
    }
    else
    {
        value = parseInt(value, 10);
    }
    return value;
}

function normalizeReviewValue (value)
{
    if (value === undefined || value === null)
    {
        value = '';
    }
    else
    {
        value = '' + value;
    }
    return value;
}

function rate (url, value, review)
{
    if (! this.isAuthenticated())
    {
        return Promise.reject(new Error('Rate method can only be used on authenticated object.'));
    }

    let browser = browsers.get(this);

    value = normalizeRatingValue(value);
    review = normalizeReviewValue(review);

    return bootstrap.call(this, url)
        .then(() => browser.waitUntilElementLocated('#filmVoteRatingPanel .rateButtons [data-index]'))
        .then(simulateHumanDelay)
        .then(() => browser.querySelector('#filmVoteRatingPanel .rateButtons').getAttribute('data-rate'))
        .then(normalizeRatingValue)
        .then(currentRating => {
            let promise = Promise.resolve(true);

            if (value === null && currentRating !== null)
            {
                promise = promise
                    .then(simulateHumanDelay)
                    .then(() => browser.querySelector('#filmVoteRatingPanel .rateButtons [data-index="' + currentRating + '"]').click())
                    .then(() => browser.waitUntilElementLocated('#filmVoteRatingPanel .rateButtons:not([data-rate])'));
            }
            else if (value !== currentRating)
            {
                promise = promise
                    .then(simulateHumanDelay)
                    .then(() => browser.querySelector('#filmVoteRatingPanel .rateButtons [data-index="' + value + '"]').click())
                    .then(() => browser.waitUntilElementLocated('#filmVoteRatingPanel .rateButtons[data-rate="' + value + '"]'));
            }

            if (value !== null)
            {
                promise = promise
                    .then(simulateHumanDelay)
                    .then(() => browser.querySelector('#filmVoteRatingPanel .commentArea').getText())
                    .then(normalizeReviewValue)
                    .then(currentReview => {
                        if (currentReview !== review)
                        {
                            return browser.querySelector('#filmVoteRatingPanel .commentArea').clear()
                                .then(() => browser.querySelector('#filmVoteRatingPanel .commentArea').sendKeys(review))
                                .then(() => browser.querySelector('#filmVoteRatingPanel .saveComment').click())
                                // Wait until comment is saved
                                .then(simulateHumanDelay)
                                .then(() => browser.waitUntilElementLocated('.filmVoteRatingPanelWrapper:not(.commonLoader)'));
                        }
                    });
            }

            return promise;
        });
}


class FilmWeb
{
    constructor ()
    {
        createBrowser.call(this);
    }

    isAuthenticated ()
    {
        return !! this.getLogin();
    }

    getLogin ()
    {
        return logins.get(this);
    }

    destroy ()
    {
        log(2, 'Destroy a browser');
        let browser = browsers.get(this);
        browser.quit();
        browsers.delete(this);
        logins.delete(this);
    }

    search (query, page=1)
    {
        log(1, 'search called', {query, page});

        let browser = browsers.get(this);
        let urlQuery = encodeURIComponent(query);
        page = parseInt(page, 10);
        let url = BASE_URL + '/search?q=' + urlQuery + '&page=' + page;

        return bootstrap.call(this, url)
            .then(() => browser.waitUntilElementLocated('.newPaginator, .searchNoResults'))
            .then(() => browser.querySelector('.mainCol'))
            .then(collectSearchResults.bind(this))
            .then(formatRawSearchResults)
            .catch(error => {
                log(2, 'search failed', error);
                throw error;
            })
            .then((results) => {
                log(2, 'search finished', {query, page});
                log(4, 'results for FilmWeb.search', {query, page}, ':', results);
                return results;
            });
    }

    authenticate (login, password)
    {
        log(1, 'authenticate called', {login, password: '*****'});

        let browser = browsers.get(this);

        logins.set(this, login);

        return bootstrap.call(this, AUTH_URL)
            .then(simulateHumanDelay)
            .then(() => {
                browser.querySelector('[name=j_username]').sendKeys(login);
                browser.querySelector('[name=j_password]').sendKeys(password);
                browser.querySelector('[type=submit]').click();
            })
            .then(() => browser.waitUntilElementLocated('.loggedUserInfo', 2000))
            .catch(error => {
                log(2, 'authenticate failed', error);
                throw error;
            })
            .then(() => log(2, 'authenticate finished', {login}));
    }


    rate (url, value, review)
    {
        log(1, 'rate called', {url, value, review});

        rate.apply(this, arguments)
            .catch(error => {
                log(2, 'rate failed', {error});
                throw error;
            })
            .then(() => log(2, 'rate finished', {url, value, review}));
    }


    removeRating (url)
    {
        log(1, 'removeRating called', {url});

        return rate.apply(this, arguments)
            .catch(error => {
                log(2, 'removeRating failed', error);
                throw error;
            })
            .then(() => log(2, 'removeRating finished', {url}));
    }
}

// Call process.exit when killed with signals to trigger cleanup
process.on('SIGINT', () => process.exit(1));
process.on('SIGHUP', () => process.exit(1));
process.on('SIGQUIT', () => process.exit(1));
process.on('SIGTERM', () => process.exit(1));

module.exports = FilmWeb;
