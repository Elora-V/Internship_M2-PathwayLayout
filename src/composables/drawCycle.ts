import { Subgraph, TypeSubgraph } from "@/types/Subgraph";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { group } from "console";


export function coordinateAllCycles(subgraphNetwork:SubgraphNetwork):SubgraphNetwork {
    const network = subgraphNetwork.network.value;
    const cycles = subgraphNetwork.cycles? Object.values(subgraphNetwork.cycles):undefined;

    if (cycles && cycles.length > 0) {
        // creation first cycle group
        let group=0;
        let groupName=cycleGroupName(String(group));
        subgraphNetwork=addNewCycleGroup(subgraphNetwork,groupName);

        // Find the largest cycle that does not have a forSubgraph of type cycle : the first one to process -------------------
        const parentCycles = cycles.filter(cycle => !cycle.forSubgraph || cycle.forSubgraph.type !== TypeSubgraph.CYCLE);
        if (parentCycles.length === 0) {
            console.error("No cycle found without a forSubgraph of type cycle");
            return;
        }
        parentCycles.sort((a, b) => b.nodes.length - a.nodes.length);
        const largestParentCycle = parentCycles[0]; // get largest cycle
        subgraphNetwork.cyclesGroup[groupName].nodes.push(largestParentCycle.name); // add it to the current group of cycle
        coordinateCycle(subgraphNetwork, largestParentCycle.name,groupName); // drawing largest cycle


        // Drawing the others : --------------------------------------------------------------------------------------------

        // Remove the drawn cycle from the list
        const remainingCycles = cycles.filter(cycle => cycle.name !== largestParentCycle.name);

        // If group of connected cycle is drawn : update information
        const updateGroupCycle=updateGroupCycles(remainingCycles,subgraphNetwork,group,groupName);
        subgraphNetwork=updateGroupCycle.subgraphNetwork;
        if(updateGroupCycle.group!==group){
            group=updateGroupCycle.group;
            groupName=cycleGroupName(String(group));
        }

        // Draw the remaining cycles, starting with the one with the most fixed nodes (and if equal number : the largest one)
        while (remainingCycles.length > 0) {

            // sort cycles by number of fixed node (and then by size)
            remainingCycles.sort((a, b) => {
                const fixedNodesA = a.nodes.filter(node => network.nodes[node].metadata && network.nodes[node].metadata.fixedInCycle).length;
                const fixedNodesB = b.nodes.filter(node => network.nodes[node].metadata && network.nodes[node].metadata.fixedInCycle).length;
                return fixedNodesB - fixedNodesA || b.nodes.length - a.nodes.length;
            });

            const cycleToDraw = remainingCycles[0]; // the cycle with the most fixed nodes
            // if groupcycle do not exist : add one
            if (!(groupName in subgraphNetwork.cyclesGroup)){
                subgraphNetwork=addNewCycleGroup(subgraphNetwork,groupName);
            }
            // add the cycle to the current group of cycle
            subgraphNetwork.cyclesGroup[groupName].nodes.push(cycleToDraw.name); 
            // give coordinate to cycle node
            coordinateCycle(subgraphNetwork, cycleToDraw.name,groupName); 
            // remove cycle from the list of cycle to process
            remainingCycles.shift(); 

            // If group of connected cycle is processed : update information of cycle group
            const updateGroupCycle=updateGroupCycles(remainingCycles,subgraphNetwork,group,groupName);
            subgraphNetwork=updateGroupCycle.subgraphNetwork;
            if(updateGroupCycle.group!==group){
                group=updateGroupCycle.group;
                groupName=cycleGroupName(String(group));
            }

        }
    }
    return subgraphNetwork;
}

