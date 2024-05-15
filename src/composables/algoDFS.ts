import { Network } from '@metabohub/viz-core/src/types/Network';
import { Node } from '@metabohub/viz-core/src/types/Node';
import { NetworkToGDSGraph, NetworkToSerialized } from './networkToGraph';
import { Serialized} from 'graph-data-structure';
import Graph from "graph-data-structure";
import { SourceType } from '@/types/EnumArgs';
import { customDFS } from './customDFS';

/**
 * Take a network and sources, return the dfs result (that is an array of string of node ID)
 * @param network 
 * @param sources to use for dfs : array of node ID or a type of method to get sources automatically
 * RANK_ONLY : sources are nodes of rank 0
 * SOURCE_ONLY : sources are topological sources of the network (nul indegree)
 * RANK_SOURCE : sources are node of rank 0, then source nodes
 * ALL : sources are all nodes
 * SOURCE_ALL : sources are topological sources, then all the others nodes
 * RANK_SOURCE_ALL : sources are node of rank 0, then topological sources, then all the other nodes
 * 
 * @returns dfs result
 */
export function DFSWithSources(network:Network, sources:Array<string>|SourceType):Array<string>{

    // create graph for library from network
    const graph=NetworkToGDSGraph(network);

    //get sources nodes if no list from user
    let sources_list: Array<string>;
    if (Array.isArray(sources)) {
        sources_list = sources;
    } else {
        sources_list = getSources(network, sources);
    }

    // apply DFS (reverse order because DFS is a backward reading)
    const dfs= graph.depthFirstSearch(sources_list);
    return dfs.reverse();

}

/**
 * Get a list of nodes to use as input for DFS (as sources) for example
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
export function getSources(network:Network, typeSource:SourceType):Array<string>{

    // if all nodes as source
    if (typeSource==SourceType.ALL){
        return Object.keys(network.nodes);
    }

    const sources_rank=[];
    const sources_source=[];
    const sources_all=[];

    // get object for data-graph-structure if indegree information needed (when source nodes needed)
    let graph:{[key:string]:Function};
    if(needSource(typeSource)){
        graph=NetworkToGDSGraph(network);
    }

    // adding node depending on sourcetype : Order is important !! 
    // always rank, then source, then all
    Object.values(network.nodes).forEach(node =>{      
        if(needRank(typeSource) && hasRank0(node)){
            sources_rank.push(node.id);
        } else if (needSource(typeSource) && graph.indegree(node.id)===0){
            sources_source.push(node.id);
        } else if (needAll(typeSource)) {
            sources_all.push(node.id);
        }       
    });
    
    return sources_rank.concat(sources_source, sources_all);

}

/**
 * Node has rank 0 in metadata ?
 * @param node Node
 * @returns boolean
 */
function hasRank0(node:Node):boolean{
    return (node.metadata && Object.keys(node.metadata).includes("rank") && node.metadata.rank===0);
}

/**
 * Depending on the sourcetype, does the information of rank is needed ?
 * @param sourcetype 
 * @returns boolean
 */
function needRank(sourcetype:SourceType):boolean{
    return [SourceType.RANK_ONLY,SourceType.RANK_SOURCE,SourceType.RANK_SOURCE_ALL].includes(sourcetype);
}

/**
 * Depending on the sourcetype, does the information of topological source is needed ?
 * @param sourcetype 
 * @returns boolean
 */
function needSource(sourcetype:SourceType):boolean{
    return [SourceType.SOURCE_ONLY,SourceType.SOURCE_ALL,SourceType.RANK_SOURCE,SourceType.RANK_SOURCE_ALL].includes(sourcetype);
}

/**
 * Depending on the sourcetype, does all the nodes are needed ?
 * @param sourcetype 
 * @returns boolean
 */
function needAll(sourcetype:SourceType):boolean{
    return [SourceType.ALL,SourceType.SOURCE_ALL,SourceType.RANK_SOURCE_ALL].includes(sourcetype);
}

