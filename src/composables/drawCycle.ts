import { Subgraph, TypeSubgraph } from "@/types/Subgraph";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";


export function drawAllCycles(subgraphNetwork:SubgraphNetwork):void {
    const network = subgraphNetwork.network.value;
    const cycles = Object.values(subgraphNetwork.cycles);
    let groupCycle:string[]=[];

    // Find the largest cycle that does not have a forSubgraph of type cycle : the first one to draw
    const parentCycles = cycles.filter(cycle => !cycle.forSubgraph || cycle.forSubgraph.type !== TypeSubgraph.CYCLE);
    if (parentCycles.length === 0) {
        console.error("No cycle found without a forSubgraph of type cycle");
        return;
    }
    parentCycles.sort((a, b) => b.nodes.length - a.nodes.length);
    const largestParentCycle = parentCycles[0];
    groupCycle.push(largestParentCycle.name);
    drawCycle(subgraphNetwork, largestParentCycle.name);


    // Drawing the others :
    // Remove the drawn cycle from the list
    const remainingCycles = cycles.filter(cycle => cycle.name !== largestParentCycle.name);

    // Check if remaining cycle are independant of the drawn cycles
    let groupCycleIsDraw=isRemainingCycleIndepOfDrawing(remainingCycles, subgraphNetwork);
    if (groupCycleIsDraw){
        console.log('independant of the cycles drawn');
        console.log(groupCycle); 
        groupCycle=[];
    }
   

    // Draw the remaining cycles, starting with the one with the most fixed nodes
    while (remainingCycles.length > 0) {
        remainingCycles.sort((a, b) => {
            const fixedNodesA = a.nodes.filter(node => network.nodes[node].metadata && network.nodes[node].metadata.fixedInCycle).length;
            const fixedNodesB = b.nodes.filter(node => network.nodes[node].metadata && network.nodes[node].metadata.fixedInCycle).length;
            return fixedNodesB - fixedNodesA || b.nodes.length - a.nodes.length;
        });

        const cycleToDraw = remainingCycles[0]; // the cycle with the most fixed nodes
        drawCycle(subgraphNetwork, cycleToDraw.name);
        groupCycle.push(cycleToDraw.name);

        // Check if remaining cycle are independant of the drawn cycles
        remainingCycles.shift();
        groupCycleIsDraw=isRemainingCycleIndepOfDrawing(remainingCycles, subgraphNetwork);
        if (groupCycleIsDraw){
            console.log('independant of the cycles drawn');
            console.log(groupCycle);
            groupCycle=[];
        }

    }
}



function drawCycle(subgraphNetwork:SubgraphNetwork,cycleToDrawID:string,radius:number|undefined=undefined,radiusFactor:number=15):void {

    console.log('drawing '+cycleToDrawID);
    
    let cycle:string[]=[];
    let centroidX :number;
    let centroidY :number;
    if (!subgraphNetwork.cycles[cycleToDrawID].metadata)  subgraphNetwork.cycles[cycleToDrawID].metadata={};
    subgraphNetwork.cycles[cycleToDrawID].metadata["radius"]=undefined;
    subgraphNetwork.cycles[cycleToDrawID].metadata["centroid"]={x:undefined,y:undefined};
    

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

        if (nodesFixed.length===0){ // if independant cycle ----------------------------------------------------------------------------------

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

        } else if (nodesFixed.length===1){ // if cycle linked to another cycle by one node ----------------------------------------------------------------------------------
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
             
        } else { // several node in common with other cycle(s) ----------------------------------------------------------------------------------

            const unfixedInterval=getUnfixedIntervals(cycle,subgraphNetwork);
            unfixedInterval.forEach(interval=>{

                const startNode=cycle[(interval[0]-1+ cycle.length) % cycle.length];
                const endNode=cycle[(interval[1]+1+ cycle.length) % cycle.length];
                lineNodesCoordinates(network.nodes[startNode],network.nodes[endNode],cycle.slice(interval[0],interval[1]+1),subgraphNetwork);

            });

        }
    }

}