function coordinateCycle(subgraphNetwork:SubgraphNetwork, cycleToDrawID:string,groupCycleName:string):SubgraphNetwork{
    const network = subgraphNetwork.network.value;
    let centroidX :number=0;
    let centroidY :number=0;
    
    // Get nodes to place
    let cycle:string[]=[];
    if (cycleToDrawID in subgraphNetwork.cycles){
        cycle=subgraphNetwork.cycles[cycleToDrawID].nodes;
        subgraphNetwork.cycles[cycleToDrawID].metadata={};
    }else{  
        console.log('cycle not in subgraph network');
    }

    // Check existence of all nodes
    const cycleExist = cycle.every(node => node in network.nodes);

    // Nodes with attribute 'fixedInCycle'
    const nodesFixed = cycle.filter(node => 
        network.nodes[node].metadata && network.nodes[node].metadata.fixedInCycle
    );

    // Update node metadata to place them in cycleGroup
    cycle.forEach(node=>{
        network.nodes[node].metadata[TypeSubgraph.CYCLEGROUP]=groupCycleName;
    });

    // If cycle exist: place his nodes
    if (cycleExist && cycle.length>0){

        if (nodesFixed.length===0){ // if independant cycle (first of a group cycle)----------------------------------------------------------------------------------

            // radius and centroid
            const radius = getRadiusSize(cycle,15);
            subgraphNetwork.cycles[cycleToDrawID].metadata.radius=radius;   
            subgraphNetwork.cycles[cycleToDrawID].metadata.centroid={x:centroidX,y:centroidY};         
         
            // Shift cycle 
            const topIndex = findTopCycleNode(subgraphNetwork,cycle); // first node of list is the top 
            const cycleCopy= cycle.slice();
            const shiftedCycle = cycleCopy.splice(topIndex).concat(cycleCopy);

            // Give position to each node
            subgraphNetwork=cycleNodesCoordinates(cycleToDrawID,shiftedCycle,centroidX,centroidY,radius,subgraphNetwork,-Math.PI/2,groupCycleName);

        } else if (nodesFixed.length===1){ // if cycle linked to another cycle by one node ----------------------------------------------------------------------------------
            const nodeFixed=network.nodes[nodesFixed[0]];

             // first node is the one fixed :
             const cycleCopy= cycle.slice();
             const firstIndex=cycle.indexOf(nodesFixed[0]);
             const shiftedCycle = cycleCopy.splice(firstIndex).concat(cycleCopy);

            // radius
            const radius = getRadiusSize(cycle,15);
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
            
            // Give position to each node
            subgraphNetwork=cycleNodesCoordinates(cycleToDrawID,shiftedCycle,centroidX,centroidY,radius,subgraphNetwork,shiftAngle,groupCycleName);
             
        } else { // several node in common with other cycle(s) ----------------------------------------------------------------------------------

            const unfixedInterval=getUnfixedIntervals(cycle,subgraphNetwork);
            unfixedInterval.forEach(interval=>{

                const startNode=cycle[(interval[0]-1+ cycle.length) % cycle.length];
                const endNode=cycle[(interval[1]+1+ cycle.length) % cycle.length];
                // Give position to each node
                subgraphNetwork=lineNodesCoordinates(network.nodes[startNode],network.nodes[endNode],cycle.slice(interval[0],interval[1]+1),subgraphNetwork,groupCycleName);

            });

        }
    }


    return subgraphNetwork;
}

// function drawCycle(subgraphNetwork:SubgraphNetwork,cycleToDrawID:string,radius:number|undefined=undefined,radiusFactor:number=15):void {

//     console.log('drawing '+cycleToDrawID);
    
//     let cycle:string[]=[];
//     let centroidX :number;
//     let centroidY :number;
//     if (!subgraphNetwork.cycles[cycleToDrawID].metadata)  subgraphNetwork.cycles[cycleToDrawID].metadata={};
//     subgraphNetwork.cycles[cycleToDrawID].metadata["radius"]=undefined;
//     subgraphNetwork.cycles[cycleToDrawID].metadata["centroid"]=undefined;
    

//     if (cycleToDrawID in subgraphNetwork.cycles){
//         cycle=subgraphNetwork.cycles[cycleToDrawID].nodes;
//     }else{  
//         console.log('argument cycleToDraw invalid');
//     }

