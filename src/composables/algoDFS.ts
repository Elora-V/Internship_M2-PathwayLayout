import { Network } from '@metabohub/viz-core/src/types/Network';
import { NetworkToGDSGraph, NetworkToSerialized } from './networkToGraph';
import { Serialized} from 'graph-data-structure';
import Graph from "graph-data-structure";
import { SourceType } from '@/types/EnumArgs';

export function DFSWithSources(network:Network, sources:Array<string>=undefined,typeSource:SourceType=SourceType.SOURCE):Array<string>{

    // create graph for library from network
    const graph=NetworkToGDSGraph(network);

    //get sources nodes if not list from user
    if (!sources){
        sources=getSources(network, typeSource);
    }
    // apply DFS
    return graph.depthFirstSearch(sources);

}


export function getSources(network:Network, typeSource:SourceType):Array<string>{

    const sources=[];
    let graph:any; //pb de typage

    // if all nodes as source
    if (typeSource==SourceType.ALL){
        return Object.keys(network.nodes);
    }

    // if degree of node needed (for source) : get graph object
    if(typeSource==SourceType.SOURCE || typeSource==SourceType.SOURCE_RANK){
        graph=NetworkToGDSGraph(network);
    }

    // adding node depending on sourcetype : 
    Object.values(network.nodes).forEach(node =>{
        
        let nodeIsAdded=false;

        // add node that are source (indegree of 0)
        if(typeSource==SourceType.SOURCE || typeSource==SourceType.SOURCE_RANK){
            if(graph.indegree(node.id)===0){
                sources.push(node.id);
                nodeIsAdded=true;
            }
        }

        // add node that are rank 0 (if not already added)
        if(!nodeIsAdded && typeSource==SourceType.RANK || typeSource==SourceType.SOURCE_RANK){
            if(node.metadata && node.metadata.rank ){
                if (node.metadata.rank===0){
                    sources.push(node.id);
                }
            }else{
                console.error("Source by rank demanded, but no rank for network.")
            }
        }

    });

    return sources;

}
