import { Network } from '@metabohub/viz-core/src/types/Network';
import * as GDS from 'graph-data-structure';
import { NetworkToGDSGraph } from './networkToGraph';

//https://www.geeksforgeeks.org/tree-back-edge-and-cross-edges-in-dfs-of-graph/

interface DFS {
    time:number
    dfsOrder: Array<string>
    GDSgraph: {[key:string]:Function}
    nodesID:Array<string>
    visited:Array<boolean>
    start_time:Array<number>
    end_time:Array<number>
}

function createGraphForDFS(network:Network):DFS{
    const nbNode=Object.keys(network.nodes).length;
    const graphGDS=NetworkToGDSGraph(network);
    return  {
        time:0,
        dfsOrder: [], // TO CHANGE : REVERSED ??
        GDSgraph: graphGDS,
        nodesID:graphGDS.nodes(),
        visited:Array.from({ length: nbNode }, () => false),
        start_time:Array.from({ length: nbNode }, () => 0), // the first time the node is visited
        end_time:Array.from({ length: nbNode }, () => 0)    // time of visit when backward reading
    }
}



export function customDFS(network:Network, sources:Array<string>):Array<string> {
    let DFS=createGraphForDFS(network);
    sources.forEach(source =>{
        const sourceIndex=DFS.nodesID.indexOf(source);
        if (sourceIndex!==-1 && !DFS.visited[sourceIndex]){
            DFS=nodeDFS(DFS,sourceIndex);           
        }
    });
    return DFS.dfsOrder;
}


function nodeDFS(DFS:DFS,nodeIndex:number):DFS{
    
    // mark the node as visited
    DFS.visited[nodeIndex] = true;
    
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
            if (!DFS.visited[childIndex]){
            
                // mark the edge as a tree edge
                console.log("Tree Edge: " + DFS.nodesID[nodeIndex] + "-->" + DFS.nodesID[childIndex]+"\n");
                
                // dfs through the child node
                DFS=nodeDFS(DFS,childIndex);

            } else { // if the child node had already been visited
            
                // if this node had been visited for the first time after his child node
                // and ???????????  (child endtime not done, so 0??) 
                // => back edge 
                if ( DFS.start_time[nodeIndex] > DFS.start_time[childIndex] && DFS.end_time[nodeIndex] < DFS.end_time[childIndex]){
                
                    console.log("Back Edge: " + DFS.nodesID[nodeIndex] + "-->" + DFS.nodesID[childIndex]+"\n");
                }
                    
                // if this node is an ancestor of the child node, but not a tree edge
                // i.e node first visited before his child
                // and ??? (node endtime not done, so 0??) 
                // => forward edge
                else if ( DFS.start_time[nodeIndex] < DFS.start_time[childIndex] && DFS.end_time[nodeIndex] > DFS.end_time[childIndex]) {
                    console.log("Forward Edge: " + DFS.nodesID[nodeIndex] + "-->" + DFS.nodesID[childIndex]+"\n");
                }
                
                // if parent and neighbour node do not 
                // have any ancestor and descendant relationship between them
                // if this node had been visited for the first time after his child node
                // and ???? (node endtime not done, so 0??)
                // => cross edge
                else if (DFS.start_time[nodeIndex] > DFS.start_time[childIndex] && DFS.end_time[nodeIndex] > DFS.end_time[childIndex]) {
                    console.log("Cross Edge: " + DFS.nodesID[nodeIndex] + "-->" + DFS.nodesID[childIndex]+"\n");
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
    
