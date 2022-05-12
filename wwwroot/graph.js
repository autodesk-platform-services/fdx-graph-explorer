const ASSET_TYPE_COLOR_TABLE = {
    'autodesk.design:assets.binary-1.0.0': '#3366cc',
    'autodesk.design:assets.design-1.0.0': '#dc3912',
    'autodesk.design:assets.geometry-1.0.0': '#ff9900',
    'autodesk.design:assets.group-1.0.0': '#109618',
    'autodesk.design:assets.instance-1.0.0': '#990099',
    'autodesk.design:assets.renderstyle-1.0.0': '#0099c6'
};

const ASSET_TYPE_SHORTCUT = {
    'autodesk.design:assets.binary-1.0.0': 'BI',
    'autodesk.design:assets.design-1.0.0': 'DE',
    'autodesk.design:assets.geometry-1.0.0': 'GE',
    'autodesk.design:assets.group-1.0.0': 'GR',
    'autodesk.design:assets.instance-1.0.0': 'IN',
    'autodesk.design:assets.renderstyle-1.0.0': 'RS'
};

const group = d3.select('#graph g');
const zoom = d3.zoom()
    .on('zoom', function () {
        group.attr('transform', d3.event.transform);
    });
d3.select('#graph').call(zoom);
const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .text('...');

// Initialize the legend
// const legend = d3.select('#graph')
//     .append('g')
//     .attr('transform', 'translate(10 10)');
// const assetTypes = Object.keys(ASSET_TYPE_COLOR_TABLE);
// for (let i = 0; i < assetTypes.length; i++) {
//     legend.append('circle').attr('cx', 0).attr('cy', i * 20).attr('r', 6).style('fill', ASSET_TYPE_COLOR_TABLE[assetTypes[i]]);
//     legend.append('text').attr('x', 20).attr('y', i * 20).text(assetTypes[i]).style('font-size', '15px').attr('alignment-baseline', 'middle');
// }

function resize() {
    const { clientWidth, clientHeight } = document.getElementById('preview');
    d3.select('#graph')
        .attr('width', clientWidth)
        .attr('height', clientHeight);
    // legend
    //     .attr('transform', `translate(${0.25 * clientWidth + 10} ${clientHeight - 120})`);
}

window.onresize = resize;
resize();

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
        .attr('vector-effect', 'non-scaling-stroke')
        .style('stroke', '#aaa');

    // Initialize the nodes
    const node = group
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', 10)
        .attr('fill', d => ASSET_TYPE_COLOR_TABLE[d.type])
        .style('stroke', 'black')
        .on('click', onClick)
        .on('mouseover', onMouseOver)
        .on('mouseout', onMouseOut);

    // const labels = group
    //     .selectAll('text')
    //     .data(nodes)
    //     .enter()
    //     .append('text')
    //     .text(d => ASSET_TYPE_SHORTCUT[d.type])
    //     .attr('text-anchor', 'middle');

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
        // labels
        //     .attr('x', d => d.x)
        //     .attr('y', d => d.y);
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

    function onClick(data) {
        group
            .selectAll('circle')
            .style('stroke-width', (d) => d.id === data.id ? 4 : 1);
        onAssetClick(assets.find(asset => asset.id === data.id));
    }

    function onMouseOver(data) {
        tooltip.transition()
        .duration(200)
        .style('opacity', .9);
        tooltip.html(`<div>${data.name}</div><div>(${data.type})</div>`)
            .style('left', (d3.event.pageX + 8) + 'px')
            .style('top', (d3.event.pageY - 32) + 'px');
    }

    function onMouseOut() {
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }
}
