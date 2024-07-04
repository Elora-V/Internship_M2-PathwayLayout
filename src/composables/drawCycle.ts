import { Subgraph, TypeSubgraph } from "@/types/Subgraph";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { group } from "console";
import { start } from "repl";
import { a } from "vitest/dist/suite-ghspeorC";
import * as d3 from 'd3';
import { Link } from "@metabohub/viz-core/src/types/Link";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { link } from "fs";
import { emit } from "process";
import { getMeanNodesSizePixel, getSizeAllGroupCycles, medianLengthDistance, rectangleSize } from "./calculateSize";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";
import { countIntersectionGraph, countOverlapNodes, isIntersectionGraph, isOverlapNodes, isOverlapNodesEdges } from "./countIntersections";



//------------------------------------------------------------------------------------------------------------
//__________________________________Calculate coordinates for nodes in cycles______________________________________________________
//------------------------------------------------------------------------------------------------------------



/**
 * give coordinates for all cycles in the subgraph network.
 * @param subgraphNetwork - The subgraph network containing cycles.
 * @param allowInterncircle - Whether to allow internal circles within cycles. Default is false.
 * @param radiusFactor - The factor to determine the radius of the cycles. Default is 15.
 * @returns The updated subgraph network with coordinated cycles.
 */

export async function coordinateAllCycles(subgraphNetwork:SubgraphNetwork,allowInterncircle:boolean=false):Promise<SubgraphNetwork> {
    const network = subgraphNetwork.network.value;
    const cycles = subgraphNetwork.cycles? Object.values(subgraphNetwork.cycles):undefined;
    let i=0
    let newGroup=true;
    if (cycles && cycles.length > 0) {
        // creation first cycle group
        let group=0;
        let groupName=cycleGroupName(String(group));
        subgraphNetwork=addNewCycleGroup(subgraphNetwork,groupName);

        // Find the first cycle to draw : it shouldn't have a 'forgraph' of type cycle as it should be a parent -------------------
        const parentCycles = cycles.filter(cycle => !cycle.forSubgraph || cycle.forSubgraph.type !== TypeSubgraph.CYCLE);
        if (parentCycles.length === 0) {
            console.error("No cycle found without a forSubgraph of type cycle");
            return;
        }
        parentCycles.sort((a, b) => sortingCycleForDrawing(subgraphNetwork,a,b,true));
        const largestParentCycle = parentCycles[0]; // get largest cycle
        subgraphNetwork.cyclesGroup[groupName].nodes.push(largestParentCycle.name); // add it to the current group of cycle
        coordinateCycle(subgraphNetwork, largestParentCycle.name,groupName); // give coordinate for largest cycle

        // Drawing the others : --------------------------------------------------------------------------------------------

        // Remove the drawn cycle from the list
        const remainingCycles = cycles.filter(cycle => cycle.name !== largestParentCycle.name);

        // If group of connected cycle is drawn : update group cycle
        const updateGroupCycle=await updateGroupCycles(remainingCycles,subgraphNetwork,group,groupName);
        subgraphNetwork=updateGroupCycle.subgraphNetwork;
        if(updateGroupCycle.group!==group){
            group=updateGroupCycle.group;
            groupName=cycleGroupName(String(group));
            newGroup=true;
        }else{
            newGroup=false;
        }

        // Draw the remaining cycles, starting with the one with the most fixed nodes (and if equal number : the largest one)
        while (remainingCycles.length > 0 ) {

            // sort cycles by number of fixed node (and then by size)
            remainingCycles.sort((a, b) => sortingCycleForDrawing(subgraphNetwork,a,b,newGroup));

            const cycleToDraw = remainingCycles[0]; // the cycle with the most fixed nodes
            // if groupcycle do not exist : add one
            if (!(groupName in subgraphNetwork.cyclesGroup)){
                subgraphNetwork=addNewCycleGroup(subgraphNetwork,groupName);
            }
            // add the cycle to the current group of cycle
            subgraphNetwork.cyclesGroup[groupName].nodes.push(cycleToDraw.name); 
            // give coordinate to cycle node
            coordinateCycle(subgraphNetwork, cycleToDraw.name,groupName,allowInterncircle); 
            // remove cycle from the list of cycle to process
            remainingCycles.shift(); 

            // If group of connected cycle is processed : update cycle group
            const updateGroupCycle=await updateGroupCycles(remainingCycles,subgraphNetwork,group,groupName);
            subgraphNetwork=updateGroupCycle.subgraphNetwork;
            if(updateGroupCycle.group!==group){
                group=updateGroupCycle.group;
                groupName=cycleGroupName(String(group));
                newGroup=true;
            }else{
                newGroup=false;
            }

        }
    }
    return subgraphNetwork;
}

/**
 * Returns the cycle group name by appending the given name with a prefix.
 * 
 * @param name - The name to be appended with the prefix.
 * @returns The cycle group name.
 */
function cycleGroupName(name:string):string{
    return "cycle_group_"+name;
}
/**
 * Adds a new cycle group to the subgraph network.
 * 
 * @param subgraphNetwork - The subgraph network to add the cycle group to.
 * @param groupName - The name of the cycle group.
 * @returns The updated subgraph network with the added cycle group.
 */
function addNewCycleGroup(subgraphNetwork:SubgraphNetwork, groupName:string):SubgraphNetwork{
    if(!subgraphNetwork.cyclesGroup){
        subgraphNetwork.cyclesGroup={};
    }
    subgraphNetwork.cyclesGroup[groupName]={name:groupName,nodes:[],metadata:{}};
    return subgraphNetwork;
}

/**
 * Sorting function for knowing order of cycle drawing. 
 * First sort by number of circle fixed nodes (nodes fixed in a circle drawing), then by size, by number of parent nodes (of the cycle),  and finally by number of child nodes (of the cycle) .
 * @param subgraphNetwork - The subgraph network.
 * @param a - The first cycle to compare.
 * @param b - The second cycle to compare.
 * @returns A number indicating the sorting order.
 */
