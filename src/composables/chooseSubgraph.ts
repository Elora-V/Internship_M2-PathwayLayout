import { RankEnum } from "@/types/Cluster";
import { PathType, SourceType } from "@/types/EnumArgs";
import { DFSWithSources, DFSsourceDAG } from "./algoDFS";
import { NetworkToGDSGraph } from "./networkToGraph";
import { ClusterNetwork } from "@/types/ClusterNetwork";
import { createCluster } from "./UseClusterNetwork";
import { getSources } from "./rankAndSources";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { BFS } from "./algoBFS";
import type {Cluster} from "@/types/Cluster";
import { updateNodeMetadataCluster, addNodeTocluster } from './UseClusterNetwork';


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
 * @param merge if true, merge the path with an existing one if a common node is found, else common nodes in several clusters
 *  => not taken by all methods of getCluster
 * @param pathType the type of path to target node wanted :
 * LONGEST :  one of the longest path
 * ALL_LONGEST : all the longest lenght
 * ALL : all path
 * => not taken by all methods of getCluster
 * @param minHeight minimum size of a cluster to be added
 * @returns the clusterNetwork with more cluster
 */
export function addClusterFromSources(clusterNetwork:ClusterNetwork, sources:Array<string> | SourceType, 
    getClusters:(network: Network, sources: Array<string>,merge?:boolean,pathType?:PathType) => {[key:string]:{nodes:Array<string>, height:number}}=getPathSourcesToTargetNode,
    merge:boolean=true,
    pathType:PathType=PathType.ALL_LONGEST,
    minHeight:number=4
):ClusterNetwork{

    console.log('create cluster longest path');
    const network=clusterNetwork.network.value;
    
    // get sources
    if (!Array.isArray(sources)){
        sources=getSources(network,sources);
    }

    // get cluster of paths from sources
    const newClusters=getClusters(network,sources as string[],merge,pathType);

    // add cluster if length > minsize, and add information of cluster for nodes
    Object.entries(newClusters).forEach(([clusterID,cluster]:[string,{nodes:Array<string>, height:number}])=>{
        if (cluster.height >= minHeight){
            // create cluster and add it
            const newCluster= createCluster(clusterID, RankEnum.EMPTY, cluster.nodes,[]);
            clusterNetwork.clusters[clusterID]=newCluster;
            // add metadata for node in cluster
            cluster.nodes.forEach(nodeID=>{
                updateNodeMetadataCluster(network, nodeID, clusterID);
            });
        }
    });

    return clusterNetwork;
}


/**
 * Adds mini branches to the main chain in the cluster network.
 * A mini branch is a child of a node in main chain cluster that has no children.
 * @param clusterNetwork - The cluster network to modify.
 * @returns The modified cluster network.
 */
