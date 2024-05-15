import { Network } from '@metabohub/viz-core/src/types/Network';
import * as GDS from 'graph-data-structure';
import { NetworkToGDSGraph } from './networkToGraph';
import { Link } from '@metabohub/viz-core/src/types/Link';

//https://www.geeksforgeeks.org/tree-back-edge-and-cross-edges-in-dfs-of-graph/


function createGraphForDFS(network:Network):DFS{
    const nbNode=Object.keys(network.nodes).length;
    const graphGDS=NetworkToGDSGraph(network);
    return  {
        time:0,
        dfsOrder: [], 
        GDSgraph: graphGDS,
        nodesID:graphGDS.nodes(),
        visitedFrom:Array.from({ length: nbNode }, () => undefined),
        start_time:Array.from({ length: nbNode }, () => undefined), // the first time the node is visited
        end_time:Array.from({ length: nbNode }, () => undefined),    // time of visit when backward reading
        crossEdge:{}
    }
}



export function customDFS(network:Network, sources:Array<string>):{dfs:Array<string>,crossEdge:{[key:string]:Array<{source:string,target:string}>}} {
    let DFS=createGraphForDFS(network);
    sources.forEach(sourceID =>{
        const sourceIndex=DFS.nodesID.indexOf(sourceID);
        if (sourceIndex!==-1 && !DFS.visitedFrom[sourceIndex]){
            DFS=nodeDFS(DFS,sourceIndex,sourceID);           
        }
    });
    return {dfs:DFS.dfsOrder,crossEdge:DFS.crossEdge};
}


function nodeDFS(DFS:DFS,nodeIndex:number,sourceID?:string):DFS{
    
    // mark the node as visited
    DFS.visitedFrom[nodeIndex] = sourceID?sourceID:DFS.nodesID[nodeIndex];
    
    // get the starting time for the node
    DFS.start_time[nodeIndex] = DFS.time;
    
    // increment the time by 1
    DFS.time += 1;
    
    // loop through the children of the node

    DFS.GDSgraph.adjacent(DFS.nodesID[nodeIndex]).forEach(childID => {

        // get the index of the child
        const childIndex = DFS.nodesID.indexOf(childID);
        if(childIndex!==-1){

            // if the child node had never been visited : the edge is an tree edge
            if (DFS.visitedFrom[childIndex] === undefined){
            
                // mark the edge as a tree edge
                //console.log("Tree Edge: " + DFS.nodesID[nodeIndex] + "-->" + DFS.nodesID[childIndex]+"\n");
                
                // dfs through the child node
                DFS=nodeDFS(DFS,childIndex,sourceID);

            } else { // if the child node had already been visited

                // if this node had been visited for the first time after his child node
                // and child has no endtime 
                // => back edge 
                // if ( DFS.start_time[nodeIndex] > DFS.start_time[childIndex] && DFS.end_time[childIndex]===undefined){
                //     console.log("Back Edge: " + DFS.nodesID[nodeIndex] + "-->" + DFS.nodesID[childIndex]+"\n");
                // }
                    
                // if this node is an ancestor of the child node, but not a tree edge
                // i.e node first visited before his child
                // and child has  endtime 
                // => forward edge
                // else if ( DFS.start_time[nodeIndex] < DFS.start_time[childIndex] && DFS.end_time[childIndex] !== undefined) {
                //     console.log("Forward Edge: " + DFS.nodesID[nodeIndex] + "-->" + DFS.nodesID[childIndex]+"\n");
                // }  
            
                // if parent and neighbour node do not 
                // have any ancestor and descendant relationship between them
                // if this node had been visited for the first time after his child node
                // and child has endtime 
                // => cross edge either between path of 2 sources, or between the same (so cycle for the source)

                //else 
                if (DFS.start_time[nodeIndex] > DFS.start_time[childIndex] && DFS.end_time[childIndex] !== undefined) {
                    //console.log("Cross Edge: " + DFS.nodesID[nodeIndex] + "-->" + DFS.nodesID[childIndex]+"\n");

                    // if the child had been visited for the first time with the same source node : it is the type of cross edge wanted
                    if (DFS.visitedFrom[childIndex]===sourceID){ 
                        const key=sourceID? sourceID: DFS.nodesID[nodeIndex];
                        if (!(key in DFS.crossEdge)){
                            DFS.crossEdge[key]=[];
                        }
                        DFS.crossEdge[key].push({source:DFS.nodesID[nodeIndex],target:childID});
                    }
                }

  
            }
        }
    });
    
    // get the ending time for the node
    DFS.end_time[nodeIndex] = DFS.time;

    // add the node to the dfs order
    DFS.dfsOrder.push(DFS.nodesID[nodeIndex]); 
    
    // increment the time by 1
    DFS.time += 1;

    return DFS;
}
    
