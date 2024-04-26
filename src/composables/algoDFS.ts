import { Network } from '@metabohub/viz-core/src/types/Network';
import { Node } from '@metabohub/viz-core/src/types/Node';
import { NetworkToGDSGraph, NetworkToSerialized } from './networkToGraph';
import { Serialized} from 'graph-data-structure';
import Graph from "graph-data-structure";
import { SourceType } from '@/types/EnumArgs';

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

    // apply DFS
    return graph.depthFirstSearch(sources_list);

}


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

function hasRank0(node:Node):boolean{
    return (node.metadata && Object.keys(node.metadata).includes("rank") && node.metadata.rank===0);
}

function needRank(sourcetype:SourceType):boolean{
    return [SourceType.RANK_ONLY,SourceType.RANK_SOURCE,SourceType.RANK_SOURCE_ALL].includes(sourcetype);
}

function needSource(sourcetype:SourceType):boolean{
    return [SourceType.SOURCE_ONLY,SourceType.SOURCE_ALL,SourceType.RANK_SOURCE,SourceType.RANK_SOURCE_ALL].includes(sourcetype);
}

function needAll(sourcetype:SourceType):boolean{
    return [SourceType.ALL,SourceType.SOURCE_ALL,SourceType.RANK_SOURCE_ALL].includes(sourcetype);
}

