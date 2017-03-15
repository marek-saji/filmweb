const getConfInt = (name) => parseInt(process.env['npm_package_config_' + name], 10);

const HUMAN_DELAY = getConfInt('human_delay') || 2000;
const HUMAN_DELAY_DEVIATION = getConfInt('human_delay_deviation') || 1000;
const REQUEST_THROTTLE = getConfInt('request_throttle') || 10000;
const REQUEST_THROTTLE_DEVIATION = getConfInt('request_throttle_deviation') || 5000;

const log = require('./log');

var throttleQueue = [];


function wait (microseconds, deviation = 0)
{
    return new Promise(resolve => {
        let time = ~~(microseconds + deviation * (-1 + Math.random() * 2));
        log(4, 'Waiting', microseconds, '±', deviation, '=', time, 'ms');
        setTimeout(resolve, time);
    });
}

function simulateHumanDelay (input)
{
    log(3, 'Simulating human interaction delay');
    return wait(HUMAN_DELAY, HUMAN_DELAY_DEVIATION)
        .then(() => input);
}

function throttleRequest (input)
{
    log(3, 'Throttling request to simulate human delay');

    let item = {
        promise: null,
        resolved: false,
    };

    item.promise =
        // Wait for all previously queued items to complete
        Promise.all(throttleQueue.map(({promise}) => promise))
            // wait some time
            .then(() => wait(REQUEST_THROTTLE, REQUEST_THROTTLE_DEVIATION))
            // mark queue item as resolved
            // purge resolved items from queue
            .then(() => throttleQueue = throttleQueue.filter(({resolved}) => ! resolved));

    throttleQueue.push(item);

    return item.promise.then(() => input);
}


module.exports = {
    simulateHumanDelay,
    throttleRequest,
};