function sortingCycleForDrawing(subgraphNetwork:SubgraphNetwork,a:Subgraph,b:Subgraph,fullConstraint:boolean=false):number{
    const network=subgraphNetwork.network.value;

    // first sort by number of fixed nodes
    const fixedNodesA = a.nodes.filter(node => network.nodes[node].metadata && network.nodes[node].metadata.fixedCycle).length;
    const fixedNodesB = b.nodes.filter(node => network.nodes[node].metadata && network.nodes[node].metadata.fixedCycle).length;
    if (fixedNodesA !== fixedNodesB){
        return fixedNodesB - fixedNodesA;
    }else{
        // sort by size
        if ( !fullConstraint || b.nodes.length !== a.nodes.length ){
            return b.nodes.length - a.nodes.length;
        }else{
            // then by number of parent nodes
            const totalParentNodesA = parentNodeNotInCycle(subgraphNetwork, a.nodes)
                .flat().length;
            const totalParentNodesB = parentNodeNotInCycle(subgraphNetwork, b.nodes)
                .flat().length;
            if (totalParentNodesA !== totalParentNodesB){
                return totalParentNodesB - totalParentNodesA;
            }else{
                // then by number of child nodes
                const totalChildNodesA = childNodeNotInCycle(subgraphNetwork, a.nodes)
                    .flat().length;
                const totalChildNodesB = childNodeNotInCycle(subgraphNetwork, b.nodes)
                    .flat().length;
               
                return totalChildNodesB - totalChildNodesA;
            }
        }                   
    }
}



/**
 * Give coordinates for a cycle in a group of cycles. A group of cycle is cycles with common nodes. All the group of cycle are independent (no common nodes) from each other.
 * 
 * @param subgraphNetwork - The subgraph network containing the nodes and cycles.
 * @param cycleToDrawID - The ID of the cycle to draw.
 * @param groupCycleName - The name of the cycle group that contain the cycle to draw.
 * @param radiusFactor - The factor to determine the radius size of the cycle (default: 15).
 * @param allowInterncircle - A flag indicating whether to allow internal circles for fixed nodes (default: true).
 * 
 * @returns The updated subgraph network with the nodes placed in the cycle.
 */
function coordinateCycle(subgraphNetwork:SubgraphNetwork, cycleToDrawID:string,groupCycleName:string,allowInterncircle:boolean=true):SubgraphNetwork{
    const network = subgraphNetwork.network.value;
    
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

    // Nodes with attribute 'fixedCycle' : if a node had been fixed in a line, his position can change, if fixed in a circle , no change
    const nodesFixedCircle = cycle.filter(node => 
        network.nodes[node].metadata && network.nodes[node].metadata.fixedCycle
    );
    const nodesFixed = cycle.filter(node => 
        network.nodes[node].metadata && network.nodes[node].metadata.fixedInCycle
    );


    // Update node metadata to place them in cycleGroup
    cycle.forEach(node=>{
        network.nodes[node].metadata[TypeSubgraph.CYCLEGROUP]=groupCycleName;
    });

    // If cycle exist: place his nodes
    if (cycleExist && cycle.length>0){
        if (nodesFixedCircle.length===0){ // if independant cycle (first of a group cycle)----------------------------------------------------------------------------------

             subgraphNetwork=independentCycleCoordinates(subgraphNetwork,cycleToDrawID,groupCycleName);

        } else if (nodesFixedCircle.length===1){ // if cycle linked to another cycle by one node ----------------------------------------------------------------------------------
            
            const tangentNode=network.nodes[nodesFixedCircle[0]];
            subgraphNetwork=tangentCycleCoordinates(subgraphNetwork,cycleToDrawID,groupCycleName,tangentNode,nodesFixed,allowInterncircle);
            
             
        } else { // several node in common with other cycle(s) ----------------------------------------------------------------------------------

            subgraphNetwork=lineCycleCoordinates(subgraphNetwork,cycleToDrawID,groupCycleName);

        }
    }


    return subgraphNetwork;
}

function independentCycleCoordinates(subgraphNetwork:SubgraphNetwork,cycleToDrawID:string,groupCycleName:string):SubgraphNetwork{
    const network = subgraphNetwork.network.value;
    const cycle=subgraphNetwork.cycles[cycleToDrawID].nodes;
    
    // radius and centroid
    const radius = getRadiusSize(cycle,network,subgraphNetwork.networkStyle.value);
        // first cycle centered at 0,0
    const centroidX=0;
    const centroidY=0;
    subgraphNetwork.cycles[cycleToDrawID].metadata.radius=radius;   
    subgraphNetwork.cycles[cycleToDrawID].metadata.centroid={x:centroidX,y:centroidY};         
    
    // Shift cycle 
    const topIndex = findTopCycleNode(subgraphNetwork,cycle); // first node of list is the top 
    const cycleCopy= cycle.slice();
    const shiftedCycle = cycleCopy.splice(topIndex).concat(cycleCopy);

    // Give position to each node (no nedd to check if overlap with other cycle, it is the first of the group)
    subgraphNetwork=cycleNodesCoordinates(cycleToDrawID,shiftedCycle,centroidX,centroidY,radius,subgraphNetwork,-Math.PI/2,groupCycleName).subgraphNetwork;
    return subgraphNetwork;
}    

function tangentCycleCoordinates(subgraphNetwork:SubgraphNetwork,cycleToDrawID:string,groupCycleName:string,nodeFixed:Node,nodesPlaced:string[],allowInterncircle:boolean=false):SubgraphNetwork{
    const network = subgraphNetwork.network.value;
    const cycle=subgraphNetwork.cycles[cycleToDrawID].nodes;

    // get fixed node coordinates (in the group cycle)
    const groupCycleFixed=nodeFixed.metadata[TypeSubgraph.CYCLEGROUP] as string;
    const coordNodeFixed=subgraphNetwork.cyclesGroup[groupCycleFixed].metadata[nodeFixed.id] as {x:number,y:number};

    // first node of cycle is the one fixed :
    const cycleCopy= cycle.slice();
    const firstIndex=cycle.indexOf(nodeFixed.id);
    const shiftedCycle = cycleCopy.splice(firstIndex).concat(cycleCopy);

    // radius
    const radius = getRadiusSize(cycle,network,subgraphNetwork.networkStyle.value);
    subgraphNetwork.cycles[cycleToDrawID].metadata.radius=radius;

    //centroid depending on fixed cycle
    const radiusFixedCycle=subgraphNetwork.cycles[nodeFixed.metadata.fixedCycle as string].metadata.radius as number;
    const centroidFixedCycle=subgraphNetwork.cycles[nodeFixed.metadata.fixedCycle as string].metadata.centroid;
    const fixedAngle = Math.atan2(coordNodeFixed.y - centroidFixedCycle["y"], coordNodeFixed.x - centroidFixedCycle["x"]);
    let centroidX:number;
    let centroidY:number;
    let d:number;
    // if has some node fixed in a line :
    if(allowInterncircle && nodesPlaced.length >1){
        d = radiusFixedCycle - radius; // circle draw internally

    }else{ // completely indep of fixed nodes but for the common node
        d = radius + radiusFixedCycle; // circle draw externally
    }
    centroidX = centroidFixedCycle["x"] + d * Math.cos(fixedAngle);
    centroidY = centroidFixedCycle["y"] + d * Math.sin(fixedAngle);
    subgraphNetwork.cycles[cycleToDrawID].metadata.centroid={x:centroidX,y:centroidY};
    

    // shift of start angle (default:pi/2) : angle of fixed node in the new cycle (with centroid calculted before)
    const positionFixedNode=subgraphNetwork.cyclesGroup[groupCycleName].metadata[nodeFixed.id] as {x:number,y:number};
    const shiftAngle = Math.atan2(positionFixedNode.y - centroidY, positionFixedNode.x - centroidX);
    
    // Give position to each node, and get position before drawing cycle
    const cycleCoord=cycleNodesCoordinates(cycleToDrawID,shiftedCycle,centroidX,centroidY,radius,subgraphNetwork,shiftAngle,groupCycleName);
    subgraphNetwork=cycleCoord.subgraphNetwork;
    const positionBefore=cycleCoord.positionBefore;
    subgraphNetwork=undoIfOverlap(subgraphNetwork,groupCycleName,positionBefore);

    return subgraphNetwork;
}

