import { RankEnum } from "@/types/Cluster";
import { SourceType } from "@/types/EnumArgs";
import { DFSWithSources, DFSsourceDAG } from "./algoDFS";
import { NetworkToGDSGraph } from "./networkToGraph";
import { ClusterNetwork } from "@/types/ClusterNetwork";
import { createCluster } from "./UseClusterNetwork";
import { getSources } from "./rankAndSources";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { BFS } from "./algoBFS";


/**
 * Add clusters (in ClusterNetwork object) taht are at least of a minimum size. A method is given in the parameters to get the clusters
 * @param clusterNetwork an object with the network and object for clusters
 * @param sources array of node ID or a type of method to get sources automatically
 * RANK_ONLY : sources are nodes of rank 0
 * SOURCE_ONLY : sources are topological sources of the network (nul indegree)
 * RANK_SOURCE : sources are node of rank 0, then source nodes
 * ALL : sources are all nodes
 * SOURCE_ALL : sources are topological sources, then all the others nodes
 * RANK_SOURCE_ALL : sources are node of rank 0, then topological sources, then all the other nodes
 * For this function, the advised choice is either RANK_ONLY, SOURCE_ONLY or RANK_SOURCE.
 * @param getClusters function that return the clusters to add
 * @param minsize minimum size of a cluster to be added
 * @returns the clusterNetwork with more cluster
 */
export function addClusterFromSources(clusterNetwork:ClusterNetwork, sources:Array<string>,
    getClusters:(network: Network, sources: Array<string> | SourceType) => {[key:string]:Array<string>}=pathsToTargetNodeFromSources,
    minsize:number=4
):ClusterNetwork{

    const network=clusterNetwork.network.value;
    
    // get sources
    if (!Array.isArray(sources)){
        sources=getSources(network,sources);
    }

    // get cluster of paths from sources
    const newClusters=getClusters(network,sources);

    // add cluster if length > minsize, and add information of cluster for nodes
    Object.entries(newClusters).forEach(([clusterID,nodesCluster]:[string,Array<string>])=>{
        if (nodesCluster.length >= minsize){
            // create cluster and add it
            const cluster= createCluster(clusterID, RankEnum.EMPTY, nodesCluster,[]);
            clusterNetwork.clusters[clusterID]=cluster;
            // add metadata for node in cluster
            nodesCluster.forEach(nodeID=>{
                if (! ("metadata" in network.nodes[nodeID]) ){
                    network.nodes[nodeID].metadata={};
                }
                if (!("clusters" in network.nodes[nodeID].metadata)){
                    network.nodes[nodeID].metadata.clusters=[]
                }
               const clusters=network.nodes[nodeID].metadata.clusters as Array<string>;
               clusters.push(clusterID);
            });
        }
    });

    return clusterNetwork;
}

// ----------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------- Method 1 of getCluster for main chains ---------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------


/**
 * Get a long path from sources using a DFS. The path isn't the longest if there some undirected cycle.
 * @param network 
 * @param sources to use for DFS
 * @returns some node clusters with id
 */
export function getLongPathDFS(network:Network,sources:string[]):{[key:string]:Array<string>}{ 
    // create graph for library from network 
    const graph=NetworkToGDSGraph(network);  
    // DFS
    const dfs=DFSWithSources(network, sources);
    // get new clusters : 'longest' paths from sources with DFS
    return longestPathFromDFS(graph,dfs,sources as string[]);
}


/**
 * The 'longest' (not the longest if undirected or directed cycle) path associated with each source with the DFS is found. BEWARE : the order of the id can change the result.
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
function longestPathFromDFS(graph:{[key:string]:Function},DFSreversed:Array<string>,sources:Array<string>):{[key:string]:Array<string>}{

    let dfs = Array.from(DFSreversed).reverse(); // the code has been done whith a backward reading of dfs

    let longestPaths:{[key:string]:Array<string>}={};
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
                longestPaths=endPath(source,longestPaths,path);
                // suppress nodes after the current node (those already analysed in while loop, because backward reading)
                dfs.splice(i + 1);
            }

            // define new source and add to path
            source = visitedNode;
            longestPaths[source]=[source];
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
                    longestPaths=endPath(source,longestPaths,path);
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
    return longestPaths;
}

/**
 * Is the node a child of the parent node ?
 * @param graph object that contains function to get children of a node
 * @param node is this node a child of the parent?
 * @param parentNode the parent node
 * @returns boolean
 */
function nodeIsChildOf(graph:{[key:string]:Function},node:string, parentNode:string):boolean{
    return graph.adjacent(parentNode).includes(node);
}

/**
 * Check if the given path is longer than the one in the longest, if it is : update the path to keep the longest of the two
 * @param source source of the path (first node)
 * @param longestPaths 
 * @param path the path to check
 * @returns the new longest paths
 */