//     // Check if the node are present in the graph, and see if position is fixed in another cycle
//     const network = subgraphNetwork.network.value;
//     let cycleExist = true;
//     const nodesFixed:string[]=[];
//     cycle.forEach(node=>{
//         if (!(node in network.nodes)){
//             cycleExist=false;
//         } else if (network.nodes[node].metadata && network.nodes[node].metadata.fixedInCycle){
//             nodesFixed.push(node);
//         }
//     });


//     if (cycleExist && cycle.length>0){

//         if (nodesFixed.length===0){ // if independant cycle ----------------------------------------------------------------------------------

//             // radius
//             if (radius === undefined){
//                 radius = getRadiusSize(cycle,radiusFactor);
//             }
//             subgraphNetwork.cycles[cycleToDrawID].metadata.radius=radius;

//             // centroid
//             if (subgraphNetwork.cycles[cycleToDrawID].metadata && subgraphNetwork.cycles[cycleToDrawID].metadata["x"] && subgraphNetwork.cycles[cycleToDrawID].metadata["y"]){
//                 centroidX=subgraphNetwork.cycles[cycleToDrawID].metadata["x"] as number;
//                 centroidY=subgraphNetwork.cycles[cycleToDrawID].metadata["y"] as number;
//             }else {
//                 const centroid=centroidFromNodes(cycle,subgraphNetwork);
//                 centroidX=centroid.x;
//                 centroidY=centroid.y;
//             }
//             subgraphNetwork.cycles[cycleToDrawID].metadata.centroid={x:centroidX,y:centroidY};

            
//             // Shift cycle 
//             const topIndex = findTopCycleNode(subgraphNetwork,cycle); // first node of list is the top 

//             const cycleCopy= cycle.slice();
//             const shiftedCycle = cycleCopy.splice(topIndex).concat(cycleCopy);

//             // Give position to each node
//             cycleNodesCoordinates(cycleToDrawID,shiftedCycle,centroidX,centroidY,radius,subgraphNetwork,-Math.PI/2);

//         } else if (nodesFixed.length===1){ // if cycle linked to another cycle by one node ----------------------------------------------------------------------------------
//             const nodeFixed=network.nodes[nodesFixed[0]];

//              // first node is the one fixed :
//              const cycleCopy= cycle.slice();
//              const firstIndex=cycle.indexOf(nodesFixed[0]);
//              const shiftedCycle = cycleCopy.splice(firstIndex).concat(cycleCopy);

//             // radius
//             if (radius === undefined){
//                 radius = getRadiusSize(cycle,radiusFactor);
//             }
//             subgraphNetwork.cycles[cycleToDrawID].metadata.radius=radius;

//             //centroid depending on fixed cycle
//             const radiusFixedCycle=subgraphNetwork.cycles[nodeFixed.metadata.fixedCycle as string].metadata.radius as number;
//             const centroidFixedCycle=subgraphNetwork.cycles[nodeFixed.metadata.fixedCycle as string].metadata.centroid;
//             const fixedAngle = Math.atan2(nodeFixed.y - centroidFixedCycle["y"], nodeFixed.x - centroidFixedCycle["x"]);
//             const d = radius + radiusFixedCycle; 
//             const centroidX = centroidFixedCycle["x"] + d * Math.cos(fixedAngle);
//             const centroidY = centroidFixedCycle["y"] + d * Math.sin(fixedAngle);
//             subgraphNetwork.cycles[cycleToDrawID].metadata.centroid={x:centroidX,y:centroidY};
            

//             // shift of start angle (default:pi/2) : angle of fixed node in the new cycle (with centroid calculted before)
//             const shiftAngle = Math.atan2(nodeFixed.y - centroidY, nodeFixed.x - centroidX);
            
//             // drawing :
//             cycleNodesCoordinates(cycleToDrawID,shiftedCycle,centroidX,centroidY,radius,subgraphNetwork,shiftAngle);
             
//         } else { // several node in common with other cycle(s) ----------------------------------------------------------------------------------

