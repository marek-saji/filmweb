/* eslint-disable no-console */

const filmweb = require('./index').createInstance();

const LOGIN = process.env.npm_package_config_test_login;
const PASSWORD = process.env.npm_package_config_test_password;

const query = 'the room';
const rating = ~~(Math.random()*9)+1;
const review = rating + '½';

Promise.resolve()
    .then(() => filmweb.search(query))
    .then(({items: [result]}) => {
        console.log(result.title, 'avg. rating is', result.ratings.average);
    })
    .then(() => filmweb.authenticate(LOGIN, PASSWORD))
    .then(() => filmweb.search(query))
    .then(({items: [result]}) => {
        console.log('User’s rating:', result.ratings.user);
        return filmweb.rate(result.url, rating, review);
    })
    .then(() => filmweb.search(query))
    .then(({items: [result]}) => {
        console.log('User’s new rating:', result.ratings.user);
        if (result.ratings.user !== rating)
        {
            throw 'Rating does not seem to be working.';
        }
    })
    .catch(error => { console.error(error); process.exit(1); })
    .then(() => console.log('All is fine.'));
