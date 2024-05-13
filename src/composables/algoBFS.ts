import { Network } from "@metabohub/viz-core/src/types/Network";

export function networkToAdjacentObject(network:Network):{[key : string]:string[]}{
    const adjacence:{[key : string]:string[]}={};
    network.links.forEach(link=>{
        const source=link.source.id;
        const target=link.target.id;
        if (!(source in Object.keys(adjacence))){
            adjacence[source]=[];
        }
        adjacence[source].push(target);
    });
    return adjacence;
}


export function BFS(adjacence:{[key : string]:string[]},source:string){
    const visitedNodes : Array<string> = [];
    let nodesToProcess : Array<string> = [source];

    while(nodesToProcess.length){
      const node = nodesToProcess.shift();
      if(!(visitedNodes.indexOf(node) > -1)){
        nodesToProcess = nodesToProcess.concat(adjacence[node]);
        visitedNodes.push(node);
      }
    }

    return visitedNodes;
  }

