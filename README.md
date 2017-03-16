filmweb
=======

A webdriver-powered FilmWeb.pl “API” library.

[![Build Status](https://travis-ci.org/marek-saji/filmweb.svg?branch=master)](https://travis-ci.org/marek-saji/filmweb)


Usage
-----

```js
const filmwebFactory = require('./…/filmweb');

const filmwebUnauth = filmwebFactory.createInstance();
const filmwebAuth = filmwebFactory.createInstance();

filmwebUnauth.search('star wars')
    .then(result => {
        console.log('Found', result.total, 'items.');
        console.log(
            'First one is',
            result.items[0].title,
            result.items[0].url
        );
    });

filmwebAuth.authenticate(login, password)
    .then(() => filmwebAuth.search('star wars'))
    .then(result => result.items[0].url)
    .then(url => filmwebAuth.rate(url, 10))
    .then(() => console.log('rated.'));
```

`filmweb` uses `selenium-webdriver`. By default `phantomjs` is used,
but that can be changed with `SELENIUM_BROWSER` environment variable.
When installed with dev dependencies, `chrome` driver is also available.


Factory methods
---------------

- `createInstance()`

  Create a new instance with separate session and caching.


Intance methods
---------------

All return a promise.

If you do not need user’s rating data, use `search` and `getInfo`
methods without authentication. This will use better caching.

- `destroy()`

  When you are done with a instance, call this to quit an underlying
  browser. After this instance is not usable anymore.
  All browsers quit automatically when script ends.

- `authenticate(login, password)`

  Returns new object, which uses authenticated session.

- `search(query, fields, page=1)`

  Does not require authentication, but when authenticated will include
  user’s rating.

- `rate(url, rating, note=null)`

- `removeRating(url)`


Configuration
-------------

We use npm config for options, which means you can can:

- use `npm config set filmweb:<OPTION_NAME>=<OPTION_VALUE>`
- create `.npmrc` file in package’s directory with line
  `filmweb:<OPTION_NAME>=<OPTION_VALUE>`,

For more information about npm config, see their
[documentation](https://docs.npmjs.com/misc/config).

You can inspect options’ default values in
[`package.json`](./package.json).


### `verbosity`

Logging verbosity. “0” disables logging. See
[`lib/log.js`](./lib/log.js) for possible values.

### `human_delay` and `human_delay_deviation`

Delay that simulates human interaction. Both values are in miliseconds.
First is base value to which random value between -<deviation> and
+<deviation> is added.

### `request_throttle` and `request_throttle_deviation`

Delay between requests to avoid being banned by FilmWeb.
Works on the same principle as `human_delay` and it’s deviation.