function lineCycleCoordinates(subgraphNetwork:SubgraphNetwork,cycleToDrawID:string,groupCycleName:string){
    const cycle=subgraphNetwork.cycles[cycleToDrawID].nodes;

    const unfixedInterval=getUnfixedIntervals(cycle,subgraphNetwork);
    let cycleAsLine:string[]=[];
    unfixedInterval.forEach(interval=>{
        const startNode=cycle[(interval[0]-1+ cycle.length) % cycle.length];
        const endNode=cycle[(interval[1]+1+ cycle.length) % cycle.length];
        const startNodePosition=subgraphNetwork.cyclesGroup[groupCycleName].metadata[startNode] as {x:number,y:number};
        const endNodePosition=subgraphNetwork.cyclesGroup[groupCycleName].metadata[endNode] as {x:number,y:number};
        if (interval[0]>interval[1]){
            // if begginning of the cycle at the end, and the end at the beginning
            cycleAsLine=cycle.slice(interval[0],cycle.length).concat(cycle.slice(0,interval[1]+1));
        }else{
            cycleAsLine=cycle.slice(interval[0],interval[1]+1);
        }
        // Give position to each node
        const lineCoord=lineNodesCoordinates(startNodePosition,endNodePosition,cycleAsLine,subgraphNetwork,groupCycleName);
        subgraphNetwork=lineCoord.subgraphNetwork;
        const positionBefore=lineCoord.positionBefore;
        subgraphNetwork=undoIfOverlap(subgraphNetwork,groupCycleName,positionBefore);
    });
    return subgraphNetwork;
}

/**
 * Calculates the radius size based on the length of the cycle array and the radius factor.
 * @param cycle - The array of strings representing the cycle.
 * @param radiusFactor - The factor to multiply the length of the cycle by to calculate the radius size. Default value is 15.
 * @returns The calculated radius size.
 */
function getRadiusSize(cycle:string[],network:Network,styleNetwork:GraphStyleProperties){
    const nodes=Object.values(network.nodes).filter(node=>cycle.includes(node.id));
    const meanSize=getMeanNodesSizePixel(nodes,styleNetwork);
    return cycle.length*(meanSize.height+meanSize.width)/2;
}


/**
 * Calculates and assigns the coordinates for nodes to draw it as a circle.
 * 
 * @param cycleName - The name of the cycle.
 * @param cycle - An array of node names in the cycle.
 * @param centroidX - The x-coordinate of the centroid.
 * @param centroidY - The y-coordinate of the centroid.
 * @param radius - The radius of the cycle.
 * @param subgraphNetwork - The subgraph network.
 * @param shiftAngle - The angle by which to shift the cycle from the first node (optional, default is -Math.PI/2 to put the first node at the top).
 * @param groupcycle - The name of the group cycle (optional).
 * @returns The updated subgraph network.
 */
function cycleNodesCoordinates(cycleName:string,cycle:string[],centroidX:number,centroidY:number,radius:number,subgraphNetwork:SubgraphNetwork,
    shiftAngle:number=-Math.PI/2,groupcycle?:string,):{subgraphNetwork:SubgraphNetwork,positionBefore:{[key:string]:{x:number,y:number}}}{

    const network=subgraphNetwork.network.value;
    let positionBefore:{[key:string]:{x:number,y:number}}={};

    cycle.forEach((node, i) => {
        const nodeNetwork=network.nodes[node];
        // positive shift angle rotate cycle to the right, negative to the left
        const x = centroidX + radius * Math.cos(2 * Math.PI * i / cycle.length + shiftAngle );
        const y = centroidY + radius * Math.sin(2 * Math.PI * i / cycle.length  + shiftAngle );
        
        // Give position if not fixed
        if(network.nodes[node].metadata && !network.nodes[node].metadata.fixedCycle){
            if (groupcycle){
                if (groupcycle in subgraphNetwork.cyclesGroup){
                    if (!subgraphNetwork.cyclesGroup[groupcycle].metadata[node]){
                        subgraphNetwork.cyclesGroup[groupcycle].metadata[node] = {};
                        // get position before drawing cycle
                        positionBefore[node]={x:null,y:null};
                    }else{
                        // get position before drawing cycle
                        const xBefore=subgraphNetwork.cyclesGroup[groupcycle].metadata[node]["x"];
                        const yBefore=subgraphNetwork.cyclesGroup[groupcycle].metadata[node]["y"];
                        positionBefore[node]={x:xBefore,y:yBefore};
                    }
                    // assign new position
                    subgraphNetwork.cyclesGroup[groupcycle].metadata[node]["x"]=x;
                    subgraphNetwork.cyclesGroup[groupcycle].metadata[node]["y"]=y;
                } else {
                    console.error("CycleGroup not in subgraphNetwork");
                }
            } else if (node in subgraphNetwork.network.value.nodes) {
                // get position before drawing cycle
                const xBefore=subgraphNetwork.network.value.nodes[node].x;
                const yBefore=subgraphNetwork.network.value.nodes[node].x;
                positionBefore[node]={x:xBefore,y:yBefore};
                // assign new position
                subgraphNetwork.network.value.nodes[node].x=x;
                subgraphNetwork.network.value.nodes[node].y=y;
            } else{
                console.error("Node not in network or groupcycle not provided")
            }

            // Fix the nodes 
            if (!nodeNetwork.metadata) nodeNetwork.metadata={};
            nodeNetwork.metadata.fixedInCycle= true;
            nodeNetwork.metadata.fixedCycle= cycleName;
        }
        
    });

    return {subgraphNetwork:subgraphNetwork,positionBefore:positionBefore};
}



