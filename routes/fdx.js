const path = require('path');
const express = require('express');
const fse = require('fs-extra');
const { authRefreshMiddleware } = require('../services/aps.js');
const { getExchanges, getExchangeAssets, getExchangeRelationships } = require('../services/fdx.js');
const { USE_CACHE } = require('../config.js');

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
        if (USE_CACHE) {
            const cachePath = path.join(__dirname, '..', 'cache', collection_id, exchange_id, 'assets.json');
            if (!fse.existsSync(cachePath)) {
                const assets = await getExchangeAssets(collection_id, exchange_id, req.internalOAuthToken.access_token);
                fse.ensureDirSync(path.dirname(cachePath));
                fse.writeJsonSync(cachePath, assets);
            }
            res.sendFile(cachePath);
        } else {
            const assets = await getExchangeAssets(collection_id, exchange_id, req.internalOAuthToken.access_token);
            res.json(assets);
        }
    } catch (err) {
        next(err);
    }
});

router.get('/collections/:collection_id/exchanges/:exchange_id/relationships', async function (req, res, next) {
    const { collection_id, exchange_id } = req.params;
    try {
        if (USE_CACHE) {
            const cachePath = path.join(__dirname, '..', 'cache', collection_id, exchange_id, 'rels.json');
            if (!fse.existsSync(cachePath)) {
                const relationships = await getExchangeRelationships(collection_id, exchange_id, req.internalOAuthToken.access_token);
                fse.ensureDirSync(path.dirname(cachePath));
                fse.writeJsonSync(cachePath, relationships);
            }
            res.sendFile(cachePath);
        } else {
            const relationships = await getExchangeRelationships(collection_id, exchange_id, req.internalOAuthToken.access_token);
            res.json(relationships);
        }
    } catch (err) {
        next(err);
    }
});

module.exports = router;
