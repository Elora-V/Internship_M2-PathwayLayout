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
export function longuestPathFromDFS(graph:{[key:string]:Function},DFSreversed:Array<string>,sources:Array<string>):{[key:string]:Array<string>}{

    let dfs = Array.from(DFSreversed).reverse(); // the code has been done whith a backward reading of dfs

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


export function addNoConstraint(clusterNetwork:ClusterNetwork):ClusterNetwork{
    let network=clusterNetwork.network.value;
    network.links.forEach(link=>{
        let clusterSource: string[] = [];
        let clusterTarget: string[] = [];
        if ( Object.keys(link.source).includes("metadata") && Object.keys(link.source.metadata).includes("clusters")){
            clusterSource= link.source.metadata?.clusters ? link.source.metadata.clusters as string[] : [];
        }

        if ( Object.keys(link.target).includes("metadata") && Object.keys(link.target.metadata).includes("clusters")){
            clusterTarget= link.target.metadata?.clusters ? link.target.metadata.clusters as string[] : [];
        }        
        let sameClusters=true;
        // if same number of cluster : let's check if there are the same
        if (clusterTarget.length===clusterSource.length){
            clusterTarget.sort;
            clusterSource.sort;
            for (let i = 0; i < clusterTarget.length; ++i) {
                if (clusterTarget[i] !== clusterSource[i]){
                    sameClusters=false;
                }
            }
        }else{
            // if not the same number of cluster : the two nodes can't be in the exact same clusters
            sameClusters=false;
        }

        if (!sameClusters){
            if(!link.metadata){
                link.metadata={};
            }
            link.metadata["constraint"]=false;
        }
    });

    return clusterNetwork;
}

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


function mergeNewPath(source:string,newPath:string[],pathsFromSources:{[key:string]:string[]}):{[key:string]:string[]}{
    const keys=Object.keys(pathsFromSources);
    let hasmerged=false;
    console.log(keys);
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