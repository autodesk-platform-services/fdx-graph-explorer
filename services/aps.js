const { AuthClientThreeLegged, UserProfileApi, HubsApi, ProjectsApi, FoldersApi, ItemsApi } = require('forge-apis');
const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL } = require('../config.js');

const authClient = new AuthClientThreeLegged(APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL, ['data:read']);

function getAuthorizationUrl() {
    return authClient.generateAuthUrl();
}

async function authCallbackMiddleware(req, res, next) {
    const credentials = await authClient.getToken(req.query.code);
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
        const credentials = await authClient.refreshToken({ refresh_token });
        req.session.internal_token = credentials.access_token;
        req.session.refresh_token = credentials.refresh_token;
        req.session.expires_at = Date.now() + credentials.expires_in * 1000;
    }
    req.internalOAuthToken = {
        access_token: req.session.internal_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000)
    };
    next();
}

async function getUserProfile(token) {
    const resp = await new UserProfileApi().getUserProfile(authClient, token);
    return resp.body;
}

async function getHubs(token) {
    const resp = await new HubsApi().getHubs(null, authClient, token);
    return resp.body.data;
}

async function getProjects(hubId, token) {
    const resp = await new ProjectsApi().getHubProjects(hubId, null, authClient, token);
    return resp.body.data;
}

async function getProjectContents(hubId, projectId, folderId, token) {
    if (!folderId) {
        const resp = await new ProjectsApi().getProjectTopFolders(hubId, projectId, authClient, token);
        return resp.body.data;
    } else {
        const resp = await new FoldersApi().getFolderContents(projectId, folderId, null, authClient, token);
        return resp.body.data;
    }
}

async function getItemVersions(projectId, itemId, token) {
    const resp = await new ItemsApi().getItemVersions(projectId, itemId, null, authClient, token);
    return resp.body.data;
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