function undoIfOverlap(subgraphNetwork:SubgraphNetwork,groupCycleName:string,positionBefore:{[key:string]:{x:number,y:number}}):SubgraphNetwork{
    // is there overlap in the group cycle ?
    const isOverlap=isOverlapCycles(subgraphNetwork,groupCycleName);
    // if overlap, put back the position before drawing cycle
    if(isOverlap){
        Object.entries(positionBefore).forEach(([nodeID,coord])=>{
            const node=subgraphNetwork.cyclesGroup[groupCycleName].metadata[nodeID] as {x:number,y:number};
            node.x = positionBefore[nodeID].x;
            node.y = positionBefore[nodeID].y;
        });
    }
    return subgraphNetwork;
}

function isOverlapCycles(subgraphNetwork:SubgraphNetwork,groupCycleName:string):boolean{
    const graph =getListNodeLinksForCycleGroupAsObject(subgraphNetwork,groupCycleName);

    // intersection of edges :
    const intersectionEdges=isIntersectionGraph(graph.nodes ,graph.links);
    if (intersectionEdges){
        return true;
    }else{
        // overlap of nodes
        const nodesOverlap=isOverlapNodes(graph.nodes,subgraphNetwork.network.value,subgraphNetwork.networkStyle.value);
        if (nodesOverlap){
            return true;
        }else{
            // overlap of node with edges
            const edgeNodeOverlap=isOverlapNodesEdges(graph.nodes,graph.links,subgraphNetwork.network.value,subgraphNetwork.networkStyle.value);
            if (edgeNodeOverlap){
                return true;
            }
        }
    }
    return false;
}


/**
 * Retrieves the unfixed intervals from a list of nodes. An unfixed interval is a continuous range of nodes that are not fixed in a cycle.
 * An unfixed interval is a continuous range of nodes that are not fixed in the cycle.
 *
 * @param nodes - An array of node IDs.
 * @param subgraphNetwork - The subgraph network containing the nodes.
 * @returns An array of intervals representing the unfixed intervals.
 */
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

    // case first interval and last are linked : combine interval as one long interval
    if (intervals.length!==0 && intervals[0][0]===0 && intervals[intervals.length-1][1]===nodes.length-1){
        intervals[0][0]=intervals[intervals.length-1][0]; // change start of first interval
        intervals.pop(); // remove last interval
    }

    return intervals;
}


/**
 * Calculates and assigns the coordinates for nodes along a line between two points.
 * @param start - The starting point coordinates (x, y).
 * @param end - The ending point coordinates (x, y).
 * @param nodes - An array of node names to place.
 * @param subgraphNetwork - The subgraph network object.
 * @param groupCycleName - Optional. The name of the group cycle in witch the line is draw.
 * @returns The updated subgraph network object.
 */
function lineNodesCoordinates(start: {x: number, y: number}, end: {x: number, y: number}, nodes: string[],
    subgraphNetwork:SubgraphNetwork,groupCycleName?:string):{subgraphNetwork:SubgraphNetwork,positionBefore:{[key:string]:{x:number,y:number}}} {
    const network=subgraphNetwork.network.value;
    let positionBefore:{[key:string]:{x:number,y:number}}={};

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
                    // get position before drawing cycle
                    positionBefore[node]={x:null,y:null};
                }else{
                    // get position before drawing cycle
                    const xBefore=subgraphNetwork.cyclesGroup[groupCycleName].metadata[node]["x"];
                    const yBefore=subgraphNetwork.cyclesGroup[groupCycleName].metadata[node]["y"];
                    positionBefore[node]={x:xBefore,y:yBefore};
                }
                // assign new position
                subgraphNetwork.cyclesGroup[groupCycleName].metadata[node]["x"]=x;
                subgraphNetwork.cyclesGroup[groupCycleName].metadata[node]["y"]=y;
            } else {
                console.error("CycleGroup not in subgraphNetwork");
            }
        } else if (node in subgraphNetwork.network.value.nodes) {
            // get position before drawing cycle
            const xBefore=subgraphNetwork.network.value.nodes[node].x;
            const yBefore=subgraphNetwork.network.value.nodes[node].x;
            positionBefore[node]={x:xBefore,y:yBefore};
            // assign new position
            subgraphNetwork.network.value.nodes[node].x=x;
            subgraphNetwork.network.value.nodes[node].y=y;
        } else{
            console.error("Node not in network or groupcycle not provided")
        }

        // Fix the nodes 
        const nodeNetwork=network.nodes[node];
        if (!nodeNetwork.metadata) nodeNetwork.metadata={};
        nodeNetwork.metadata.fixedInCycle= true;
        nodeNetwork.metadata.fixedCycle= undefined;
        
    });    
    return {subgraphNetwork:subgraphNetwork,positionBefore:positionBefore};
}


/**
 * If the group cycle is drawn :
 * - Updates the group cycles in the subgraph network : add its size and center of rectangle.
 * - Change the group number.
 * 
 * @param remainingCycles - The remaining cycles to process in the subgraph.
 * @param subgraphNetwork - The subgraph network.
 * @param group - The current cycle group number.
 * @param groupCycleName - The name of the group cycle.
 * @returns An object containing the updated subgraph network and group number.
 */
async function updateGroupCycles(remainingCycles: Subgraph[], subgraphNetwork: SubgraphNetwork, group: number, groupCycleName: string): Promise<{subgraphNetwork: SubgraphNetwork, group: number}> {
    const network = subgraphNetwork.network.value;
    const groupCycleIsDraw = isRemainingCycleIndepOfDrawing(remainingCycles, subgraphNetwork);

    if (groupCycleIsDraw && subgraphNetwork.cyclesGroup[groupCycleName].metadata) {
        // force algo for node that have null position
        subgraphNetwork = await forceGroupCycle(subgraphNetwork, groupCycleName);

        // get size of group and update cycle group information
        const listCoord = Object.values(subgraphNetwork.cyclesGroup[groupCycleName].metadata)
                            .filter(item => item["x"] !== undefined && item["y"] !== undefined);
        const {width, height, center} = rectangleSize(listCoord as {x: number, y: number}[]);
        subgraphNetwork.cyclesGroup[groupCycleName].width = width;
        subgraphNetwork.cyclesGroup[groupCycleName].height = height;
        subgraphNetwork.cyclesGroup[groupCycleName].originCoordinates = center;

        // change group
        group += 1;
    } else if (groupCycleIsDraw) {
        console.error('No coordinates for group cycle');
        // change group
        group += 1;
    }

    return {subgraphNetwork: subgraphNetwork, group: group};
}


