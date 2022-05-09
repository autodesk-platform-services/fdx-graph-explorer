const ASSET_TYPE_COLOR_TABLE = {
    'autodesk.design:assets.binary-1.0.0': '#3366cc',
    'autodesk.design:assets.design-1.0.0': '#dc3912',
    'autodesk.design:assets.geometry-1.0.0': '#ff9900',
    'autodesk.design:assets.group-1.0.0': '#109618',
    'autodesk.design:assets.instance-1.0.0': '#990099',
    'autodesk.design:assets.renderstyle-1.0.0': '#0099c6'
};

export async function loadGraph(container, collectionId, exchangeId, onAssetClick) {
    console.log('Retrieving assets...');
    let resp = await fetch(`/api/fdx/collections/${collectionId}/exchanges/${exchangeId}/assets`);
    if (!resp.ok) {
        console.error(resp);
        alert('Could not retrieve exchange assets. See console for more details.');
    }
    let assets = await resp.json();
    console.log('Asset count', assets.length);

    console.log('Retrieving relationships...');
    resp = await fetch(`/api/fdx/collections/${collectionId}/exchanges/${exchangeId}/relationships`);
    if (!resp.ok) {
        console.error(resp);
        alert('Could not retrieve exchange relationships. See console for more details.');
    }
    let relationships = await resp.json();
    console.log('Relationship count', relationships.length);

    const nodes = new vis.DataSet(assets.map((asset, i) => {
        return {
            id: i,
            label: asset.components?.data?.insert?.['autodesk.design:components.base-1.0.0']?.objectInfo?.String?.name || asset.id,
            // type: asset.type
        };
    }));
    const edges = new vis.DataSet(relationships.map(relationship => {
        return {
            from: assets.findIndex(asset => asset.id === relationship.from.asset.id),
            to: assets.findIndex(asset => asset.id === relationship.to.asset.id),
            // type: relationship.type
        };
    }));
    const options = {
        layout: {
            improvedLayout: false
        }
    };
    return new vis.Network(container, { nodes, edges }, options);
}