//             const unfixedInterval=getUnfixedIntervals(cycle,subgraphNetwork);
//             unfixedInterval.forEach(interval=>{

//                 const startNode=cycle[(interval[0]-1+ cycle.length) % cycle.length];
//                 const endNode=cycle[(interval[1]+1+ cycle.length) % cycle.length];
//                 lineNodesCoordinates(network.nodes[startNode],network.nodes[endNode],cycle.slice(interval[0],interval[1]+1),subgraphNetwork);

//             });

//         }
//     }

// }

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

function lineNodesCoordinates(start: {x: number, y: number}, end: {x: number, y: number}, nodes: string[],subgraphNetwork:SubgraphNetwork,groupCycleName?:string):SubgraphNetwork {
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
        
        // Give position 
        if (groupCycleName){
            if (groupCycleName in subgraphNetwork.cyclesGroup){
                if (!subgraphNetwork.cyclesGroup[groupCycleName].metadata[node]){
                    subgraphNetwork.cyclesGroup[groupCycleName].metadata[node] = {};
                }
                subgraphNetwork.cyclesGroup[groupCycleName].metadata[node]["x"]=x;
                subgraphNetwork.cyclesGroup[groupCycleName].metadata[node]["y"]=y;
            } else {
                console.error("CycleGroup not in subgraphNetwork");
            }
        } else if (node in subgraphNetwork.network.value.nodes) {
            subgraphNetwork.network.value.nodes[node].x=x;
            subgraphNetwork.network.value.nodes[node].y=y;
        } else{
            console.error("Node not in network or groupcycle not provided")
        }
        
    });    
    return subgraphNetwork;
}


