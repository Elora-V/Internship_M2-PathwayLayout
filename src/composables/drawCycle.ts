import { Subgraph, TypeSubgraph } from "@/types/Subgraph";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";


export function drawAllCycles(subgraphNetwork:SubgraphNetwork):void {
    const network = subgraphNetwork.network.value;
    const cycles = Object.values(subgraphNetwork.cycles);

    // Find the largest cycle that does not have a forSubgraph of type cycle : the first one to draw
    const parentCycles = cycles.filter(cycle => !cycle.forSubgraph || cycle.forSubgraph.type !== TypeSubgraph.CYCLE);
    if (parentCycles.length === 0) {
        console.error("No cycle found without a forSubgraph of type cycle");
        return;
    }
    parentCycles.sort((a, b) => b.nodes.length - a.nodes.length);
    const largestParentCycle = parentCycles[0];
    drawCycle(subgraphNetwork, largestParentCycle.name);


    // Drawing the others :
    // Remove the drawn cycle from the list
    const remainingCycles = cycles.filter(cycle => cycle.name !== largestParentCycle.name);

    // Draw the remaining cycles, starting with the one with the most fixed nodes
    while (remainingCycles.length > 0) {
        remainingCycles.sort((a, b) => {
            const fixedNodesA = a.nodes.filter(node => network.nodes[node].metadata && network.nodes[node].metadata.fixedInCycle).length;
            const fixedNodesB = b.nodes.filter(node => network.nodes[node].metadata && network.nodes[node].metadata.fixedInCycle).length;
            return fixedNodesB - fixedNodesA || b.nodes.length - a.nodes.length;
        });
        const cycleToDraw = remainingCycles[0]; // the cycle with the most fixed nodes
        drawCycle(subgraphNetwork, cycleToDraw.name);
        remainingCycles.shift();
    }
}



function drawCycle(subgraphNetwork:SubgraphNetwork,cycleToDrawID:string,radius:number|undefined=undefined,radiusFactor:number=15):void {

    console.log('drawing '+cycleToDrawID);
    
    let cycle:string[]=[];
    let centroidX :number;
    let centroidY :number;

    if (cycleToDrawID in subgraphNetwork.cycles){
        cycle=subgraphNetwork.cycles[cycleToDrawID].nodes;
    }else{  
        console.log('argument cycleToDraw invalid');
    }

    // Check if the node are present in the graph, and see if position is fixed in another cycle
    const network = subgraphNetwork.network.value;
    let cycleExist = true;
    const nodesFixed:string[]=[];
    cycle.forEach(node=>{
        if (!(node in network.nodes)){
            cycleExist=false;
        } else if (network.nodes[node].metadata && network.nodes[node].metadata.fixedInCycle){
            nodesFixed.push(node);
        }
    });


    if (cycleExist && cycle.length>0){

        if (nodesFixed.length===0){ // if independant cycle

            // radius
            if (radius === undefined){
                radius = getRadiusSize(cycle,radiusFactor);
            }
            subgraphNetwork.cycles[cycleToDrawID].metadata.radius=radius;

            // centroid
            if (subgraphNetwork.cycles[cycleToDrawID].metadata && subgraphNetwork.cycles[cycleToDrawID].metadata["x"] && subgraphNetwork.cycles[cycleToDrawID].metadata["y"]){
                centroidX=subgraphNetwork.cycles[cycleToDrawID].metadata["x"] as number;
                centroidY=subgraphNetwork.cycles[cycleToDrawID].metadata["y"] as number;
            }else {
                const centroid=centroidFromNodes(cycle,subgraphNetwork);
                centroidX=centroid.x;
                centroidY=centroid.y;
            }
            subgraphNetwork.cycles[cycleToDrawID].metadata.centroid={x:centroidX,y:centroidY};

            
            // Shift cycle 
            const topIndex = findTopCycleNode(subgraphNetwork,cycle); // first node of list is the top 

            const cycleCopy= cycle.slice();
            const shiftedCycle = cycleCopy.splice(topIndex).concat(cycleCopy);

            // Give position to each node
            cycleNodesCoordinates(cycleToDrawID,shiftedCycle,centroidX,centroidY,radius,subgraphNetwork,-Math.PI/2);

        } else if (nodesFixed.length===1){
            const nodeFixed=network.nodes[nodesFixed[0]];

             // first node is the one fixed :
             const cycleCopy= cycle.slice();
             const firstIndex=cycle.indexOf(nodesFixed[0]);
             const shiftedCycle = cycleCopy.splice(firstIndex).concat(cycleCopy);

            // radius
            if (radius === undefined){
                radius = getRadiusSize(cycle,radiusFactor);
            }
            subgraphNetwork.cycles[cycleToDrawID].metadata.radius=radius;

            //centroid depending on fixed cycle
            const radiusFixedCycle=subgraphNetwork.cycles[nodeFixed.metadata.fixedCycle as string].metadata.radius as number;
            const centroidFixedCycle=subgraphNetwork.cycles[nodeFixed.metadata.fixedCycle as string].metadata.centroid;
            const fixedAngle = Math.atan2(nodeFixed.y - centroidFixedCycle["y"], nodeFixed.x - centroidFixedCycle["x"]);
            const d = radius + radiusFixedCycle; 
            const centroidX = centroidFixedCycle["x"] + d * Math.cos(fixedAngle);
            const centroidY = centroidFixedCycle["y"] + d * Math.sin(fixedAngle);
            subgraphNetwork.cycles[cycleToDrawID].metadata.centroid={x:centroidX,y:centroidY};
            

            // shift of start angle (default:pi/2) : angle of fixed node in the new cycle (with centroid calculted before)
            const shiftAngle = Math.atan2(nodeFixed.y - centroidY, nodeFixed.x - centroidX);
            
            // drawing :
            cycleNodesCoordinates(cycleToDrawID,shiftedCycle,centroidX,centroidY,radius,subgraphNetwork,shiftAngle);
             
        }
    }

}