function getUnfixedIntervals(nodes:string[],subgraphNetwork:SubgraphNetwork) {
    let intervals:number[][] = [];
    let start = null;
    const network=subgraphNetwork.network.value;
    nodes.forEach((nodeID,i) => {
        const node=network.nodes[nodeID];
        if (node.metadata && !node.metadata.fixedInCycle) {
            if (start === null) {
                start = i;
            }
        } else {
            if (start !== null) {
                intervals.push([start, i - 1]);
                start = null;
            }
        }
    });

    // Handle case where the last node is fixed
    if (start !== null) {
        intervals.push([start, nodes.length - 1]);
    }

    return intervals;
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

function lineNodesCoordinates(start: {x: number, y: number}, end: {x: number, y: number}, nodes: string[],subgraphNetwork:SubgraphNetwork):void {
    const network=subgraphNetwork.network.value;
    // Calculate direction vector
    let dx = end.x - start.x;
    let dy = end.y - start.y;

    // Calculate distance between start and end
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction vector to get unit vector
    let ux = dx / distance;
    let uy = dy / distance;

    // Calculate distance between each node
    let nodeDistance = distance / (nodes.length + 1);

    // Place nodes
    nodes.forEach((node, i) => {
        let d = nodeDistance * (i + 1);
        const x= start.x + ux * d;
        const y = start.y + uy * d;
        network.nodes[node].x = x;
        network.nodes[node].y = y;
    });

}


function cycleNodesCoordinates(cycleName:string,cycle:string[],centroidX:number,centroidY:number,radius:number,subgraphNetwork:SubgraphNetwork,shiftAngle:number=-Math.PI/2):void{
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



function euclideanDistance(point1: {x: number, y: number}, point2: {x: number, y: number}): number {
    let dx = point2.x - point1.x;
    let dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// function totalIntervals(startArc: {x: number, y: number}, endArc: {x: number, y: number}, centroidArc: {x: number, y: number}, nodesInArc: number): number {
//     // Calculate distances
//     let a = euclideanDistance(startArc, endArc);
//     let b = euclideanDistance(startArc, centroidArc);
//     let c = euclideanDistance(endArc, centroidArc);

//     // Calculate angle of arc using law of cosines
//     let angle = Math.acos((b*b + c*c - a*a) / (2 * b * c));

//     // Calculate total intervals in full circle
//     let totalIntervals = Math.round(2 * Math.PI / angle) * nodesInArc;

//     return totalIntervals;
// }

// function centroidOneFixedCycleNode(subgraphNetwork:SubgraphNetwork,nodeFixedID:string,radius:number):{x:number,y:number}{
//     const nodeFixed=subgraphNetwork.network.value.nodes[nodeFixedID];
//     const radiusFixedCycle=subgraphNetwork.cycles[nodeFixed.metadata.fixedCycle as string].metadata.radius as number;
//     const centroidFixedCycle=subgraphNetwork.cycles[nodeFixed.metadata.fixedCycle as string].metadata.centroid;
//     const fixedAngle = Math.atan2(nodeFixed.y - centroidFixedCycle["y"], nodeFixed.x - centroidFixedCycle["x"]);
//     const d = radius + radiusFixedCycle; 
//     const centroidX = centroidFixedCycle["x"] + d * Math.cos(fixedAngle);
//     const centroidY = centroidFixedCycle["y"] + d * Math.sin(fixedAngle);
//     return {x:centroidX,y:centroidY}
// }



function isRemainingCycleIndepOfDrawing(remainingCycles:Subgraph[], subgraphNetwork:SubgraphNetwork):boolean{

    const network = subgraphNetwork.network.value;

    if (remainingCycles.every(cycle => 
        cycle.nodes.every(node => 
            !network.nodes[node].metadata || !network.nodes[node].metadata.fixedInCycle
        )
    )) {
        //  All nodes in all remaining cycles are unfixed
        return true;
    } else {
        //  At least one node in the remaining cycles fixed
       return false;
    }
}

function pushFromCycle(subgraphNetwork:SubgraphNetwork, cycleID:string):void{

    const network = subgraphNetwork.network.value;
    const nodesNetwork = Object.keys(network.nodes);

    // get cycle centroid and radius
    if (cycleID in subgraphNetwork.cycles && subgraphNetwork.cycles[cycleID].metadata && subgraphNetwork.cycles[cycleID].metadata.centroid){
        const centroid = subgraphNetwork.cycles[cycleID].metadata.centroid;
        const radius = subgraphNetwork.cycles[cycleID].metadata.radius;
    }

    // get list of nodes to move : all but the cycle with its shortcut
    const nodesCycle = subgraphNetwork.cycles[cycleID].nodes;
    console.log(nodesCycle);
        // shortcuts nodes :
    const associatedSubgraph=subgraphNetwork.cycles[cycleID].associatedSubgraphs; 
    const associatedSubgraphCycle = associatedSubgraph
        .filter(subgraph => subgraph.type === TypeSubgraph.CYCLE)
        .map(cycleSubgraph => cycleSubgraph.name);
    associatedSubgraphCycle.forEach(subgraphID => {
        subgraphNetwork.cycles[subgraphID].nodes.forEach(node => {
            if (!nodesCycle.includes(node)) {
                nodesCycle.push(node);
            }
        });
    });
    const nodeToPush = nodesNetwork.filter(node => !nodesCycle.includes(node)); // all nodes but the cycle (and it shortcuts)
    console.log(nodeToPush);
    // // push nodes
    // nodeToPush.forEach(nodeID => {
    //     const node=network.nodes[nodeID];
    //     // calculate angle
    //     let dx = node.x - centroid.x;
    //     let dy = node.y - centroid.y;
    //     let angle = Math.atan2(dy, dx);

    //     // calculate new position
    //     node.x = centroid.x + radius * Math.cos(angle);
    //     node.y = centroid.y + radius * Math.sin(angle);
    // });



}