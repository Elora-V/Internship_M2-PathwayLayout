import { Node } from '@metabohub/viz-core/src/types/Node';
import { Network } from "@metabohub/viz-core/src/types/Network";
import { checkIntersection } from 'line-intersect';
import { Link } from '@metabohub/viz-core/src/types/Link';
import { c } from 'vite/dist/node/types.d-aGj9QkWt';
import { GraphStyleProperties } from '@metabohub/viz-core/src/types/GraphStyleProperties';
import { getSizeNodePixel } from './calculateSize';
import { link } from 'fs';
import { Coordinate, Size } from '@/types/CoordinatesSize';


// CHNAGE THE CODE : SEE METRICSNETWORK (for end of internship : keep this one)

/**
 * Check if the coordinates (x, y) are the same as the node's coordinates
 * @param node the node
 * @param x coordinate
 * @param y coordinate
 * @returns a boolean
 */
function isNodeCoord(node: {x:number,y:number}, x: number, y: number): boolean {
    return (node.x == x && node.y == y);
}



//______________________Intersection in the network______________________
/**
 * Check if the 2 edges are crossing. 
 * Coming from the same node or going to the same node doesn't count as crossing.
 * @param link1 an edge
 * @param link2 an edge
 * @returns a boolean
 */
// function edgesIntersectionLink(link1: Link, link2: Link,style:GraphStyleProperties): boolean {

//     // case of common node
//     if (commonNodeBetween2Links(link1,link2)) {
//         return false;
//     }

//     let x1: Node = link1.source;
//     const x1Center=AdjustCoordNodeToCenter(x1,style);
//     let x2: Node = link1.target;
//     const x2Center=AdjustCoordNodeToCenter(x2,style);
//     let x3: Node = link2.source;
//     const x3Center=AdjustCoordNodeToCenter(x3,style);
//     let x4: Node = link2.target;
//     const x4Center=AdjustCoordNodeToCenter(x4,style);

//     const result = checkIntersection(x1Center.x, x1Center.y, x2Center.x, x2Center.y, x3Center.x, x3Center.y, x4Center.x, x4Center.y);
//     if (result.type == "intersecting") {
//         return true;
//     } else {
//         return false;
//     }
    
// }

// function commonNodeBetween2Links(link1: Link,link2: Link): boolean {
//     if (link1.source==link2.source || link1.source==link2.target || link1.target==link2.source || link1.target==link2.target) {
//         return true;
//     }else {
//         return false;
//     }
// } 

// function sameAngleBetween2ConnectedLinks(link1: Link,link2: Link,style:GraphStyleProperties): boolean {

//     // get nodes information
//     let commonNode: Node;
//     let node1: Node; // node from link 1 that is not in link 2
//     let node2: Node; // node from link 2 that is not in link 1

//     // if link 1 source is the common node :
//     if (link1.source==link2.source || link1.source==link2.target){
//         commonNode=link1.source;
//         node1=link1.target;
//     // if link 1 target is the common node :
//     }else if (link1.target==link2.source || link1.target==link2.target){
//         commonNode=link1.target;
//         node1=link1.source;
//     }
//     // get node 2
//     if (link2.source==commonNode){
//         node2=link2.target;
//     }else{
//         node2=link2.source;
//     }

//     // adjust coord
//     const commonNodeCenter=AdjustCoordNodeToCenter(commonNode,style);
//     const node1Center=AdjustCoordNodeToCenter(node1,style);
//     const node2Center=AdjustCoordNodeToCenter(node2,style);
//     // get angle between the 2 edges
//     const angle1=adjustAngle(Math.atan2(node1Center.y-commonNodeCenter.y,node1Center.x-commonNodeCenter.x));
//     const angle2=adjustAngle(Math.atan2(node2Center.y-commonNodeCenter.y,node2Center.x-commonNodeCenter.x));    
    
//     // same angles ?
//     return angle1==angle2;

// }

// function adjustAngle(angle: number): number {
//     return (angle + 2 * Math.PI) % (2 * Math.PI);
// }

// function AdjustCoordNodeToCenter(node:Node,style:GraphStyleProperties):{x:number,y:number}{
//     const size = getSizeNodePixel(node,style);
//     return {x:node.x-size.width/2,y:node.y-size.height/2}
// }

