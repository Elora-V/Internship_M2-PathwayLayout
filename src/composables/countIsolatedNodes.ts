import { Network } from "@metabohub/viz-core/src/types/Network";

export function countIsolatedNodes(network: Network): number {
    let nb: number = 0;
    const nodesCount: { [x: string]: number} = {};
    Object.keys(network.nodes).forEach(nodeId => {
        nodesCount[nodeId] = 0;
    });

    // count number of links for each node
    network.links.forEach(link => {
        nodesCount[link.source.id] += 1;
        nodesCount[link.target.id] += 1;
    });

    /*
    // get nodes that have no links
    for (const [key, value] of Object.entries(nodesCount)) {
        
    }
    */
    Object.values(nodesCount).forEach(count => {
        if (count == 0) {
            nb += 1;
        }
    });

    return nb;
}