async function forceGroupCycle(subgraphNetwork:SubgraphNetwork, groupCycleName:string,force:number=-500):Promise<SubgraphNetwork>{

    if (!subgraphNetwork.cyclesGroup[groupCycleName] || !subgraphNetwork.cyclesGroup[groupCycleName].metadata){
        return subgraphNetwork;
    }

    // get subgraph for groupCycle
    const graph =getListNodeLinksForCycleGroup(subgraphNetwork,groupCycleName,true);

    // get attributes for force layout
    const distanceLinks=medianLengthDistance(subgraphNetwork.network.value,false);
    const strengthManyBody=-distanceLinks*10;
   
    // applying force layout
    const simulation = d3.forceSimulation(graph.nodes)
    .force('link', d3.forceLink().id((d: any) => {return d.id;}).links(graph.links).distance(distanceLinks).strength(0.3))
    .force('charge', d3.forceManyBody().strength(strengthManyBody))
    //.force("collide", d3.forceCollide(distanceLinks/2))
    //.force('center', d3.forceCenter(0,0))
    //.force("radial", d3.forceRadial(0,0))
    .alphaMin(0.4)
    .stop();
    
    await sendTick();
    
    async function sendTick() {
        for (let i = simulation.alpha(); i > 0.4; i = simulation.alpha()) {
        simulation.tick();
        }
    }

    // get the new position of the nodes
    graph.nodes.forEach(node => {
        subgraphNetwork.cyclesGroup[groupCycleName].metadata[node.id] = { x: node["x"], y: node["y"] };
    });

    return subgraphNetwork;
}

/**
 * Checks if all nodes in the remaining cycles are unfixed in the subgraph network.
 * 
 * @param remainingCycles - An array of remaining cycles in the subgraph.
 * @param subgraphNetwork - The subgraph network containing the nodes.
 * @returns A boolean indicating whether all nodes in the remaining cycles are unfixed.
 */
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










//------------------------------------------------------------------------------------------------------------
//__________________________________ Utility functions______________________________________________________
//------------------------------------------------------------------------------------------------------------





/**
 * Checks if a node is part of a cycle in the network.
 * @param network - The network object.
 * @param idNode - The ID of the node to check.
 * @returns A boolean indicating whether the node is in a cycle or not.
 */
export function inCycle(network: Network, idNode: string): boolean {
    // no metadata or no cycle metadata or empty cycle metadata : that is, not in a cycle
    let inCycle:boolean=false;
    if (idNode in network.nodes && "metadata" in network.nodes[idNode] 
        && TypeSubgraph.CYCLE in network.nodes[idNode].metadata){
            const cycles=network.nodes[idNode].metadata[TypeSubgraph.CYCLE] as string[];
            if (cycles.length>0) inCycle=true;
    }
    return inCycle;
}


/**
 * Finds the index of the top cycle node based on the given subgraph network and cycle nodes.
 * The top cycle node is determined by the node with the highest parent (smaller y) if it exists. Or the opposite node in the cycle of the node with the lowest child (bigger y).
 * If multiple nodes have the highest parent or lowest child, the one with the median x value is chosen.
 * If no parent or child nodes are found, the first node in the cycle is chosen.
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param cycleNodes - An array of cycle node names.
 * @returns The index of the top cycle node.
 */
function findTopCycleNode(subgraphNetwork: SubgraphNetwork, cycleNodes:string[]):number{

    // find node with the highest parent (smaller y)
        // get parent nodes of the cycle
    const cycleNodesParent = parentNodeNotInCycle(subgraphNetwork, cycleNodes);
        // get the one with highest parent
    const withHighestParent=getNodesAssociatedMinY(subgraphNetwork, cycleNodesParent)
                            .map(i=>cycleNodes[i]);
    if (withHighestParent.length===1){
        return cycleNodes.indexOf(withHighestParent[0]);

    } else if (withHighestParent.length>1){
        // if several : take the one with median x
        const nodeMedianName=nodeMedianX(subgraphNetwork, withHighestParent);
        return cycleNodes.indexOf(nodeMedianName);

    }else{
        // if no parent : opposite node of the node with lowest child (to put the one with with to the bottom)
        let bottomNode:number;
        // find node with the lowest child (bigger y)
            // get child nodes of the cycle
        const cycleNodesChild = childNodeNotInCycle(subgraphNetwork, cycleNodes);
        
            // get the one with lowest child
        const withLowestChild=getNodesAssociatedMaxY(subgraphNetwork, cycleNodesChild)
                             .map(i=>cycleNodes[i]); 

         if (withLowestChild.length>=1){
            if(withLowestChild.length==1){
                bottomNode=cycleNodes.indexOf(withLowestChild[0]);
            }else if (withLowestChild.length>1){
                // if several : take the one with median x
                const nodeMedianName=nodeMedianX(subgraphNetwork, withLowestChild);
                bottomNode=cycleNodes.indexOf(nodeMedianName);
            }
            // get the opposite node of the first (one as to be chosen) node in the 
            return (bottomNode+Math.floor(cycleNodes.length/2))%cycleNodes.length;

        }else{
            return 0;
        }
    }
}


export function getNodesIDPlacedInGroupCycle(subgraphNetwork:SubgraphNetwork,groupCycleID:string):string[]{
    if (groupCycleID in subgraphNetwork.cyclesGroup && "metadata" in subgraphNetwork.cyclesGroup[groupCycleID]){
        return Object.entries(subgraphNetwork.cyclesGroup[groupCycleID].metadata)
                .filter(([_,item]) => item["x"] !== undefined && item["y"] !== undefined)
                .map(([key,_])=>key);
    }else{
        return [];
    }
}

