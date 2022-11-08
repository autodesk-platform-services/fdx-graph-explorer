const axios = require('axios').default;

const ApiHost = 'https://developer.api.autodesk.com';

async function getExchanges(itemId, accessToken) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const url = `${ApiHost}/exchange/v1/exchanges?filters=${encodeURIComponent('attribute.exchangeFileUrn==' + itemId)}`;
    let resp = await axios({ method: 'get', url, headers });
    let exchanges = resp.data.results;
    // TODO: check additional pages of results
    return exchanges;
}

async function getExchangeAssets(collectionId, exchangeId, accessToken) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const url = `${ApiHost}/exchange/v1/collections/${collectionId}/exchanges/${exchangeId}/assets:sync`;
    let resp = await axios({ method: 'get', url, headers });
    let assets = resp.data.results;
    while (resp.data.pagination?.cursor) {
        resp = await axios({ method: 'get', url: url + `?cursor=${resp.data.pagination.cursor}`, headers });
        assets = assets.concat(resp.data.results);
    }
    return assets;
}

async function getExchangeAssetsParallel(collectionId, exchangeId, accessToken) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const url = `${ApiHost}/exchange/v1/collections/${collectionId}/exchanges/${exchangeId}/assets:sync-urls`;
    const resp = await axios({ method: 'get', url, headers });
    const downloadUrls = resp.data.results.map(result => result.url);
    const pages = await Promise.all(downloadUrls.map(url => axios({ method: 'get', url, headers }).then(resp => resp.data.results)));
    return [].concat(...pages);
}

async function getExchangeRelationships(collectionId, exchangeId, accessToken) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const url = `${ApiHost}/exchange/v1/collections/${collectionId}/exchanges/${exchangeId}/relationships:sync`;
    let resp = await axios({ method: 'get', url, headers });
    let relationships = resp.data.results;
    while (resp.data.pagination?.cursor) {
        resp = await axios({ method: 'get', url: url + `?cursor=${resp.data.pagination.cursor}`, headers });
        relationships = relationships.concat(resp.data.results);
    }
    return relationships;
}

async function getExchangeRelationshipsParallel(collectionId, exchangeId, accessToken) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const url = `${ApiHost}/exchange/v1/collections/${collectionId}/exchanges/${exchangeId}/relationships:sync-urls`;
    const resp = await axios({ method: 'get', url, headers });
    const downloadUrls = resp.data.results.map(result => result.url);
    const pages = await Promise.all(downloadUrls.map(url => axios({ method: 'get', url, headers }).then(resp => resp.data.results)));
    return [].concat(...pages);
}

module.exports = {
    getExchanges,
    getExchangeAssets, //: getExchangeAssetsParallel,
    getExchangeRelationships, //: getExchangeRelationshipsParallel,
};
