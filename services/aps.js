const { SdkManagerBuilder } = require('@aps_sdk/autodesk-sdkmanager');
const { AuthenticationClient, Scopes, ResponseType } = require('@aps_sdk/authentication');
const { DataManagementClient } = require('@aps_sdk/data-management');

const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL } = require('../config.js');

const sdkManager = SdkManagerBuilder.create().build();
const authenticationClient = new AuthenticationClient(sdkManager);
const dataManagementClient = new DataManagementClient(sdkManager);

function getAuthorizationUrl() {
    return authenticationClient.authorize(APS_CLIENT_ID, ResponseType.Code, APS_CALLBACK_URL, [
        Scopes.DataRead
    ]);
}

async function authCallbackMiddleware(req, res, next) {
    const credentials = await authenticationClient.getThreeLeggedToken(APS_CLIENT_ID, req.query.code, APS_CALLBACK_URL, { clientSecret: APS_CLIENT_SECRET });
    req.session.internal_token = credentials.access_token;
    req.session.refresh_token = credentials.refresh_token;
    req.session.expires_at = Date.now() + credentials.expires_in * 1000;
    next();
}

async function authRefreshMiddleware(req, res, next) {
    const { refresh_token, expires_at } = req.session;
    if (!refresh_token) {
        res.status(401).end();
        return;
    }

    if (expires_at < Date.now()) {
        const credentials = await authenticationClient.getRefreshToken(APS_CLIENT_ID, refresh_token, { clientSecret: APS_CLIENT_SECRET });
        req.session.internal_token = credentials.access_token;
        req.session.refresh_token = credentials.refresh_token;
        req.session.expires_at = Date.now() + credentials.expires_in * 1000;
    }
    req.credentials = {
        access_token: req.session.internal_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000)
    };
    next();
}

async function getUserProfile(token) {
    const info = await authenticationClient.getUserInfo(token);
    return info;
}

async function getHubs(token) {
    const { data } = await dataManagementClient.getHubs(token);
    return data;
}

async function getProjects(hubId, token) {
    const { data } = await dataManagementClient.getHubProjects(token, hubId);
    return data;
}

async function getProjectContents(hubId, projectId, folderId, token) {
    if (!folderId) {
        const { data } = await dataManagementClient.getProjectTopFolders(token, hubId, projectId);
        return data;
    } else {
        const { data } = await dataManagementClient.getFolderContents(token, projectId, folderId);
        return data;
    }
}

async function getItemVersions(projectId, itemId, token) {
    const { data } = await dataManagementClient.getItemVersions(token, projectId, itemId);
    return data;
}

module.exports = {
    getAuthorizationUrl,
    authCallbackMiddleware,
    authRefreshMiddleware,
    getUserProfile,
    getHubs,
    getProjects,
    getProjectContents,
    getItemVersions
};