export function getNodesPlacedInGroupCycle(subgraphNetwork:SubgraphNetwork,groupCycleID:string,positionAsFixed:boolean=false):{ id: string,fx?:number, fy?:number }[]{
    if (groupCycleID in subgraphNetwork.cyclesGroup && "metadata" in subgraphNetwork.cyclesGroup[groupCycleID]){
            return Object.entries(subgraphNetwork.cyclesGroup[groupCycleID].metadata)
                    .filter(([_, item]) => { return item["x"] !== undefined && item["y"] !== undefined })
                    .map(([key, item]) => { 
                        if (item["x"]!==null || item["y"]!==null){
                            if (positionAsFixed) return { id: key,fx:item["x"], fy:item["y"] } 
                            else return { id: key,x:item["x"], y:item["y"] } 
                            
                        }else{
                            return { id: key }
                        }
            }); 
    }else{
        return null;
    }
}

export function getNodesPlacedInGroupCycleAsObject(subgraphNetwork:SubgraphNetwork,groupCycleID:string):{ [key:string]:{x:number,y:number }}{
    if (groupCycleID in subgraphNetwork.cyclesGroup && "metadata" in subgraphNetwork.cyclesGroup[groupCycleID]){
        return Object.entries(subgraphNetwork.cyclesGroup[groupCycleID].metadata)
                        .filter(([_, item]) => { return item["x"] !== undefined && item["y"] !== undefined })
                        .reduce((acc, node) => { 
                            if (node[1]["x"]!==null || node[1]["y"]!==null){
                                 acc[node[0]]={ x:node[1]["x"], y:node[1]["y"] } 
                            }
                            return acc;
                        },{});
    }else{
        return null;
    }
}

export function getLinksForNodes(network: Network, nodes: string[]): {source:string,target:string}[] {
    return network.links.filter(link => 
        nodes.includes(link.source.id) && nodes.includes(link.target.id)
    ).map(link => { return { source: link.source.id, target: link.target.id } });
}

export function getListNodeLinksForCycleGroup(subgraphNetwork:SubgraphNetwork,groupCycleName:string,positionAsFixed:boolean=false)
:{nodes:{ id: string,fx?:number, fy?:number,x?:number,y?:number }[],links:{source:string,target:string}[]}{
    const nodesGroupCycle=getNodesPlacedInGroupCycle(subgraphNetwork,groupCycleName,positionAsFixed);
    const nodesGroupCycleName=Object.values(nodesGroupCycle).map(node=>node.id);
    const linksGroupCycle=getLinksForNodes(subgraphNetwork.network.value,nodesGroupCycleName);
    return {nodes:nodesGroupCycle,links:linksGroupCycle};
}

export function getListNodeLinksForCycleGroupAsObject(subgraphNetwork:SubgraphNetwork,groupCycleName:string)
:{nodes:{[key:string]:{ x:number,y:number }},links:{source:string,target:string}[]}{
    const nodesGroupCycle=getNodesPlacedInGroupCycleAsObject(subgraphNetwork,groupCycleName);
    const nodesGroupCycleName=Object.keys(nodesGroupCycle);
    const linksGroupCycle=getLinksForNodes(subgraphNetwork.network.value,nodesGroupCycleName);
    return {nodes:nodesGroupCycle,links:linksGroupCycle};
}


/**
 * Returns an array of parent nodes, of a list of nodes, that are not part of any cycle in the subgraph network.
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param listNodes - The list of nodes to check for parent nodes.
 * @returns An array of arrays containing the parent nodes that are not part of any cycle.
 */
function parentNodeNotInCycle(subgraphNetwork: SubgraphNetwork, listNodes: string[]): string[][] {
    const parentNodes = listNodes.map((node: string) => {
        const parentNodesI = subgraphNetwork.network.value.links
            .filter(link => link.target.id === node) // get link with those node as child
            .map(link => link.source.id) // get the other node 
            .filter(id => !inCycle(subgraphNetwork.network.value, id)) // no node in a cycle 
        return parentNodesI;
    });
    return parentNodes;
}


export function neighborsGroupCycle(subgraphNetwork:SubgraphNetwork,cycleGroupId:string, parentOrChild:"parent"|"child",xSort:boolean=true):string[]{
    if (cycleGroupId in subgraphNetwork.cyclesGroup && "metadata" in subgraphNetwork.cyclesGroup[cycleGroupId]){
        const nodes=getNodesIDPlacedInGroupCycle(subgraphNetwork,cycleGroupId);
        // sort nodes of the group cycle by x
        if (xSort){
            nodes.sort((nodeIdA, nodeIdB) => {
                const nodeA = subgraphNetwork.cyclesGroup[cycleGroupId].metadata[nodeIdA];
                const nodeB = subgraphNetwork.cyclesGroup[cycleGroupId].metadata[nodeIdB];
                return nodeA["x"] - nodeB["x"];
            });
        }
        if (parentOrChild==="parent"){
            // get parent nodes
            const parentCycles = Array.from(new Set(parentNodeNotInCycle(subgraphNetwork, nodes).flat()));
            return parentCycles;
        } else {
            // get child nodes
            const childCycles = Array.from(new Set(childNodeNotInCycle(subgraphNetwork, nodes).flat()));
            return childCycles;
        }
    }else{
        return [];
    }
}


/**
 * Returns an array of child nodes, of a list of nodes, that are not part of any cycle in the subgraph network.
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param listNodes - The list of nodes to check for child nodes.
 * @returns An array of arrays containing the child nodes that are not part of any cycle.
 */
function childNodeNotInCycle(subgraphNetwork: SubgraphNetwork, listNodes: string[]): string[][] {
    const childNodes = listNodes.map((node: string) => {
        const childNodesI = subgraphNetwork.network.value.links
            .filter(link => link.source.id === node) // get link with those node as parent
            .map(link => link.target.id) // get the other node 
            .filter(id => !inCycle(subgraphNetwork.network.value, id)) // no node in a cycle 
        return childNodesI;
    });

    return childNodes;
}

/**
 * Returns indices of lists containing minimum y-coordinate nodes.
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param associatedListNodes - The list of list of nodes.
 * @returns An array of indices representing lists containing minimum y-coordinate nodes.
 */
function getNodesAssociatedMinY(subgraphNetwork: SubgraphNetwork, associatedListNodes: string[][]): number[] {
    const network=subgraphNetwork.network.value;
    let minY=Infinity;
    let minNodes: number[] = [];
    associatedListNodes.forEach((listNodes,i) => {
        listNodes.forEach(node => {
            if (network.nodes[node] && network.nodes[node].y) {
                if (network.nodes[node].y < minY) {
                    minY = network.nodes[node].y;
                    minNodes = [i];
                }else if (network.nodes[node].y == minY && !minNodes.includes(i)) {
                    minNodes.push(i);
                }
            }
        });
    });
    return minNodes;
}

