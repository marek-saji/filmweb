const LOGIN = process.env.npm_package_config_test_login || process.env.TEST_LOGIN;
const PASSWORD = process.env.npm_package_config_test_password || process.env.TEST_PASSWORD;

if (! LOGIN || ! PASSWORD)
{
    if (process.env.npm_lifecycle_event)
    {
        throw new Error('Use test_login and test_password npm options to specify login credentials.');
    }
    else
    {
        throw new Error('Use TEST_LOGIN and TEST_PASSWORD environment variables to specify login credentials.');
    }
}

module.exports = {
    login: LOGIN,
    password: PASSWORD,
};
