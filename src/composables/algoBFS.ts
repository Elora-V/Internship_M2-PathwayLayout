import { Network } from "@metabohub/viz-core/src/types/Network";

export function networkToAdjacentObject(network:Network):{[key : string]:string[]}{
    const adjacence:{[key : string]:string[]}={};
    Object.keys(network.nodes).forEach(node=>{
        if (!(node in Object.keys(adjacence))){
            adjacence[node]=[];
        }
    })
    network.links.forEach(link=>{
        const source=link.source.id;
        const target=link.target.id;
        adjacence[source].push(target);
    });
    return adjacence;
}


export function BFS(adjacency: { [key: string]: string[] }, source: string) {
    const visitedNodes: { [key: string]: number } = {};
    const nodesToProcess: Array<string> = [source];
    visitedNodes[source] = 0;

    while (nodesToProcess.length) {
        const currentNode = nodesToProcess.shift()!;
        const currentLevel = visitedNodes[currentNode]; 

        if (currentNode) {
            const neighbors = adjacency[currentNode];
            neighbors.forEach(neighbor => {
                if (!(neighbor in visitedNodes)) {
                    visitedNodes[neighbor] = currentLevel + 1; 
                    nodesToProcess.push(neighbor);
                }
            });
        }
    }

    return visitedNodes;
}