/**
 * Returns indices of lists containing maximum y-coordinate nodes.
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param associatedListNodes - The list of list of nodes.
 * @returns An array of indices representing lists containing maximum y-coordinate nodes.
 */
function getNodesAssociatedMaxY(subgraphNetwork: SubgraphNetwork, associatedListNodes: string[][]): number[] {
    const network=subgraphNetwork.network.value;
    let maxY=-Infinity;
    let maxNodes:number[]=[];
    associatedListNodes.forEach((listNodes,i) => {
        listNodes.forEach(node => {
            if (network.nodes[node] && network.nodes[node].y) {
                if (network.nodes[node].y > maxY) {
                    maxY = network.nodes[node].y;
                    maxNodes = [i];
                }else if (network.nodes[node].y == maxY && !maxNodes.includes(i)) { 
                    maxNodes.push(i);
                }
            }
        });
    });
    return maxNodes;
}

/**
 * Get the name of the node with the median x-coordinate from a list of nodes.
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param listNodes - An array of node names.
 * @returns The name of the node with the median x-coordinate.
 */
function nodeMedianX(subgraphNetwork: SubgraphNetwork, listNodes: string[]): string {
    const network=subgraphNetwork.network.value;
    let xValues = listNodes.map(node => [node,network.nodes[node].x]);
    xValues.sort((a, b) =>  Number(a[1]) - Number(b[1])); // sort by x

    let midIndex :number;
    // if even number of nodes
    if (xValues.length % 2 === 0) {
        midIndex = (xValues.length / 2)-1; // the lowest x of the two median
    } else { // odd number of nodes
        midIndex = Math.floor(xValues.length / 2);  
    }
    const nodeNameMedian=xValues[midIndex][0] as string;
    return nodeNameMedian;
}







//------------------------------------------------------------------------------------------------------------
//________________________________Drawing cycle : shift position and placement in network_______________________________________
//------------------------------------------------------------------------------------------------------------



/**
 * Draws all cycle groups in the given subgraph network, that is put the precalculated coordinates inside the network
 * 
 * @param subgraphNetwork - The subgraph network containing the cycle groups.
 */
export function drawAllCyclesGroup(subgraphNetwork:SubgraphNetwork) {

    console.log('drawing cycles group');
    if (TypeSubgraph.CYCLEGROUP in subgraphNetwork){
        const cycleGroups = Object.keys(subgraphNetwork.cyclesGroup);
        cycleGroups.forEach(cycleGroup => {
            drawCycleGroup(cycleGroup,subgraphNetwork);
        });
    }
}

/**
 * Shift the precalculated coordinates nodes in a cycle group to their new positions based on the given metanode position, 
 * there are put inside the network to be drawn.
 * The coordinates of nodes (to be shifted) need to be in the metadata of the cycle group.
 * @param cycleGroup - The name of the cycle group.
 * @param subgraphNetwork - The subgraph network containing the cycle group and its nodes.
 */
function drawCycleGroup(cycleGroup:string,subgraphNetwork:SubgraphNetwork):void{
    const metanodePosition=subgraphNetwork.cyclesGroup[cycleGroup].position;
    const currentCenterPosition=subgraphNetwork.cyclesGroup[cycleGroup].originCoordinates;
    const dx=metanodePosition.x-currentCenterPosition.x;
    const dy=metanodePosition.y-currentCenterPosition.y;
    const listNode = Object.entries(subgraphNetwork.cyclesGroup[cycleGroup].metadata)
                            .filter(([key,item]) => item["x"] !== undefined && item["y"] !== undefined);
    listNode.forEach(([nodeID,coord])=>{
        const node=subgraphNetwork.network.value.nodes[nodeID];
        node.x = coord["x"] + dx;
        node.y = coord["y"] + dy;
    });
}


// ________________________Method 2________________________________________________________

// export function coordinateAllCycles(subgraphNetwork:SubgraphNetwork):Promise<SubgraphNetwork>{
//     return new Promise((resolve) => {
//         // creation of group cycle and placement of first cycle
//         subgraphNetwork=firstStepGroupCycles(subgraphNetwork);
//         // if there are group cycle : continue to place the other cycles
//         if (subgraphNetwork.cyclesGroup && Object.keys(subgraphNetwork.cyclesGroup).length>0){
//             Promise.all(
//                 Object.keys(subgraphNetwork.cyclesGroup).map(groupCycleName => { 
//                     forceGroupCycle(subgraphNetwork, groupCycleName)
//                 })
//             ).then(() => {
//                 subgraphNetwork=getSizeAllGroupCycles(subgraphNetwork);
//                 resolve(subgraphNetwork);
//             });
//         }
//     });
// }

// function firstStepGroupCycles(subgraphNetwork:SubgraphNetwork):SubgraphNetwork {
//     let cycles = subgraphNetwork.cycles? Object.values(subgraphNetwork.cycles):undefined;
//     let i=0;
//     let group=-1;
//     let groupName:string="";
//     let newGroup=true;

//     while (cycles && cycles.length > 0) {
        
//         if (newGroup){
//             // if first cycle of a group cycle
//             // creation of a new group cycle
//             group+=1;
//             groupName=cycleGroupName(String(group));
//             subgraphNetwork=addNewCycleGroup(subgraphNetwork,groupName);
//             // find biggest cycle, or the one with most constraint
//                 // cycles that are not subgraph of a cycle
//             const parentCycles = cycles.filter(cycle => !cycle.forSubgraph || cycle.forSubgraph.type !== TypeSubgraph.CYCLE);
//             if (parentCycles.length === 0) {
//                 console.error("No cycle found without a forSubgraph of type cycle");
//                 return;
//             }
//             parentCycles.sort((a, b) => sortCycleSizeRelation(subgraphNetwork,a,b,true));
//             const largestParentCycle = parentCycles[0];

//             // add it to the group cycle and remove it from the list of cycle to process
//             subgraphNetwork.cyclesGroup[groupName].nodes.push(largestParentCycle.name); 
//             cycles = cycles.filter(cycle => cycle.name !== largestParentCycle.name);
//             // give it coordinates      
//             subgraphNetwork=coordinateCycle(subgraphNetwork, largestParentCycle.name,groupName,true); 

//         }else{
//             // if not first cycle of a group cycle
//             // find all cycles with common nodes (fixed nodes)
//             const dependantCyclesList=dependantCycles(cycles,subgraphNetwork);
              
