const verbosity = + process.env.npm_package_config_verbosity + 0;

const SUPPORTS_256_COLORS =
    /256/.test(process.env.TERM) ||
    'Apple_terminal' === process.env.TERM_PROGRAM ||
    'iTerm' === process.env.TERM_PROGRAM ||
    'Hyper' === process.env.TERM_PROGRAM;

function getColourFfixes (level)
{
    let prefix, suffix;
    if (SUPPORTS_256_COLORS)
    {
        let levelColour = 250 - (level-1) * 7;
        prefix = '\x1b[38;5;' + levelColour + 'm';
        suffix = '\x1b[m';
    }
    else
    {
        prefix = '';
        suffix = '';
    }

    return {prefix, suffix};
}

// level=1: api method calls
// level=2: browsers’ lifecycle, api method failures and finishes
// level=3: waiting and other intermediate steps
// level=4: full result data and full wait data
function log (level, ...argv)
{
    if (level <= verbosity)
    {
        let {prefix, suffix} = getColourFfixes(level);
        // eslint-disable-next-line no-console
        console.log(prefix + '📽  filmweb', new Date, ...argv, suffix);
    }
}

module.exports = log;