// /**
//  * Counts how many crossings are in a network
//  * @param network the network
//  * @returns the number of crossings
//  */
// export function countIntersection(network: Network,style:GraphStyleProperties): number {
//     let nb: number = 0;
//     for (let i=0 ; i<network.links.length ; i++) {
//         for (let j=i+1 ; j<network.links.length ; j++) {
//             const link1=network.links[i];
//             const link2=network.links[j];
//             if (edgesIntersectionLink(link1, link2,style)){
//                 nb++;
//             }
//         }
//     }
//     return nb;
// }


//______________________Intersection in another format of graph______________________

////CLEAN CODE : CHANGE FORMAT TO NETWORK AND USE THE OTHER FUNCTIONS FOR CYCLE

function AdjustCoordNodeToCenter2(node:Node,nodeCoord:{x:number,y:number},style:GraphStyleProperties):{x:number,y:number}{
    const size = getSizeNodePixel(node,style);
    return {x:nodeCoord.x-size.width/2,y:nodeCoord.y-size.height/2}
}

function edgesIntersection(node1Link1:{x:number,y:number},node2Link1:{x:number,y:number},node1Link2:{x:number,y:number},node2Link2:{x:number,y:number}): boolean {
    // case node in common
    if (commonNodeBetween2EdgesCoord(node1Link1,node2Link1,node1Link2,node2Link2)) {
     return false;//intersection2ConnectedLinks(node1Link1,node2Link1,node1Link2,node2Link2);
    }
    const result = checkIntersection(node1Link1.x, node1Link1.y, node2Link1.x, node2Link1.y, node1Link2.x, node1Link2.y, node2Link2.x, node2Link2.y);
    if (result.type == "intersecting") {
        return true;
    }else{
        return false;
    }
}


function commonNodeBetween2EdgesID(link1: {source:string,target:string},link2: {source:string,target:string}): boolean {
    if (link1.source==link2.source || link1.source==link2.target || link1.target==link2.source || link1.target==link2.target) {
        return true;
    }else {
        return false;
    }
}

function commonNodeBetween2EdgesCoord(node1Link1:{x:number,y:number},node2Link1:{x:number,y:number},node1Link2:{x:number,y:number},node2Link2:{x:number,y:number}): boolean {
    if (sameNode(node1Link1,node1Link2) || sameNode(node1Link1,node2Link2) || sameNode(node2Link1,node1Link2) || sameNode(node2Link1,node2Link2)) {
        return true;
    }else {
        return false;
    }
}

function sameNode(node1: {x:number,y:number},node2: {x:number,y:number}): boolean {
    if (!node1 || !node2 || !node1.x || !node1.y || !node2.x || !node2.y) {
        return false;
    }
    return node1.x==node2.x && node1.y==node2.y;
}

function intersection2ConnectedLinks(node1Link1:{x:number,y:number},node2Link1:{x:number,y:number},node1Link2:{x:number,y:number},node2Link2:{x:number,y:number}): boolean {

    // get nodes information
    let commonNode: {x:number,y:number};
    let node1: {x:number,y:number}; // node from link 1 that is not in link 2
    let node2: {x:number,y:number}; // node from link 2 that is not in link 1

    // if link 1 node 1 is the common node :
    if (sameNode(node1Link1,node1Link2) || sameNode(node1Link1,node2Link2)){
        commonNode=node1Link1;
        node1=node2Link1;
    // if link 1 node 2 is the common node :
    }else if (sameNode(node2Link1,node1Link2) || sameNode(node2Link1,node2Link2)){
        commonNode=node2Link1;
        node1=node1Link1;
    }
    // get node 2
    if (sameNode(node1Link2,commonNode)){
        node2=node2Link2;
    }else{
        node2=node1Link2;
    }

    // get angle between the 2 edges
    const angle1=adjustAngle(Math.atan2(node1.y-commonNode.y,node1.x-commonNode.x));
    const angle2=adjustAngle(Math.atan2(node2.y-commonNode.y,node2.x-commonNode.x));
    
    // same angles ?
    return angle1==angle2;

}