//             dependantCyclesList.forEach(dependantCycle => {
//                 // add them to the group cycle
//                 subgraphNetwork.cyclesGroup[groupName].nodes.push(dependantCycle); 
//                 // fix the nodes (to (0,0))
//                 const nodes=subgraphNetwork.cycles[dependantCycle].nodes;
//                 subgraphNetwork=coordinateCycle(subgraphNetwork, dependantCycle,groupName,false);
//             });

//             // remove them from the list of cycle to process
//             cycles = cycles.filter(cycle => !dependantCyclesList.includes(cycle.name));
            
//         }

//         // check all cycles of the group cycle are processed 
//         newGroup=isRemainingCycleIndepOfDrawing(cycles, subgraphNetwork);

//     }

//     return subgraphNetwork;
// }




// function coordinateCycle(subgraphNetwork:SubgraphNetwork, cycleToDrawID:string,groupCycleName:string,asCircle:boolean=true):SubgraphNetwork{
//     const network = subgraphNetwork.network.value;
//     let centroidX :number=0;
//     let centroidY :number=0;
    
//     // Get nodes to place
//     let cycle:string[]=[];
//     if (cycleToDrawID in subgraphNetwork.cycles){
//         cycle=subgraphNetwork.cycles[cycleToDrawID].nodes;
//         subgraphNetwork.cycles[cycleToDrawID].metadata={};
//     }else{  
//         console.log('cycle not in subgraph network');
//     }

//     // Check existence of all nodes
//     const cycleExist = cycle.every(node => node in network.nodes);


//     // If cycle exist: place his nodes
//     if (cycleExist && cycle.length>0){

//         // Update node metadata to place them in cycleGroup
//         cycle.forEach(node=>{
//             network.nodes[node].metadata[TypeSubgraph.CYCLEGROUP]=groupCycleName;
//         });

//         // if the cycle has to be drawn as a circle
//         if (asCircle){
//             // radius and centroid
//             const radius = getRadiusSize(cycle,network,subgraphNetwork.networkStyle.value);
//             subgraphNetwork.cycles[cycleToDrawID].metadata.radius=radius;   
//             subgraphNetwork.cycles[cycleToDrawID].metadata.centroid={x:centroidX,y:centroidY};         
         
//             // Shift cycle 
//             const topIndex = findTopCycleNode(subgraphNetwork,cycle); // first node of list is the top 
//             const cycleCopy= cycle.slice();
//             const shiftedCycle = cycleCopy.splice(topIndex).concat(cycleCopy);

//             // Give position to each node
//             subgraphNetwork=cycleNodesCoordinates(cycleToDrawID,shiftedCycle,centroidX,centroidY,radius,subgraphNetwork,-Math.PI/2,groupCycleName);
//         } else {
//             subgraphNetwork=fixedCycleNodesToOrigin(cycle,subgraphNetwork,groupCycleName);
//         }
//     }

//     return subgraphNetwork;
// }


// function sortCycleSizeRelation(subgraphNetwork:SubgraphNetwork,a:Subgraph,b:Subgraph,byRelation:boolean=false):number{
//     // sort by size
//     if ( !byRelation || b.nodes.length !== a.nodes.length ){
//         return b.nodes.length - a.nodes.length;
//     }else{
//         // then by number of parent nodes
//         const totalParentNodesA = parentNodeNotInCycle(subgraphNetwork, a.nodes)
//             .flat().length;
//         const totalParentNodesB = parentNodeNotInCycle(subgraphNetwork, b.nodes)
//             .flat().length;
//         if (totalParentNodesA !== totalParentNodesB){
//             return totalParentNodesB - totalParentNodesA;
//         }else{
//             // then by number of child nodes
//             const totalChildNodesA = childNodeNotInCycle(subgraphNetwork, a.nodes)
//                 .flat().length;
//             const totalChildNodesB = childNodeNotInCycle(subgraphNetwork, b.nodes)
//                 .flat().length;
            
//             return totalChildNodesB - totalChildNodesA;
//         }
//     }                   
// }






// function fixedCycleNodesToOrigin(cycle:string[],subgraphNetwork:SubgraphNetwork,groupcycle:string,):SubgraphNetwork{
//     const network=subgraphNetwork.network.value;
//     cycle.forEach((node) => {
//         const nodeNetwork=network.nodes[node];        
//         // Give position if not fixed
//         if(network.nodes[node].metadata && !network.nodes[node].metadata.fixedCycle){
//             if (groupcycle in subgraphNetwork.cyclesGroup){
//                 if (!subgraphNetwork.cyclesGroup[groupcycle].metadata[node]){
//                     subgraphNetwork.cyclesGroup[groupcycle].metadata[node] = {};
//                 }
//                 subgraphNetwork.cyclesGroup[groupcycle].metadata[node]["x"]=0;
//                 subgraphNetwork.cyclesGroup[groupcycle].metadata[node]["y"]=0;

//                 // Fix the nodes 
//                 if (!nodeNetwork.metadata) nodeNetwork.metadata={};
//                 nodeNetwork.metadata.fixedInCycle= true;
//             } else {
//                 console.error("CycleGroup not in subgraphNetwork");
//             }
//         } 
//     });

//     return subgraphNetwork;
// }


// function dependantCycles(remainingCycles:Subgraph[], subgraphNetwork:SubgraphNetwork):Array<string>{

//     const network = subgraphNetwork.network.value;

//     const fixedCycleIds =  remainingCycles.filter(cycle => 
//         cycle.nodes.some(node => 
//             network.nodes[node].metadata && network.nodes[node].metadata.fixedInCycle
//         )
//     ).map(cycle => cycle.name);

//     return fixedCycleIds;
// }


// function centroidFromNodes(nodesList:string[],subgraphNetwork:SubgraphNetwork):{x:number,y:number}{
//     if (nodesList.length>0){
//         const network=subgraphNetwork.network.value;
//         let centroid={x:0,y:0}
//         nodesList.forEach(node=> {
//             if ("x" in network.nodes[node] && "y" in network.nodes[node]){
//                 centroid.x += network.nodes[node].x;
//                 centroid.y += network.nodes[node].y;
//             }    
//         });
//         return {x:centroid.x/nodesList.length,y:centroid.y/nodesList.length};
//     }
//     return {x:0,y:0};
// }



// function euclideanDistance(point1: {x: number, y: number}, point2: {x: number, y: number}): number {
//     let dx = point2.x - point1.x;
//     let dy = point2.y - point1.y;
//     return Math.sqrt(dx * dx + dy * dy);
// }


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

