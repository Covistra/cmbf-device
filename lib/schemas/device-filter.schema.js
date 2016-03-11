var Joi = require('joi');

module.exports = Joi.object().keys({
    location: Joi.object().keys({
        latitude: Joi.number(),
        longitude: Joi.number(),
        radius: Joi.number()
    }),
    country: Joi.array().items(Joi.string()),
    language: Joi.array().items(Joi.string()),
    account: Joi.array(),
    user: Joi.array()
});