function findTopCycleNode(subgraphNetwork: SubgraphNetwork, cycleNodes:string[]):number{

    let minY:number=Infinity; // min Y as y-axis as in matrix, not as usual (infinity at the bottom, -inf at the top)
    let cycleNodeLinkedMinY:number=0; // node, in cycle, linked with the highest node (min y)
    const network=subgraphNetwork.network.value;

    for(let i=0;i<cycleNodes.length;i++){

        const node=cycleNodes[i];
        // get neighbors of node that aren't in the cycle
        const nodeNeighbors = network.links
            .filter(link => link.source.id === node || link.target.id === node) // get link linked with node
            .map(link => link.source.id === node ? link.target.id : link.source.id) // get the other node 
            .filter(id => !cycleNodes.includes(id)); // no node from this cycle
            

        nodeNeighbors.forEach(neighbor=>{
            if(network.nodes[neighbor] && network.nodes[neighbor].y){
                if(network.nodes[neighbor].y<minY){
                    minY=network.nodes[neighbor].y;
                    cycleNodeLinkedMinY=i;
                }
            }
        });
    }
    
    return cycleNodeLinkedMinY;
}


function cycleNodesCoordinates(cycleName:string,cycle:string[],centroidX:number,centroidY:number,radius:number,subgraphNetwork:SubgraphNetwork,shiftAngle:number=-Math.PI/2){
    const network=subgraphNetwork.network.value;
    cycle.forEach((node, i) => {
        const nodeI = network.nodes[node];
        // positive shift angle rotate cycle to the right, negative to the left
        const x = centroidX + radius * Math.cos(2 * Math.PI * i / cycle.length + shiftAngle );
        const y = centroidY + radius * Math.sin(2 * Math.PI * i / cycle.length  + shiftAngle );
        nodeI.x = x;
        nodeI.y = y; 
        if (!nodeI.metadata){
            nodeI.metadata = {};
        }
        nodeI.metadata.fixedInCycle= true;
        nodeI.metadata.fixedCycle= cycleName;
        
    });
}

function getRadiusSize(cycle:string[],radiusFactor:number=15){
    return cycle.length*radiusFactor;
}

function centroidFromNodes(nodesList:string[],subgraphNetwork:SubgraphNetwork):{x:number,y:number}{
    if (nodesList.length>0){
        const network=subgraphNetwork.network.value;
        let centroid={x:0,y:0}
        nodesList.forEach(node=> {
            if ("x" in network.nodes[node] && "y" in network.nodes[node]){
                centroid.x += network.nodes[node].x;
                centroid.y += network.nodes[node].y;
            }    
        });
        return {x:centroid.x/nodesList.length,y:centroid.y/nodesList.length};
    }
    return {x:0,y:0};
}

function centroidOneFixedCycleNode(subgraphNetwork:SubgraphNetwork,nodeFixedID:string,radius:number):{x:number,y:number}{
    const nodeFixed=subgraphNetwork.network.value.nodes[nodeFixedID];
    const radiusFixedCycle=subgraphNetwork.cycles[nodeFixed.metadata.fixedCycle as string].metadata.radius as number;
    const centroidFixedCycle=subgraphNetwork.cycles[nodeFixed.metadata.fixedCycle as string].metadata.centroid;
    const fixedAngle = Math.atan2(nodeFixed.y - centroidFixedCycle["y"], nodeFixed.x - centroidFixedCycle["x"]);
    const d = radius + radiusFixedCycle; 
    const centroidX = centroidFixedCycle["x"] + d * Math.cos(fixedAngle);
    const centroidY = centroidFixedCycle["y"] + d * Math.sin(fixedAngle);
    return {x:centroidX,y:centroidY}
}