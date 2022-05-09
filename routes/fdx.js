const express = require('express');
const { authRefreshMiddleware } = require('../services/forge/auth.js');
const { getExchanges, getExchangeAssets, getExchangeRelationships } = require('../services/forge/fdx.js');

let router = express.Router();

router.use(authRefreshMiddleware);

router.get('/search', async function (req, res, next) {
    const { item_id } = req.query;
    try {
        const exchanges = await getExchanges(item_id, req.internalOAuthToken.access_token);
        res.json(exchanges);
    } catch (err) {
        next(err);
    }
});

router.get('/collections/:collection_id/exchanges/:exchange_id/assets', async function (req, res, next) {
    const { collection_id, exchange_id } = req.params;
    try {
        const assets = await getExchangeAssets(collection_id, exchange_id, req.internalOAuthToken.access_token);
        res.json(assets);
        // res.type('json').sendFile(__dirname + '/cache/assets.json');
    } catch (err) {
        next(err);
    }
});

router.get('/collections/:collection_id/exchanges/:exchange_id/relationships', async function (req, res, next) {
    const { collection_id, exchange_id } = req.params;
    try {
        const relationships = await getExchangeRelationships(collection_id, exchange_id, req.internalOAuthToken.access_token);
        res.json(relationships);
        // res.type('json').sendFile(__dirname + '/cache/relationships.json');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
