import { RankEnum } from "@/types/Cluster";
import { SourceType } from "@/types/EnumArgs";
import { DFSWithSources, getSources } from "./algoDFS";
import { NetworkToGDSGraph } from "./networkToGraph";
import { ClusterNetwork } from "@/types/ClusterNetwork";
import { createCluster } from "./UseClusterNetwork";

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
    const newClusters=longuestPathFromDFS(graph,dfs,sources);
    Object.entries(newClusters).forEach(([source,path]:[string,Array<string>])=>{
        if (path.length > 3){
            const cluster= createCluster(source, RankEnum.EMPTY, path,[], ["longest_path"]);
            clusterNetwork.clusters[source]=cluster;
        }
    });

    return clusterNetwork;
}


export function longuestPathFromDFS(graph:{[key:string]:Function},dfs:Array<string>,sources:Array<string>):{[key:string]:Array<string>}{

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