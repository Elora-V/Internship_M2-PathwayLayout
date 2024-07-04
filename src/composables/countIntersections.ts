import { Node } from '@metabohub/viz-core/src/types/Node';
import { Network } from "@metabohub/viz-core/src/types/Network";
import { checkIntersection } from 'line-intersect';
import { Link } from '@metabohub/viz-core/src/types/Link';
import { c } from 'vite/dist/node/types.d-aGj9QkWt';
import { GraphStyleProperties } from '@metabohub/viz-core/src/types/GraphStyleProperties';
import { getSizeNodePixel } from './calculateSize';

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
function edgesIntersectionLink(link1: Link, link2: Link): boolean {

    let x1: Node = link1.source;
    let x2: Node = link1.target;
    let x3: Node = link2.source;
    let x4: Node = link2.target;
    const result = checkIntersection(x1.x, x1.y, x2.x, x2.y, x3.x, x3.y, x4.x, x4.y);
    if (result.type == "intersecting") {
        // check that intersection point is not the node itself
        // if (!isNodeCoord(x1, result.point.x, result.point.y) 
        //     && !isNodeCoord(x2, result.point.x, result.point.y) 
        //     && !isNodeCoord(x3, result.point.x, result.point.y) 
        //     && !isNodeCoord(x4, result.point.x, result.point.y) ) {
        //         return true
        //     }
        return true;
    } else {
        return false;
    }
    
}

function commonNodeBetween2Links(link1: Link,link2: Link): boolean {
    if (link1.source==link2.source || link1.source==link2.target || link1.target==link2.source || link1.target==link2.target) {
        return true;
    }else {
        return false;
    }
} 

/**
 * Counts how many crossings are in a network
 * @param network the network
 * @returns the number of crossings
 */
export function countIntersection(network: Network): number {
    let nb: number = 0;
    for (let i=0 ; i<network.links.length ; i++) {
        for (let j=i+1 ; j<network.links.length ; j++) {
            const link1=network.links[i];
            const link2=network.links[j];
            // check if common node
            if (commonNodeBetween2Links(link1,link2)) {
                continue;
            }else{
                // check if intersection
                if (edgesIntersectionLink(link1, link2)){
                    nb++;
                }
            }
        }
    }
    return nb;
}


//______________________Intersection in another format of graph______________________

function edgesIntersection(node1Link1:{x:number,y:number},node2Link1:{x:number,y:number},node1Link2:{x:number,y:number},node2Link2:{x:number,y:number}): boolean {
    const result = checkIntersection(node1Link1.x, node1Link1.y, node2Link1.x, node2Link1.y, node1Link2.x, node1Link2.y, node2Link2.x, node2Link2.y);
    if (result.type == "intersecting") {
        return true;
    }else{
        return false;
    }
}

function commonNodeBetween2Edges(link1: {source:string,target:string},link2: {source:string,target:string}): boolean {
    if (link1.source==link2.source || link1.source==link2.target || link1.target==link2.source || link1.target==link2.target) {
        return true;
    }else {
        return false;
    }
}

export function countIntersectionGraph(nodes: {[key:string]:{x:number,y:number}},links:{source:string,target:string}[]): number {
    let nb: number = 0;
    for (let i=0 ; i<links.length ; i++) {
        for (let j=i+1 ; j<links.length ; j++) {
            const link1=links[i];
            const link2=links[j];
            // check if common node
            if (commonNodeBetween2Edges(link1,link2)) {
                continue;
            }else{
                // check if intersection
                const node1Link1=nodes[link1.source];
                const node2Link1=nodes[link1.target];
                const node1Link2=nodes[link2.source];
                const node2Link2=nodes[link2.target];
                if (edgesIntersection(node1Link1,node2Link1,node1Link2,node2Link2)){
                    nb++;
                }
            }
        }
    }
    return nb;
}

export function isIntersectionGraph(nodes: {[key:string]:{x:number,y:number}},links:{source:string,target:string}[]): boolean {
    for (let i=0 ; i<links.length ; i++) {
        for (let j=i+1 ; j<links.length ; j++) {
            const link1=links[i];
            const link2=links[j];
            // check if common node
            if (commonNodeBetween2Edges(link1,link2)) {
                continue;
            }else{
                // check if intersection
                const node1Link1=nodes[link1.source];
                const node2Link1=nodes[link1.target];
                const node1Link2=nodes[link2.source];
                const node2Link2=nodes[link2.target];
                if (edgesIntersection(node1Link1,node2Link1,node1Link2,node2Link2)){
                   return true;
                }
            }
        }
    }
    return false;
}

//______________________Nodes overlap for graph______________________

export function countOverlapNodes(nodesPosition: {[key:string]:{x:number,y:number}},network:Network,networkStyle:GraphStyleProperties):number{
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

export function isOverlapNodes(nodesPosition: {[key:string]:{x:number,y:number}},network:Network,networkStyle:GraphStyleProperties):boolean{
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

function nodeOverlap(pos1: {x: number, y: number}, size1: {width: number, height: number}, pos2: {x: number, y: number}, size2: {width: number, height: number}): boolean {
    if (!pos1 || !size1 || !pos2 || !size2 || !size1.width || !size1.height || !size2.width
         || !size2.height || !pos1.x || !pos1.y || !pos2.x || !pos2.y) {
        // Handle null or undefined inputs appropriately
        return false;
    }

    // rectangle 1
    const left1 = pos1.x - size1.width / 2;
    const right1 = pos1.x + size1.width / 2;
    const top1 = pos1.y - size1.height / 2;
    const bottom1 = pos1.y + size1.height / 2;

    // rectangle 2
    const left2 = pos2.x - size2.width / 2;
    const right2 = pos2.x + size2.width / 2;
    const top2 = pos2.y - size2.height / 2;
    const bottom2 = pos2.y + size2.height / 2;

    // overlap?
    const overlapX = left1 < right2 && right1 > left2;
    const overlapY = top1 < bottom2 && bottom1 > top2;

    return overlapX && overlapY;
}
