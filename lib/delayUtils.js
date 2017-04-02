const getConfInt = (name) => parseInt(process.env['npm_package_config_' + name], 10);

const HUMAN_DELAY = getConfInt('human_delay') || 2000;
const HUMAN_DELAY_DEVIATION = getConfInt('human_delay_deviation') || 1000;
const REQUEST_THROTTLE = getConfInt('request_throttle') || 10000;
const REQUEST_THROTTLE_DEVIATION = getConfInt('request_throttle_deviation') || 5000;
const STALE_NAVIGATION_TRESHOLD = 5 * 60;

const log = require('./log');

const queue = [];


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
    log(3, 'Throttling request');
    return wait(REQUEST_THROTTLE, REQUEST_THROTTLE_DEVIATION)
        .then(() => input);
}

function createQueueItem ()
{
    let item = {};

    item.waitForItsTurn = new Promise(resolve => { item.start = resolve; })
        .then(() => { log(3, 'Starting queued item.'); });
    item.done = () => {
        log(3, 'Finished queued item.');
        let idx = queue.indexOf(item);
        if (-1 !== idx)
        {
            queue.splice(idx, 1);
        }
        if (0 !== queue.length)
        {
            queue[0].start();
        }
    };
    item.resolved = (value) => {
        item.done();
        return value;
    };
    item.rejected = (error) => {
        item.done();
        throw error;
    };


    queue.push(item);

    if (1 === queue.length)
    {
        item.start();
    }

    return item;
}

function waitForEmptyQueue ()
{
    let item = createQueueItem();
    return item.waitForItsTurn
        .then(item.resolved, item.rejected);
}

module.exports = {
    STALE_NAVIGATION_TRESHOLD,
    simulateHumanDelay,
    throttleRequest,
    createQueueItem,
    waitForEmptyQueue,
};
