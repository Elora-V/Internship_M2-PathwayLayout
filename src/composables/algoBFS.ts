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


export function BFS(adjacency: { [key: string]: string[] }, source: string):string[] {
    const visitedNodes:Array<string>=[] ;
    const nodesToProcess: Array<string> = [source];

    while (nodesToProcess.length) {
        const currentNode = nodesToProcess.shift()!;

        if (currentNode) {
            visitedNodes.push(currentNode);
            const children = adjacency[currentNode];
            children.forEach(child => {
                if (!(child in visitedNodes)) {
                    nodesToProcess.push(child);
                }
            });
        }
    }

    return visitedNodes;
}
