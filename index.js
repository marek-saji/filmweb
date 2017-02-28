require('./lib/check-runtime');

const FilmWeb = require('./lib/class.FilmWeb');

function createInstance ()
{
    return new FilmWeb;
}

module.exports = {
    createInstance,
};
