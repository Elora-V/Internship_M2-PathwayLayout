import { Network } from '@metabohub/viz-core/src/types/Network';
import { Node } from '@metabohub/viz-core/src/types/Node';
import { NetworkToGDSGraph, NetworkToSerialized } from './networkToGraph';
import { Serialized} from 'graph-data-structure';
import Graph from "graph-data-structure";
import { SourceType } from '@/types/EnumArgs';
import { getSources } from './rankAndSources';

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

    console.log('DFS');

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
 * DFS with sources in input ...(function to change)
 * @param network 
 * @param sources to use as staring node for DFS
 * @returns ... (function to change)
 */
export function customDFS(network:Network, sources:Array<string>):Array<string> {
    let DFS=createGraphForDFS(network);

    sources.forEach(sourceID =>{
        const sourceIndex=DFS.nodesID.indexOf(sourceID);
        // if the source exist in the network and it's not already visited : dfs from this source
        if (sourceIndex!==-1 && !DFS.visited[sourceIndex]){
            DFS=nodeDFS(DFS,sourceIndex);           
        }
    });
    return DFS.dfsOrder.reverse();
}

/**
 * Initialize a dfs object from the network
 * @param network 
 * @returns initialized DFS object
 */
function createGraphForDFS(network:Network):DFS{
    const nbNode=Object.keys(network.nodes).length;
    const graphGDS=NetworkToGDSGraph(network);
    return  {
        dfsOrder: [], 
        GDSgraph: graphGDS,
        nodesID:graphGDS.nodes(),
        visited:Array.from({ length: nbNode }, () => false)
    }
}

/**
 * DFS from a node
 * @param DFS dfs object with visited nodes, adjacent information ...
 * @param nodeIndex of the node ro process
 * @returns the DFS object with visited nodes, adjacent information ...
 */
function nodeDFS(DFS:DFS,nodeIndex:number):DFS{

    // mark the node as visited
    DFS.visited[nodeIndex] = true;
    
    // loop through the children of the node
    DFS.GDSgraph.adjacent(DFS.nodesID[nodeIndex]).forEach(childID => {

        // get the index of the child
        const childIndex = DFS.nodesID.indexOf(childID);
        if(childIndex!==-1){

            // if the child node had never been visited : the edge is an tree edge
            if (!DFS.visited[childIndex]){

                // dfs through the child node
                DFS=nodeDFS(DFS,childIndex);

            } else { // if the child node had already been visited

                
            }
        }
    });
    
    // add the node to the dfs order
    DFS.dfsOrder.push(DFS.nodesID[nodeIndex]); 
    
    return DFS;
}
    


