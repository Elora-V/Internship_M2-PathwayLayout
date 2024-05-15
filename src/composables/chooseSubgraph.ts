import { RankEnum } from "@/types/Cluster";
import { SourceType } from "@/types/EnumArgs";
import { DFSWithSources } from "./algoDFS";
import { NetworkToGDSGraph } from "./networkToGraph";
import { ClusterNetwork } from "@/types/ClusterNetwork";
import { createCluster } from "./UseClusterNetwork";
import { getSources } from "./rankAndSources";


/**
 * Add clusters : a dfs for each sources is done and the longuest path associated with each source is used as new cluster. BEWARE : if sources is an array of node ID, the order of the id can change the result.
 * @param clusterNetwork an object with the network and object for clusters
 * @param sources array of node ID or a type of method to get sources automatically
 * RANK_ONLY : sources are nodes of rank 0
 * SOURCE_ONLY : sources are topological sources of the network (nul indegree)
 * RANK_SOURCE : sources are node of rank 0, then source nodes
 * ALL : sources are all nodes
 * SOURCE_ALL : sources are topological sources, then all the others nodes
 * RANK_SOURCE_ALL : sources are node of rank 0, then topological sources, then all the other nodes
 * For this function, the advised choice is either RANK_ONLY, SOURCE_ONLY or RANK_SOURCE.
 * 
 * @returns the clusterNetwork with more cluster
 */
export function addLonguestPathClusterFromSources(clusterNetwork:ClusterNetwork, sources:Array<string>|SourceType):ClusterNetwork{

    // create graph for library from network
    const network=clusterNetwork.network.value;
    const graph=NetworkToGDSGraph(network);

    // DFS
    if (!Array.isArray(sources)){
        sources=getSources(network,sources);
    }
    const dfs=DFSWithSources(network, sources);

    // get new clusters : longuest paths from sources with DFS
    const newClusters=longuestPathFromDFS(graph,dfs,sources as string[]);
    Object.entries(newClusters).forEach(([source,path]:[string,Array<string>])=>{
        if (path.length > 3){
            const cluster= createCluster(source, RankEnum.EMPTY, path,[], ["longest_path"]);
            clusterNetwork.clusters[source]=cluster;
            // add metadata for node in cluster
            path.forEach(nodeID=>{
                if (! ("metadata" in network.nodes[nodeID]) ){
                    network.nodes[nodeID].metadata={};
                }
                if (!("clusters" in network.nodes[nodeID].metadata)){
                    network.nodes[nodeID].metadata.clusters=[]
                }
               const clusters=network.nodes[nodeID].metadata.clusters as Array<string>;
               clusters.push(source);
            });
        }
    });

    return clusterNetwork;
}

/**
 * The longuest path associated with each source with the DFS is found. BEWARE : the order of the id can change the result.
 * @param graph object for graph-data-structure library
 * @param dfs the return string (of nodes id) of a dfs (logically obtained with same sources as the sources for this functions)
 * @param sources array of node ID or a type of method to get sources automatically
 * RANK_ONLY : sources are nodes of rank 0
 * SOURCE_ONLY : sources are topological sources of the network (nul indegree)
 * RANK_SOURCE : sources are node of rank 0, then source nodes
 * ALL : sources are all nodes
 * SOURCE_ALL : sources are topological sources, then all the others nodes
 * RANK_SOURCE_ALL : sources are node of rank 0, then topological sources, then all the other nodes
 * For this function, the advised choice is either RANK_ONLY, SOURCE_ONLY or RANK_SOURCE.
 * 
 * @returns an object for the different path, the key is the source of the path
 */
export function longuestPathFromDFS(graph:{[key:string]:Function},fowardDFS:Array<string>,sources:Array<string>):{[key:string]:Array<string>}{

    let dfs = Array.from(fowardDFS).reverse(); // the code has been done whith a backward reading of dfs

    let longuestPaths:{[key:string]:Array<string>}={};
    let path:Array<string>;
    let source:string=undefined;
    let i=dfs.length-1; // index of node in dfs array
    let add=false;

    while( i !== -1 ){ // dfs nodes are read backwards
        const visitedNode=dfs[i];
        const previousNode: string = (dfs.length - 1 >= i + 1) ? dfs[i + 1] : undefined;
        
        // if visited node is source
        if( sources.includes(visitedNode) ){
            
            if (source!==undefined){
                // end the path (of the previous source, if one)
                longuestPaths=endPath(source,longuestPaths,path);
                // suppress nodes after the current node (those already analysed in while loop, because backward reading)
                dfs.splice(i + 1);
            }

            // define new source and add to path
            source = visitedNode;
            longuestPaths[source]=[source];
            add=true;
            path=[source];
        
        // if there is a previous node
        } else if (previousNode){
            // if visited node is child of the previous visited node in dfs : add to path
            if (nodeIsChildOf(graph,visitedNode,previousNode)){       
                add=true;
                path.push(visitedNode);
            }else{
                // end the path if a node has been added in the last pass of the loop
                if (add && source!==undefined){
                    longuestPaths=endPath(source,longuestPaths,path);
                }
                // remove previous visited node if this node is not the parent of current node
                dfs.splice(i+1,1);
                path.splice(path.length-1);
                i++; // next loop pass will be on the same visited node (because the parent of the visited node wasn't found)
                add=false; // no node has been added
            }
        }

        i--; //backward reading
    }
    return longuestPaths;
}

function nodeIsChildOf(graph:{[key:string]:Function},node:string, parentNode:string):boolean{
    return graph.adjacent(parentNode).includes(node);
}

function endPath(source:string, longuestPaths:{[key:string]:Array<string>},path:Array<string>):{[key:string]:Array<string>}{
    if (source in longuestPaths){
        if(longuestPaths[source].length < path.length){
            longuestPaths[source]=path.slice();
        }
    }else{
        console.error("source key not in object")
    }
    return longuestPaths;
}