export function countIntersectionGraph(nodes: {[key:string]:{x:number,y:number}},links:{source:string,target:string}[],network:Network,style:GraphStyleProperties): number {
    let nb: number = 0;
    for (let i=0 ; i<links.length ; i++) {
        for (let j=i+1 ; j<links.length ; j++) {
            const link1=links[i];
            const link2=links[j];
            // check if intersection
            let node1Link1=nodes[link1.source];
            //node1Link1=AdjustCoordNodeToCenter2(network.nodes[link1.source],node1Link1,style);
            let node2Link1=nodes[link1.target];
            //node2Link1=AdjustCoordNodeToCenter2(network.nodes[link1.target],node2Link1,style);
            let node1Link2=nodes[link2.source];
            //node1Link2=AdjustCoordNodeToCenter2(network.nodes[link2.source],node1Link2,style);
            let node2Link2=nodes[link2.target];
            //node2Link2=AdjustCoordNodeToCenter2(network.nodes[link2.target],node2Link2,style);
            if (edgesIntersection(node1Link1,node2Link1,node1Link2,node2Link2)){
                nb++;
            }
        }
    }
    return nb;
}

export function isIntersectionGraph(nodes: {[key:string]:{x:number,y:number}},links:{source:string,target:string}[],network:Network,style:GraphStyleProperties): boolean {
    for (let i=0 ; i<links.length ; i++) {
        for (let j=i+1 ; j<links.length ; j++) {
            const link1=links[i];
            const link2=links[j];
             // check if intersection
             let node1Link1=nodes[link1.source];
             //node1Link1=AdjustCoordNodeToCenter2(network.nodes[link1.source],node1Link1,style);
             let node2Link1=nodes[link1.target];
             //node2Link1=AdjustCoordNodeToCenter2(network.nodes[link1.target],node2Link1,style);
             let node1Link2=nodes[link2.source];
             //node1Link2=AdjustCoordNodeToCenter2(network.nodes[link2.source],node1Link2,style);
             let node2Link2=nodes[link2.target];
             //node2Link2=AdjustCoordNodeToCenter2(network.nodes[link2.target],node2Link2,style);
            if (edgesIntersection(node1Link1,node2Link1,node1Link2,node2Link2)){
                return true;
            }
        }
    }
    return false;
}

//______________________Nodes overlap for graph______________________

export function countOverlapNodes(nodesPosition: {[key:string]:Coordinate},network:Network,networkStyle:GraphStyleProperties):number{
    let nb=0;
    const nodesID=Object.keys(nodesPosition);
    for (let i=0 ; i<nodesID.length ; i++) {
        for (let j=i+1 ; j<nodesID.length ; j++) {
            // info about node1
            const node1=network.nodes[nodesID[i]];
            const posNode1=nodesPosition[nodesID[i]];
            const sizeNode1=getSizeNodePixel(node1,networkStyle);
            // info about node2
            const node2=network.nodes[nodesID[j]];
            const posNode2=nodesPosition[nodesID[j]];
            const sizeNode2=getSizeNodePixel(node2,networkStyle);

            if (nodeOverlap(posNode1,sizeNode1,posNode2,sizeNode2)){
                nb+=1;
            }

        }
    }
    return nb;
}

export function isOverlapNodes(nodesPosition: {[key:string]:Coordinate},network:Network,networkStyle:GraphStyleProperties):boolean{
    const nodesID=Object.keys(nodesPosition);
    for (let i=0 ; i<nodesID.length ; i++) {
        for (let j=i+1 ; j<nodesID.length ; j++) {
            // info about node1
            const node1=network.nodes[nodesID[i]];
            const posNode1=nodesPosition[nodesID[i]];
            const sizeNode1=getSizeNodePixel(node1,networkStyle);
            // info about node2
            const node2=network.nodes[nodesID[j]];
            const posNode2=nodesPosition[nodesID[j]];
            const sizeNode2=getSizeNodePixel(node2,networkStyle);

            if (nodeOverlap(posNode1,sizeNode1,posNode2,sizeNode2)){
                return true;
            }

        }
    }
    return false;
}

function nodeOverlap(coord1: Coordinate, size1: Size, coord2: Coordinate, size2: Size): boolean {
    if (!coord1 || !size1 || !coord2 || !size2 || !size1.width || !size1.height || !size2.width
         || !size2.height || !coord1.x || !coord1.y || !coord2.x || !coord2.y) {
        // Handle null or undefined inputs appropriately
        return false;
    }

    // rectangle 1
    const left1 = coord1.x - size1.width / 2;
    const right1 = coord1.x + size1.width / 2;
    const top1 = coord1.y - size1.height / 2;
    const bottom1 = coord1.y + size1.height / 2;

    // rectangle 2
    const left2 = coord2.x - size2.width / 2;
    const right2 = coord2.x + size2.width / 2;
    const top2 = coord2.y - size2.height / 2;
    const bottom2 = coord2.y + size2.height / 2;

    // overlap?
    const overlapX = left1 < right2 && right1 > left2;
    const overlapY = top1 < bottom2 && bottom1 > top2;

    return overlapX && overlapY;
}
//______________________Nodes overlap with edges for graph______________________