function endPath(source:string, longestPaths:{[key:string]:Array<string>},path:Array<string>):{[key:string]:Array<string>}{
    if (source in longestPaths){
        if(longestPaths[source].length < path.length){
            longestPaths[source]=path.slice();
        }
    }else{
        console.error("source key not in object")
    }
    return longestPaths;
}

// ----------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------- Method 2 of getCluster for main chains ---------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------

/**
 * Return the longest paths from source nodes for the source DAG. "Source DAG" doesn't mean the graph is a DAG, but the subraph containing all descendant of the source is a DAG.
 * Paths obtained are the longest for the created DAG, not the general graph (because it is NP-hard).
 * If several sources have nodes in common in their longest path (from the DAG), then there are merged in one path.
 * @param network 
 * @param sources to use for the paths
 * @returns some node clusters with id
 */
export function pathsToTargetNodeFromSources(network:Network, sources:Array<string>|SourceType):{[key:string]:Array<string>}{

    // get source if not given (not array)
    let sources_list: Array<string>;
    if (Array.isArray(sources)) {
        sources_list = sources;
    } else {
        sources_list = getSources(network, sources);
    }

    let pathsFromSources:{[key:string]:Array<string>}={}

    // for each source : do an independant dfs
    sources_list.forEach(source=>{
        // DFS to get a DAG from this source, and get topological sort
        const {dfs,graph}=DFSsourceDAG(network,[source]);
        // get max distance from source node for all nodes, and by which parent nodes the node had been accessed
        const {distances, parents}=DistanceFromSourceDAG(graph,dfs);
        // get the farthest node from source (node with max distance)
        const targetNode=findMaxKey(distances);
        // get the parents that goes from source to target node 
        const nodesBetweenSourceTarget=BFS(parents,targetNode);
        // merge with an existing path if node in common
        pathsFromSources=mergeNewPath(source,nodesBetweenSourceTarget,pathsFromSources);
    })
    return pathsFromSources;
}

/**
 * Dijkstra like algorithm to get longest distance from source node for each node
 * @param graph object that contains function to get children of a node, and remove an edge
 * @param topologicalOrderFromSource a topological order of node from a source
 * @returns maximal distance to the source and parents nodes for each nodes
 */
function DistanceFromSourceDAG(graph:{[key:string]:Function}, topologicalOrderFromSource:string[]):{distances:{[key:string]:number}, parents:{[key:string]:string[]}} {

    // the source is the first node in the topological order
    const source=topologicalOrderFromSource[0];
    
    // Initialization
    const distanceFromSource:{[key:string]:number} = {};
    const parentsFromSource:{[key:string]:string[]}={};
    topologicalOrderFromSource.forEach(node=> {
        distanceFromSource[node] = node === source ? 0 : Number.NEGATIVE_INFINITY;
        parentsFromSource[node]=[];
    });
    
    // Process node in topological order
    topologicalOrderFromSource.forEach(parent=> {
        // For each children
        graph.adjacent(parent).forEach( child => {
            const childDistance= distanceFromSource[child];
            const newDistance=distanceFromSource[parent] + graph.getEdgeWeight(parent,child);
            if ( newDistance > childDistance) {
                distanceFromSource[child] = newDistance;

                // if the parent keeped is only the only for the longest path :
                parentsFromSource[child]=[parent];
            }
        })
    });

    return {distances:distanceFromSource, parents:parentsFromSource};
}

/**
 * Find the key associated with the maximum value in the object.
 * @param obj The object containing key-value pairs.
 * @returns The key associated with the maximum value, or undefined if the object is empty.
 */
function findMaxKey(obj: { [key: string]: number }): string | undefined {
    let maxKey: string | undefined;
    let maxValue = -Infinity;

    Object.entries(obj).forEach(([key, value]) => {
        if (value > maxValue) {
            maxValue = value;
            maxKey = key;
        }
    });

    return maxKey;
}

/**
 * Merge a new path in the object with all paths. If a common node is find between the new path and the other : the two paths are merged into one.
 * Else the path is added as a new one.
 * @param source source node use to get the longest path from a source DAG
 * @param newPath path to add in the object with all paths
 * @param pathsFromSources object with all paths (array of node id with an path id)
 * @returns all paths including the new one
 */
function mergeNewPath(source:string,newPath:string[],pathsFromSources:{[key:string]:string[]}):{[key:string]:string[]}{
    const keys=Object.keys(pathsFromSources);
    let hasmerged=false;
    keys.forEach(key=>{
        const keyPath = pathsFromSources[key];
        // Check for common nodes
        const commonNodes = keyPath.find(node => newPath.includes(node));
        if (commonNodes) {
            // Merge paths
            const mergedPath = Array.from(new Set(keyPath.concat(newPath)));
            // Create new key
            const newKey = `${key}--${source}`;
            // Update pathsFromSources object
            pathsFromSources[newKey] = mergedPath;
            // Remove old key
            delete pathsFromSources[key];
            hasmerged=true;
        }
    });
    // if no merge : added on it's own
    if (!hasmerged){
        pathsFromSources[source]=newPath;
    }
    return pathsFromSources;
}