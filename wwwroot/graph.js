const ASSET_TYPE_COLOR_TABLE = {
    'autodesk.design:assets.binary-1.0.0': '#3366cc',
    'autodesk.design:assets.design-1.0.0': '#dc3912',
    'autodesk.design:assets.geometry-1.0.0': '#ff9900',
    'autodesk.design:assets.group-1.0.0': '#109618',
    'autodesk.design:assets.instance-1.0.0': '#990099',
    'autodesk.design:assets.renderstyle-1.0.0': '#0099c6'
};

const group = d3.select('#preview svg g');
const zoom = d3.zoom()
    // .scaleExtent([1, 10])
    .on('zoom', function () {
        group.attr('transform', d3.event.transform);
    });
// group
//     .call(zoom);
d3.select('#preview svg').call(zoom);
const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .text('...');

export async function loadGraph(collectionId, exchangeId, onAssetClick) {
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

    const nodes = assets.map(asset => ({ id: asset.id, name: asset.components?.data?.insert?.['autodesk.design:components.base-1.0.0']?.objectInfo?.String?.name || asset.id, type: asset.type }));
    const links = relationships.map(relationship => ({ source: relationship.from.asset.id, target: relationship.to.asset.id, type: relationship.type }));

    group.selectAll('*').remove();

    // Initialize the links
    const link = group
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .style('stroke', '#aaa');

    // Initialize the nodes
    const node = group
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', 10)
        .attr('fill', d => ASSET_TYPE_COLOR_TABLE[d.type])
        .on('click', function (d) {
            onAssetClick(assets.find(asset => asset.id === d.id));
        })
        .on('mouseover', function (d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`<div>${d.name}</div><div>(${d.type})</div>`)
                .style('left', (d3.event.pageX + 8) + 'px')
                .style('top', (d3.event.pageY - 32) + 'px');
        })
        .on('mouseout', function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Let's list the force we wanna apply on the network
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink()/*.distance(() => 1.0)*/.id(d => d.id).links(links))
        .force('charge', d3.forceManyBody().strength(-100)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force('center', d3.forceCenter(0, 0)) // This force attracts nodes to the center of the svg area
        .on('tick', onTick)
        .on('end', onEnd);

    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function onTick() {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    }

    function onEnd() {
        // link
        //     .attr('stroke-dasharray', d => {
        //         switch (d.type) {
        //             case 'autodesk.design:relationship.containment-1.0.0': return '1';
        //             case 'autodesk.design:relationship.reference-1.0.0': return '4';
        //             default: return '';
        //         }
        //     });
    }
}
