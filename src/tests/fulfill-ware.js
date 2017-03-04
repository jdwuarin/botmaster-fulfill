const { FulfillWare } = require('../');
require('should');

const bot = {
    type: 'not a real bot'
};

describe('fulfill outgoing ware', () => {


    it('should say hello world!', done => {
        const actions = {
            hi: {
                controller: () => 'hi world'
            }
        };
        const ware = FulfillWare({
            actions
        });
        const message = {
            message: {
                text: '<hi />'
            }
        };
        ware(
            bot, {},
            message,
            (err) => {
                if (err) return done(err);
                message.message.text.should.equal('hi world');
                done();
            }
        );
    });

    it('should have bot in params', done => {
        const actions = {
            hi: {
                controller: params => {
                    if (!params.bot)
                        throw new Error('no bot!');
                    if (params.context)
                        throw new Error('why do you still have context');
                    params.bot.type.should.equal('not a real bot');
                    return 'bo';
                }
            }
        };
        const ware = FulfillWare({
            actions
        });
        const message = {
            message: {
                text: '<hi />'
            }
        };
        ware(
            bot, {},
            message,
            (err) => {
                if (err) return done(err);
                done();
            }
        );
    });

    it('should not send empty messages', done => {
        const actions = {
            empty: {
                controller: (params, next) => {
                    next(null, '')
                        .then(done);
                }

            }
        };
        const ware = FulfillWare({
            actions
        });
        const message = {
            message: {
                text: '<empty />'
            }
        };
        ware(
            bot, {},
            message,
            () => {
                done('this should not be called');
            }
        );
    });

    it('should work with the next syntax', done => {
        const actions = {
            HI: {
                controller: (params, next) =>
                    next(null, 'HI').then(() => {})
            }
        };
        const ware = FulfillWare({
            actions
        });
        const message = {
            message: {
                text: '<HI />'
            }
        };
        ware(
            bot, {},
            message,
            () => {
                done();
            }
        );
    });

});