export function countOverlapNodesEdges(nodesPosition: {[key:string]:{x:number,y:number}},links:{source:string,target:string}[],network:Network,networkStyle:GraphStyleProperties):number{
    let nb=0;
    const nodesID=Object.keys(nodesPosition);
    for (let i=0 ; i<nodesID.length ; i++) {
        // info about node
        const node=network.nodes[nodesID[i]];
        const posNode=nodesPosition[nodesID[i]];
        const sizeNode=getSizeNodePixel(node,networkStyle);

        for (let j=0 ; j<links.length ; j++) {        
            // info about link
            const link=links[j];
            // if node is linked to the edge : continue
            if(link.source==nodesID[i] || link.target==nodesID[i]){
                continue;
            }else{
                let posLink1=nodesPosition[link.source];
                let posLink2=nodesPosition[link.target];
                //posLink1=AdjustCoordNodeToCenter2(network.nodes[link.source],posLink1,networkStyle);
                //posLink2=AdjustCoordNodeToCenter2(network.nodes[link.target],posLink2,networkStyle);
                if (nodeEdgeOverlap(posNode,sizeNode,posLink1,posLink2)){
                    nb+=1;
                }
            }

        }
    }
    return nb;
}

export function isOverlapNodesEdges(nodesPosition: {[key:string]:{x:number,y:number}},links:{source:string,target:string}[],network:Network,networkStyle:GraphStyleProperties):boolean{
    const nodesID=Object.keys(nodesPosition);
    for (let i=0 ; i<nodesID.length ; i++) {
        // info about node
        const node=network.nodes[nodesID[i]];
        const posNode=nodesPosition[nodesID[i]];
        const sizeNode=getSizeNodePixel(node,networkStyle);

        for (let j=0 ; j<links.length ; j++) {        
            // info about link
            const link=links[j];
            // if node is linked to the edge : continue
            if(link.source==nodesID[i] || link.target==nodesID[i]){
                continue;
            }else{
                let posLink1=nodesPosition[link.source];
                let posLink2=nodesPosition[link.target];
                //posLink1=AdjustCoordNodeToCenter2(network.nodes[link.source],posLink1,networkStyle);
                //posLink2=AdjustCoordNodeToCenter2(network.nodes[link.target],posLink2,networkStyle);
                if (nodeEdgeOverlap(posNode,sizeNode,posLink1,posLink2)){
                    return true;
                }
            }

        }
    }
    return false;
}



function nodeEdgeOverlap(centerCoordNode: Coordinate, sizeNode:Size, posLink1: Coordinate, posLink2: Coordinate): boolean {
    
    // Treat the node as a rectangle 
    const rect = {
        left: centerCoordNode.x - sizeNode.width / 2,
        right: centerCoordNode.x + sizeNode.width / 2,
        top: centerCoordNode.y - sizeNode.height / 2,
        bottom: centerCoordNode.y + sizeNode.height / 2
    };

    // Check if any of the edge's endpoints is inside the rectangle
    const isPointInsideRect = (point: { x: number, y: number }) => 
        point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;

    if (isPointInsideRect(posLink1) || isPointInsideRect(posLink2)) {
        return true; // One of the endpoints is inside the rectangle
    }

   // Check for overlap between the edge and the sides of the rectangle
    // Convert the sides of the rectangle into line segments
    const edges = [
        { start: { x: rect.left, y: rect.top }, end: { x: rect.right, y: rect.top } }, // Top
        { start: { x: rect.right, y: rect.top }, end: { x: rect.right, y: rect.bottom } }, // Right
        { start: { x: rect.left, y: rect.bottom }, end: { x: rect.right, y: rect.bottom } }, // Bottom
        { start: { x: rect.left, y: rect.top }, end: { x: rect.left, y: rect.bottom } } // Left
    ];

    // Use checkIntersection function to check if two line segments intersect
    for (const edge of edges) {
        const result = checkIntersection(edge.start.x,edge.start.y, edge.end.x,edge.end.y, posLink1.x, posLink1.y,posLink2.x,posLink2.y);
        if (result.type == "intersecting") {
            return true; // There is an overlap
        }
    }

    return false; // No overlap detected
}