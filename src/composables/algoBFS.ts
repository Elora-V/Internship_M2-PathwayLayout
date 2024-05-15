import { SourceType } from "@/types/EnumArgs";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { getSources } from "./algoDFS";


/**
 * Convert a network into an adjacency object.
 * @param network The network to convert.
 * @returns An adjacency object representing the network.
 */
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

/**
 * Perform Breadth-First Search (BFS) on a graph represented by an adjacency object.
 * @param adjacency The adjacency object representing the graph.
 * @param source The starting node for BFS.
 * @returns An array of nodes visited in BFS order.
 */
export function BFS(adjacency: { [key: string]: string[] }, source: string): string[] {
    const visitedNodes: Set<string> = new Set();
    const nodesToProcess: string[] = [source];

    while (nodesToProcess.length) {
        const currentNode = nodesToProcess.shift()!;

        if (currentNode && !visitedNodes.has(currentNode)) {
            visitedNodes.add(currentNode);
            const children = adjacency[currentNode] || [];
            children.forEach(child => {
                if (!visitedNodes.has(child)) {
                    nodesToProcess.push(child);
                }
            });
        }
    }

    return Array.from(visitedNodes);
}


/**
 * Perform Breadth-First Search (BFS) on a network with multiple sources.
 * @param network The network to perform BFS on.
 * @param sources An array of source nodes or a source type.
 * Source type :
 * RANK_ONLY : sources are nodes of rank 0
 * SOURCE_ONLY : sources are topological sources of the network (nul indegree)
 * RANK_SOURCE : sources are node of rank 0, then source nodes
 * ALL : sources are all nodes
 * SOURCE_ALL : sources are topological sources, then all the others nodes
 * RANK_SOURCE_ALL : sources are node of rank 0, then topological sources, then all the other nodes
 * @returns An array of nodes visited in BFS order, a node can appear several time if it is a descendant of several sources.
 */
export function BFSWithSources(network:Network, sources:Array<string>|SourceType):Array<string>{
    console.log('BFS');
    let bfsAllSources:string[] =[];

    // create graph for library from network
    const adj=networkToAdjacentObject(network);

    //get sources nodes if no list from user
    let sources_list: Array<string>;
    if (Array.isArray(sources)) {
        sources_list = sources;
    } else {
        sources_list = getSources(network, sources);
    }

    // apply BFS
    sources_list.forEach(source=>{
        // bfs on source only if source not already visited
        if( !bfsAllSources.includes(source)){
            const bfs=BFS(adj,source); 
            bfsAllSources = bfsAllSources.concat(bfs);
        }
    })
  
    return bfsAllSources
}
