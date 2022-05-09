async function getJSON(url) {
    const resp = await fetch(url);
    if (!resp.ok) {
        alert('Could not load tree data. See console for more details.');
        console.error(await resp.text());
        return [];
    }
    return resp.json();
}

function createTreeNode(id, text, icon, children = false) {
    return { id, text, children, itree: { icon } };
}

async function getHubs() {
    const hubs = await getJSON('/api/hubs');
    return hubs.map(hub => createTreeNode(`hub|${hub.id}`, hub.attributes.name, 'icon-hub', true));
}

async function getProjects(hubId) {
    const projects = await getJSON(`/api/hubs/${hubId}/projects`);
    return projects.map(project => createTreeNode(`project|${hubId}|${project.id}`, project.attributes.name, 'icon-project', true));
}

async function getContents(hubId, projectId, folderId = null) {
    const contents = await getJSON(`/api/hubs/${hubId}/projects/${projectId}/contents` + (folderId ? `?folder_id=${folderId}` : ''));
    return contents.map(item => {
        const { displayName, extension } = item.attributes;
        if (item.type === 'folders') {
            return createTreeNode(`folder|${hubId}|${projectId}|${item.id}`, displayName, 'icon-my-folder', true);
        } else {
            const tokens = extension.type.split(':');
            return createTreeNode(`item|${hubId}|${projectId}|${item.id}`, `${displayName} (${tokens[tokens.length - 1]})` , 'icon-item', true);
        }
    });
}

// async function getVersions(hubId, projectId, itemId) {
//     const versions = await getJSON(`/api/hubs/${hubId}/projects/${projectId}/contents/${itemId}/versions`);
//     return versions.map(version => createTreeNode(`version|${version.id}`, version.attributes.createTime, 'icon-version'));
// }

async function getExchanges(hubId, projectId, itemId) {
    const exchanges = await getJSON(`/api/fdx/search?item_id=${encodeURIComponent(itemId)}`);
    return exchanges.map(exchange => createTreeNode(`exchange|${exchange.id}|${exchange.collection.id}`, exchange.createdBy.date, 'icon-version'));
}

export function initTree(selector, onSelectionChanged) {
    // See http://inspire-tree.com
    const tree = new InspireTree({
        data: function (node) {
            if (!node || !node.id) {
                return getHubs();
            } else {
                const tokens = node.id.split('|');
                switch (tokens[0]) {
                    case 'hub': return getProjects(tokens[1]);
                    case 'project': return getContents(tokens[1], tokens[2]);
                    case 'folder': return getContents(tokens[1], tokens[2], tokens[3]);
                    case 'item': return getExchanges(tokens[1], tokens[2], tokens[3]);
                    default: return [];
                }
            }
        }
    });
    tree.on('node.click', function (event, node) {
        event.preventTreeDefault();
        const tokens = node.id.split('|');
        if (tokens[0] === 'exchange') {
            onSelectionChanged(tokens[2], tokens[1]);
        }
    });
    return new InspireTreeDOM(tree, { target: selector });
}
