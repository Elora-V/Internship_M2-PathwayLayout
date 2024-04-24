import { Network } from '@metabohub/viz-core/src/types/Network';
import { NetworkToSerialized } from './networkToGraph';
import { Serialized} from 'graph-data-structure';
import indegree from "graph-data-structure";

export function DFSWithSources(network:Network, sources:Array<string>=undefined):Array<string>{

    // rank0=[];
    // Object.values(network.value.nodes).forEach(node =>{
    //     if (node.metadata && (Object.keys(node.metadata).includes("rank")) && node.metadata.rank===0){
    //       rank0.push(node.id);
    //     }
    //   });

    try {
    import('graph-data-structure').then(gds => {

        // create graph for library from network
        const graph = gds.Graph();
        const networkSerialized: Serialized = NetworkToSerialized(network);
        graph.deserialize(networkSerialized);

        //get sources nodes if undefined by user
        if (!sources){
            sources=[];
            graph.nodes().forEach(node =>{
                // add node that are source (indegree of 0)
                if(graph.indegree(node)===0){
                    sources.push(node);
                }
            });
        }
        // apply DFS
        return graph.depthFirstSearch(sources);
    
    });
    }catch{
        return [];
    }

}