function cycleNodesCoordinates(cycleName:string,cycle:string[],centroidX:number,centroidY:number,radius:number,subgraphNetwork:SubgraphNetwork,shiftAngle:number=-Math.PI/2,groupcycle?:string,):SubgraphNetwork{
    const network=subgraphNetwork.network.value;
    cycle.forEach((node, i) => {
        const nodeNetwork=network.nodes[node];
        // positive shift angle rotate cycle to the right, negative to the left
        const x = centroidX + radius * Math.cos(2 * Math.PI * i / cycle.length + shiftAngle );
        const y = centroidY + radius * Math.sin(2 * Math.PI * i / cycle.length  + shiftAngle );
        
        // Give position 
        if (groupcycle){
            if (groupcycle in subgraphNetwork.cyclesGroup){
                if (!subgraphNetwork.cyclesGroup[groupcycle].metadata[node]){
                    subgraphNetwork.cyclesGroup[groupcycle].metadata[node] = {};
                }
                subgraphNetwork.cyclesGroup[groupcycle].metadata[node]["x"]=x;
                subgraphNetwork.cyclesGroup[groupcycle].metadata[node]["y"]=y;
            } else {
                console.error("CycleGroup not in subgraphNetwork");
            }
        } else if (node in subgraphNetwork.network.value.nodes) {
            subgraphNetwork.network.value.nodes[node].x=x;
            subgraphNetwork.network.value.nodes[node].y=y;
        } else{
            console.error("Node not in network or groupcycle not provided")
        }

        // Fix the nodes 
        if (!nodeNetwork.metadata) nodeNetwork.metadata={};
        nodeNetwork.metadata.fixedInCycle= true;
        nodeNetwork.metadata.fixedCycle= cycleName;
        
    });

    return subgraphNetwork;
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

function cycleGroupName(name:string):string{
    return "cycle_group_"+name;
}
function addNewCycleGroup(subgraphNetwork:SubgraphNetwork, groupName:string):SubgraphNetwork{
    if(!subgraphNetwork.cyclesGroup){
        subgraphNetwork.cyclesGroup={};
    }
    subgraphNetwork.cyclesGroup[groupName]={name:groupName,nodes:[],metadata:{}};
    return subgraphNetwork;
}

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


function updateGroupCycles(remainingCycles:Subgraph[], subgraphNetwork:SubgraphNetwork,group:number,groupCycleName:string): {subgraphNetwork:SubgraphNetwork,group:number}{
    const groupCycleIsDraw=isRemainingCycleIndepOfDrawing(remainingCycles, subgraphNetwork);
    if (groupCycleIsDraw){
        console.log('independant of the cycles drawn');
        // get size of group and update cycle group information
        if(subgraphNetwork.cyclesGroup[groupCycleName].metadata){
            const listCoord = Object.values(subgraphNetwork.cyclesGroup[groupCycleName].metadata)
                            .filter(item => item["x"] !== undefined && item["y"] !== undefined);
            const {width,height}=rectangleSize(listCoord as {x:number,y:number}[]);
            subgraphNetwork.cyclesGroup[groupCycleName].width=width;
            subgraphNetwork.cyclesGroup[groupCycleName].height=height;
        }
        // change group
        group+=1;
    }
    return {subgraphNetwork:subgraphNetwork,group:group};
}

function rectangleSize(listCoordinates:{x:number,y:number}[]):{width:number,height:number}{
    const xCoordinates=listCoordinates.map(coord=>coord.x);
    const yCoordinates=listCoordinates.map(coord=>coord.y);
    return {width:Math.max(...xCoordinates)-Math.min(...xCoordinates),height:Math.max(...yCoordinates)-Math.min(...yCoordinates)};
}

// function pushFromIndepGroupCycles(subgraphNetwork:SubgraphNetwork, groupCyclesID:string[],allGroupCycleDrawn:string[][]):void{

//     console.log('--------------------------------------------------------------------');
//     // nodes in the group of cycle that won't move (others nodes will be pushed deprending on their positions)
//     const nodesCycles = groupCyclesID
//     .filter(cycleID => cycleID in subgraphNetwork.cycles) // Check if cycleID exists
//     .flatMap(cycleID => subgraphNetwork.cycles[cycleID].nodes) // get all nodes from all cycles
//     .reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], []); // remove duplicates

//     // centroid of the group
//     const centroid = centroidFromNodes(nodesCycles,subgraphNetwork);

//     const radius=subgraphNetwork.cycles[groupCyclesID[0]].metadata.radius as number; // TO CHANGE when several nodes 

//     // get list of nodes to push : all but the cycle with its shortcut
//     // and group of cycle already draw considered as a node
//     const network = subgraphNetwork.network.value;
//     const nodesNetwork = Object.keys(network.nodes).filter(node => !nodesCycles.includes(node));
//     const nodesGroupCycleDrawn=allGroupCycleDrawn.flatMap(groupCycle=>groupCycle)
//         .flatMap(cycleID=>subgraphNetwork.cycles[cycleID].nodes) // get all nodes from all cycles
//         .reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], []); // remove duplicates
//     const nodesNotInDrawCycle=nodesNetwork.filter(node => !nodesGroupCycleDrawn.includes(node)); 
//     let nodeToPush=nodesNotInDrawCycle.filter(node => !nodesGroupCycleDrawn.includes(node)); 
//     allGroupCycleDrawn.forEach(groupCycle=>{
//         nodeToPush.push(groupCycle[0]); // metanode of cycle group 
//     });
    
    
//     // Need to push ?

//     const needPush=nodesInsideMetanode(groupCyclesID,nodesNetwork,subgraphNetwork);
//     console.log(needPush);

//     // push nodes

//     if (needPush){
//         nodeToPush.forEach(nodeID =>{
            
//             if (nodeID in subgraphNetwork.cycles){ // if in a cycle
//                 // get connected cycle group 
//                 const fullGroupCycle=allGroupCycleDrawn.filter(groupCycle=> groupCycle.includes(nodeID))[0];
//                 const nodesAsMetanode=fullGroupCycle.flatMap(cycleID=>subgraphNetwork.cycles[cycleID].nodes)
//                     .reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], []); // remove duplicates
//                 const metanodeCentroid=centroidFromNodes(nodesAsMetanode,subgraphNetwork);

//                 const distanceCentroidToMetanode=euclideanDistance(centroid,metanodeCentroid);
//                 const distanceToMoveCentroid=(distanceCentroidToMetanode/radius+1)*radius;
//                 pushMetanode(nodesAsMetanode,centroid,distanceToMoveCentroid,subgraphNetwork);


//             }else if (nodeID in network.nodes){ // if classic node

//                 const distanceCentroidToNode=euclideanDistance(centroid,network.nodes[nodeID]);
//                 const distanceToMove=(distanceCentroidToNode/radius+1)*radius;
//                 pushMetanode([nodeID],centroid,distanceToMove,subgraphNetwork);

//             }

//         });
//     }
    
// }

// function pushMetanode(metanode:string[],centroidToPushfrom:{x:number,y:number},radius:number=1,subgraphNetwork:SubgraphNetwork):void{
//     const network = subgraphNetwork.network.value;
//     if (metanode.length===1){
//         const node=network.nodes[metanode[0]];
//         let dx = node.x - centroidToPushfrom.x;
//         let dy = node.y - centroidToPushfrom.y;
//         let angle = Math.atan2(dy, dx);
//         node.x = centroidToPushfrom.x + radius * Math.cos(angle);
//         node.y = centroidToPushfrom.y + radius * Math.sin(angle);
//     }else{

//         // MARCHE PAS

//         // const centroidMetanode=centroidFromNodes(metanode,subgraphNetwork);
//         // let dx = centroidMetanode.x - centroidToPushfrom.x;
//         // let dy = centroidMetanode.y - centroidToPushfrom.y;
//         // let angle = Math.atan2(dy, dx);
//         // const newCentroid={x : centroidToPushfrom.x + radius * Math.cos(angle),
//         //                     y : centroidToPushfrom.y + radius * Math.sin(angle)};

//         // metanode.forEach(nodeID=>{
//         //     const node=network.nodes[nodeID];
//         //     node.x += newCentroid.x - centroidMetanode.x;
//         //     node.y += newCentroid.y - centroidMetanode.y;
//         // });
//     } 
// }

// function nodesInsideMetanode(groupCyclesID:string[],nodeToCheck:string[],subgraphNetwork:SubgraphNetwork):boolean{


//     const cycles=groupCyclesID.filter(cycleID => cycleID in subgraphNetwork.cycles && subgraphNetwork.cycles[cycleID].metadata 
//         && "radius" in subgraphNetwork.cycles[cycleID].metadata && subgraphNetwork.cycles[cycleID].metadata.radius !== undefined
//         && "centroid" in subgraphNetwork.cycles[cycleID].metadata &&  subgraphNetwork.cycles[cycleID].metadata.centroid 
//         && subgraphNetwork.cycles[cycleID].metadata.centroid["x"] !== undefined
//         && typeof subgraphNetwork.cycles[cycleID].metadata.centroid["y"] !== undefined
//     ) 
    
//     let i=0;
//     let flag=true;
//     while (flag && i<cycles.length){
//         flag=!nodesInsideCircle(cycles[i],nodeToCheck,subgraphNetwork);
//         i++;
//     }
//     return !flag;
// }

// function nodesInsideCircle(cycleID:string,nodeToCheck:string[],subgraphNetwork:SubgraphNetwork):boolean{
//     const centroid=subgraphNetwork.cycles[cycleID].metadata.centroid as {x:number,y:number};
//     const radius=subgraphNetwork.cycles[cycleID].metadata.radius as number;


//     let i=-1;
//     let flag=true;
//     while (flag && i<nodeToCheck.length){
//         i++;
//         if( nodeToCheck[i] && Object.keys(subgraphNetwork.network.value.nodes).includes(nodeToCheck[i]) ){
            
//             const node=subgraphNetwork.network.value.nodes[nodeToCheck[i]];
//             const distance=euclideanDistance(node,centroid);
//             if (distance<=radius){
//                 flag=false;
//             }
            
//         }else{
//             //console.log('node '+nodeToCheck[i]+' not in network'); // PROBLEM !!!
//         }
        
        
//     }
//     return !flag;
// }

