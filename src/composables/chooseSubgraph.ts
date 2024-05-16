import { RankEnum } from "@/types/Cluster";
import { SourceType } from "@/types/EnumArgs";
import { DFSWithSources, DFSsourceDAG } from "./algoDFS";
import { NetworkToGDSGraph } from "./networkToGraph";
import { ClusterNetwork } from "@/types/ClusterNetwork";
import { createCluster } from "./UseClusterNetwork";
import { getSources } from "./rankAndSources";
import { Network } from "@metabohub/viz-core/src/types/Network";


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

export function pathsToTargetNodeFromSources(network:Network, sources:Array<string>|SourceType){

    // get source if not given (not array)
    let sources_list: Array<string>;
    if (Array.isArray(sources)) {
        sources_list = sources;
    } else {
        sources_list = getSources(network, sources);
    }

    // for each source : do an independant dfs
    sources_list.forEach(source=>{
        const {dfs,graph}=DFSsourceDAG(network,[source]);
        const {distances, parents}=DistanceFromSourceDAG(graph,dfs);
        const targetNode=findMaxKey(distances);
        console.log(source+" ----> "+targetNode);
        // puis remonter chemin...
    })

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
                parentsFromSource[child].push(parent);
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