export function addMiniBranchToMainChain(clusterNetwork:ClusterNetwork):ClusterNetwork{
    console.log('add mini branch to main chain');
    const network=clusterNetwork.network.value;
    const graph=NetworkToGDSGraph(network);  
    // for each cluster :
    Object.entries(clusterNetwork.clusters).forEach(([clusterID,cluster]:[string,Cluster]) => {
        const nodesToAdd:string[]=[];
        // for each node of the cluster :
        cluster.nodes.forEach(node=>{
            const children=graph.adjacent(node);
            children.forEach(child=>{
                // if child is sink : 
                if (graph.outdegree(child)===0){
                    // it's a mini branch, so add it to the list
                    if (!nodesToAdd.includes(child)) {
                        nodesToAdd.push(child);
                    }
                }
            });
        });
        // add the nodes to the cluster
        nodesToAdd.forEach(nodeID=>{
            clusterNetwork = addNodeTocluster(clusterNetwork,clusterID,nodeID);  
        });
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
export function getLongPathDFS(network:Network,sources:string[]):{[key:string]:{nodes:Array<string>, height:number}}{ 
    console.log('DFS long path');
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
function longestPathFromDFS(graph:{[key:string]:Function},DFSreversed:Array<string>,sources:Array<string>):{[key:string]:{nodes:Array<string>, height:number}}{

    let dfs = Array.from(DFSreversed).reverse(); // the code has been done whith a backward reading of dfs

    let longestPaths:{[key:string]:{nodes:Array<string>, height:number}}={};
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
            longestPaths[source]={nodes:[source],height:1};
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
function endPath(source:string, longestPaths:{[key:string]:{nodes:Array<string>, height:number}},path:Array<string>):{[key:string]:{nodes:Array<string>, height:number}}{
    if (source in longestPaths){
        if(longestPaths[source].height < path.length){
            longestPaths[source]={nodes:path.slice(),height:path.length};
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
 * @param merge if true, merge the path with an existing one if a common node is found, else common nodes in several clusters
 * @param pathType the type of path to target node wanted :
 * LONGEST :  one of the longest path
 * ALL_LONGEST : all the longest lenght
 * ALL : all path
 * @returns some node clusters with id
 */
export function getPathSourcesToTargetNode(network:Network, sources:string[],merge:boolean=true,pathType:PathType=PathType.ALL_LONGEST):{[key:string]:{nodes:Array<string>, height:number}}{

    console.log('DAG_Dijkstra');

    let pathsFromSources:{[key:string]:{nodes:Array<string>, height:number}}={};

    // for each source : do an independant dfs
    sources.forEach(source=>{
        // DFS to get a DAG from this source, and get topological sort
        const {dfs,graph}=DFSsourceDAG(network,[source]);
        // get max distance from source node for all nodes, and by which parent nodes the node had been accessed
        const {distances, parents}=DistanceFromSourceDAG(graph,dfs,pathType);
        // get the farthest node from source (node with max distance)
        const targetNodes=findMaxKeys(distances);
        // for each target node : (if several path wanted)
        if (pathType==PathType.ALL_LONGEST || pathType==PathType.ALL){
            targetNodes.key.forEach(target => {
                // get the parents that goes from source to target node 
                const nodesBetweenSourceTarget=BFS(parents,target);
                // merge with an existing path if node in common
                pathsFromSources=mergeNewPath(source,{nodes:nodesBetweenSourceTarget, height:targetNodes.max},pathsFromSources,merge);
            });
        } else  if(pathType==PathType.LONGEST){ // if only one path wanted : take the first
            // get the parents that goes from source to target node 
            const nodesBetweenSourceTarget=BFS(parents,targetNodes.key[0]);
            // merge with an existing path if node in common
            pathsFromSources=mergeNewPath(source,{nodes:nodesBetweenSourceTarget, height:targetNodes.max},pathsFromSources,merge);
        }
            
    });      
    return pathsFromSources;
}

/**
 * Dijkstra like algorithm to get longest distance from source node for each node
 * @param graph object that contains function to get children of a node, and remove an edge
 * @param topologicalOrderFromSource a topological order of node from a source
 * @param pathType the parent nodes include for a child node :
 * LONGEST : add unique parent from one of the longest path
 * ALL_LONGEST : add parents from path from the longest lenght
 * ALL : add all parents
 * @returns maximal distance to the source and parents nodes for each nodes
 */
function DistanceFromSourceDAG(graph:{[key:string]:Function}, topologicalOrderFromSource:string[],pathType:PathType=PathType.ALL_LONGEST):{distances:{[key:string]:number}, parents:{[key:string]:string[]}} {

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

                /// If only the parents from the longest path(s) are kept:
                if (pathType==PathType.LONGEST || pathType==PathType.ALL_LONGEST ){
                    parentsFromSource[child]=[parent];
                }
            }
            // If all parent from longest path are wanted : (case of already maximum path found, so same distance)
            if(pathType==PathType.ALL_LONGEST && newDistance === childDistance){
                if (!parentsFromSource[child].includes(parent)) {
                    parentsFromSource[child].push(parent);
                }
            }
            if(pathType==PathType.ALL){
                if (!parentsFromSource[child].includes(parent)) {
                    parentsFromSource[child].push(parent);
                }
            }
        })
    });

    return {distances:distanceFromSource, parents:parentsFromSource};
}

/**
 * Find the keys associated with the maximum value in the object.
 * @param obj The object containing key-value pairs.
 * @returns The keys associated with the maximum value (or undefined if the object is empty) and the max value.
 */
function findMaxKeys(obj: { [key: string]: number }): {key:string[]|undefined,max:number} {
    let maxKeys: string[] | undefined;
    let maxValue = -Infinity;
    Object.entries(obj).forEach(([key, value]) => {
        if (value > maxValue) {
            maxValue = value;
            maxKeys = [key];
        }
        else if (value == maxValue){
            maxKeys.push(key);
        }
    });

    return {key:maxKeys,max:maxValue};
}

/**
 * Merge a new path in the object with all paths. If a common node is find between the new path and the other : the two paths are merged into one.
 * Else the path is added as a new one.
 * @param source source node use to get the longest path from a source DAG
 * @param newPath path to add in the object with all paths
 * @param pathsFromSources object with all paths (array of node id with an path id)
 * @param [merge=true] if true, merge the path with an existing one if a common node is found
 * @returns all paths including the new one
 */
function mergeNewPath(source:string,newPath:{nodes:Array<string>, height:number},pathsFromSources:{[key:string]:{nodes:Array<string>, height:number}}, merge:boolean=true):{[key:string]:{nodes:Array<string>, height:number}}{
    const keys=Object.keys(pathsFromSources);
    let hasmerged=false;
    if (merge) {
        keys.forEach(key=>{
            const pathNodes = pathsFromSources[key].nodes;
            // Check for common nodes, but target nodes
            const commonNodes = pathNodes.find(node => newPath.nodes.includes(node));
            if (commonNodes) {
                // Merge paths
                const mergedPath = Array.from(new Set(pathNodes.concat(newPath.nodes)));
                // Create new key
                const newKey = `${key}--${source}`;
                // Update pathsFromSources object
                const newheight=newPath.height>pathsFromSources[key].height?newPath.height:pathsFromSources[key].height;
                pathsFromSources[newKey] = {nodes:mergedPath,height:newheight};
                // Remove old key
                delete pathsFromSources[key];
                hasmerged=true;
            }
        });
    }
    // if no merge : added on it's own
    if (!hasmerged){
        pathsFromSources[source]=newPath;
    }
    return pathsFromSources;
}