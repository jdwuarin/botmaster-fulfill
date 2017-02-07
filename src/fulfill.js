/**
 *  Main module for fulfill, defining the overall fulfill process
 *  @private
 */

const R = require('ramda');
const {parallel, series, apply} = require('async');
const {getTasks, isPendingActions:__isPendingActions, evalResponse } = require('./actions');
const __parse = require('posthtml-parser');
const render = require('posthtml-render');
const debug = require('debug')('botmaster:ware:fulfill:parse');

const parseOptions = {
    xmlMode: true,
    recognizeSelfClosing: true,
    normalizeWhitespace: false,
    decodeEntities: false,
};

const parse = string => __parse(string, parseOptions);

/**
 * Test for remaining actions in a string
 * @param  {String}  string  input string to test for actions
 * @param  {Object}  actions actions to test for
 * @return {Boolean} whether any actions were found
 */
const isPendingActions = (string, actions) => __isPendingActions(parse(string), actions);

/**
 * Fulfill any actions found in the input text
 * @param  {Object} actions actions to run
 * @param  {Object} context an object of aditional properties to expost though `params`
 * @param  {String} input the string to look for actions in
 * @param  {Array}  [tree] provided as a way to speed up recursion. You probably don't need to use this.
 * @param  {Function} cb error first callback
 */
const fulfill = (actions, context, input, tree, cb) => {
    if (!cb) {
        cb = tree;
        tree = parse(input);
    }
    debug(`Got tree ${JSON.stringify(tree)}`);
    const tasks = getTasks(tree, actions, context);
    debug(`Got ${tasks.parallel.length} parallel tasks and ${tasks.series.length} serial tasks`);
    parallel([
        apply(parallel, tasks.parallel),
        apply(series, tasks.series),
    ], (err, responses) => {
        if (err) cb(err);
        else {
            R.forEach(
                R.curry(evalResponse)(tree, R.__),
                R.compose(
                    R.filter(R.propSatisfies(evaluate => evaluate !== 'step', 'evaluate')),
                    R.flatten
                )(responses)
            );
            debug(`tree is now ${JSON.stringify(tree)}`);
            const response = render(tree);
            tree = parse(response);
            if (__isPendingActions(tree, actions)) {
                debug(`recursing response ${response}`);
                fulfill(actions, context, response, tree, cb);
            } else {
                debug(`final response ${response}`);
                cb(null, response);
            }
        }
    });
};

module.exports = {
    fulfill,
    isPendingActions
};