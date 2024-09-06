// Types imports
import { StartNodesType } from "@/types/EnumArgs";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { NodeLayout } from "@/types/NetworkLayout";

// Composable imports
import { NetworkToGDSGraph } from "./ConvertFromNetwork";


/**
 * This file contains the functions to calculate the start nodes of a network for graph traversal.
 * 
 * -> assignRankOrder :
 *       assign rank and order to nodes of a network
 * 
 * -> getStartNodes :
 *       get the start nodes of a network for graph traversal
 * 
 * -> concatSources :
 *      concatenate two arrays of strings and remove duplicates
 * 
 * -> hasRank0 :
 *      check if a node has rank 0 in metadata
 * 
 * -> needRank :
 *      check if the rank information is needed for the sourcetype
 * 
 * -> needSource :
 *     check if the topological source information is needed for the sourcetype
 * 
 * -> needAll :
 *    check if all nodes are needed for the sourcetype
 * 
 * -> concatSources :
 *     concatenate two arrays of strings and remove duplicates
 * 
 */

/**
 * Take network and all the unique y coordinate. Add the rank (y position : first, second...; not coordinate) and order ( x position in the rank: first, second,....) to metadata of network.
 * @param {Network} Network object
 * @param unique_y array of all unique y for node position
 */
export function assignRankOrder(network: Network, unique_y: Array<number>):void {

    // sort the y to know the associated rank for a y coordinate
    unique_y.sort((a:number, b:number) => a - b);

    // get the rank for each node
    const xNodeByRank: number[][] = Array.from({ length: unique_y.length }, () => []);
    Object.values(network.nodes).forEach((node) => {
        const rank = unique_y.indexOf(node.y);
        if(rank >-1){
            node.metadata = node.metadata || {}; 
            node.metadata.rank = rank;
            xNodeByRank[rank].push(node.x);
        }else{
            node.metadata.rank = undefined;
        }
    });

    // sort the y by rank
    xNodeByRank.forEach(sublist => {
        sublist.sort((a, b) => a - b); 
    });

    // get the order for each node 
    Object.values(network.nodes).forEach((node) => {
        if (node.metadata && Object.keys(node.metadata).includes("rank") && node.metadata.rank !== undefined){
            const rank = node.metadata.rank;
            if (typeof rank === 'number') {
                const order = xNodeByRank[rank].indexOf(node.x);
                node.metadata.order = order;
            } else {
                console.error("Le rang n'est pas un nombre");
                node.metadata.order = undefined;
            }
        }else{
            node.metadata.order = undefined;
        }
    });
}


/**
 * Get a list of nodes to use as start node for graph traversal (DFS for example)
 * @param network 
 * @param typeSource type of sources to get, with a certain order if several types
 * RANK_ONLY : sources are nodes of rank 0
 * SOURCE_ONLY : sources are topological sources of the network (nul indegree)
 * RANK_SOURCE : sources are node of rank 0, then source nodes
 * ALL : sources are all nodes
 * SOURCE_ALL : sources are topological sources, then all the others nodes
 * RANK_SOURCE_ALL : sources are node of rank 0, then topological sources, then all the other nodes
 * @returns the id of the sources
 */
export async function getStartNodes(network:Network, typeSource:StartNodesType):Promise<Array<string>>{

    // if all nodes as source
    if (typeSource==StartNodesType.ALL){
        return Object.keys(network.nodes).sort();
    }

    const start_rank=[];
    const start_source=[];
    const start_all=[];

    // get object for data-graph-structure if indegree information needed (when source nodes needed)
    let graph:{[key:string]:Function};
    if(needSource(typeSource)){
        graph= await NetworkToGDSGraph(network);
    }

    // adding node depending on sourcetype : Order is important !! 
    // always rank, then source, then all
    Object.entries(network.nodes).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([, value]) => value)
    .forEach(node =>{      
        if(needRank(typeSource) && hasRank0(node)){
            start_rank.push(node.id);
        } else if (needSource(typeSource) && graph.indegree(node.id)===0){
            start_source.push(node.id);
        } else if (needAll(typeSource)) {
            start_all.push(node.id);
        }       
    });
    
    return start_rank.concat(start_source, start_all);

}


// function getSourcesParam(network:Network,sourceType:SourceType):string[]{
//   let sources:string[]=[];
//     if(onlyUserSources){
//       sources=userSources;
//     }else{
//       sources = concatSources(userSources as string[],getSources(network,sourceType));
//     }
//     return sources;
// }


/**
 * Node has rank 0 in metadata ?
 * @param node Node
 * @returns boolean
 */
function hasRank0(node:NodeLayout):boolean{
    console.warn('change rank attr');
    return (node.metadata && Object.keys(node.metadata).includes("rank") && node.metadata.rank===0);
}

/**
 * Depending on the sourcetype, does the information of rank is needed ?
 * @param sourcetype 
 * @returns boolean
 */
function needRank(sourcetype:StartNodesType):boolean{
    return [StartNodesType.RANK_ONLY,StartNodesType.RANK_SOURCE,StartNodesType.RANK_SOURCE_ALL].includes(sourcetype);
}

/**
 * Depending on the sourcetype, does the information of topological source is needed ?
 * @param sourcetype 
 * @returns boolean
 */
function needSource(sourcetype:StartNodesType):boolean{
    return [StartNodesType.SOURCE_ONLY,StartNodesType.SOURCE_ALL,StartNodesType.RANK_SOURCE,StartNodesType.RANK_SOURCE_ALL].includes(sourcetype);
}

/**
 * Depending on the sourcetype, does all the nodes are needed ?
 * @param sourcetype 
 * @returns boolean
 */
function needAll(sourcetype:StartNodesType):boolean{
    return [StartNodesType.ALL,StartNodesType.SOURCE_ALL,StartNodesType.RANK_SOURCE_ALL].includes(sourcetype);
}

/**
 * Concatenates two source arrays of strings and removes duplicates. The result is the first array, then the second (order is preserved).
 * @param firstSources - The first array of strings.
 * @param secondSources - The second array of strings.
 * @returns A new array containing the unique elements from both input arrays.
 */
export function concatSources(firstSources: string[], secondSources: string[]): string[] {
    const result = [...firstSources];
    secondSources.forEach(item => {
        if (!result.includes(item)) {
            result.push(item);
        }
    });
    return result;
}