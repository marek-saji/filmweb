/* eslint-disable no-console */

const filmweb = require('./index').createInstance();

const query = 'the room';
const rating = ~~(Math.random()*9)+1;
const review = rating + '½';

var credentials;

try
{
    credentials = require('./credentials');
}
catch (error)
{
    process.stderr.write('Create credentials.json with {password, login} to run tests.\n');
    process.exit(1);
}


Promise.resolve()
    .then(() => filmweb.search(query))
    .then(({items: [result]}) => {
        console.log(result.title, 'avg. rating is', result.ratings.average);
    })
    .then(() => filmweb.authenticate(credentials.login, credentials.password))
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
