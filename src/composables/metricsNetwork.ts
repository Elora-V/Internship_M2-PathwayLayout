import { Link } from "@metabohub/viz-core/src/types/Link";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { getTopLeftCoordFromCenter, getSizeNodePixel, getCenterCoordFromTopLeft } from "./calculateSize";
import { checkIntersection } from "line-intersect";
import { Coordinate,Size } from "@/types/CoordinatesSize";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//---------------------------------------------------- Utilitary Functions -----------------------------------------------------------//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export function getCenterNode(node: Node,networkStyle:GraphStyleProperties,coordAreCenter:boolean=false): Coordinate {
    let nodeCenter: {x:number,y:number};

    if (coordAreCenter) {
        nodeCenter={x:node.x,y:node.y};
    }else{
        nodeCenter=getCenterCoordFromTopLeft(node,networkStyle);
    }
    return nodeCenter;
}


function commonNodeBetween2Links(link1: Link,link2: Link): boolean {
    if (link1.source==link2.source || link1.source==link2.target || link1.target==link2.source || link1.target==link2.target) {
        return true;
    }else {
        return false;
    }
} 

export function countNodes(network: Network, countSideCompound: boolean = true): number {
    if (countSideCompound) {
        return Object.keys(network.nodes).length;
    } else {
        let nodes = 0;
        Object.keys(network.nodes).forEach((nodeID) => {
            const node = network.nodes[nodeID];
            if (!(node.metadata && node.metadata["isSideCompound"])) {
                nodes += 1;
            }
        });
        return nodes;
    }
}

export function countEdges(network: Network, countSideCompound: boolean = true): number {
    if (countSideCompound) {
        return network.links.length;
    } else {
        let links = 0;
        network.links.forEach(link => {
            if (!(link.source.metadata && link.source.metadata["isSideCompound"]) && !(link.target.metadata && link.target.metadata["isSideCompound"])) {
                links += 1;
            }
        });
        return links;
    }
}

function getNormalizedDirectorVector(link: Link, style: GraphStyleProperties, coordAreCenter: boolean = false): Coordinate {

    const sourceCenter = getCenterNode(link.source, style, coordAreCenter);
    const targetCenter = getCenterNode(link.target, style, coordAreCenter);

    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;

    const length = edgeLength(link, style, coordAreCenter);

    if (length === 0) {
        return { x: 0, y: 0 }; // Handle case with zero length
    }

    return {
        x: parseFloat((dx / length).toFixed(2)),
        y:  parseFloat((dy / length).toFixed(2))
    };
}

function linkOfSideCompound(link:Link):boolean{
    return (link.source.metadata && (link.source.metadata["isSideCompound"]) as boolean) || (link.target.metadata && (link.target.metadata["isSideCompound"]) as boolean);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//-------------------------------------------------------- Node Metrics --------------------------------------------------------------//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////
// ------------------------- Node overlap


export function countOverlapNodeNetwork(network: Network,networkStyle:GraphStyleProperties,coordAreCenter:boolean=false): number {
    let nb=0;
    const nodesID=Object.keys(network.nodes);

    for (let i=0 ; i<nodesID.length ; i++) {
        for (let j=i+1 ; j<nodesID.length ; j++) {
            // node1
            const node1=network.nodes[nodesID[i]];
            const coordNode1=getCenterNode(node1,networkStyle,coordAreCenter);
            const sizeNode1=getSizeNodePixel(node1,networkStyle);
            // node2
            const node2=network.nodes[nodesID[j]];
            const coordNode2=getCenterNode(node2,networkStyle,coordAreCenter);
            const sizeNode2=getSizeNodePixel(node2,networkStyle);

            if (nodesOverlap(coordNode1,sizeNode1,coordNode2,sizeNode2)){
                nb+=1;
            }
        }
    }
    return nb;
}



function nodesOverlap(coord1: Coordinate, size1: Size, coord2: Coordinate, size2: Size): boolean {

    // coordinate are center

    if ( !size1.width || !size1.height || !size2.width || !size2.height || !coord1.x || !coord1.y || !coord2.x || !coord2.y) {
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


/////////////////////////////////////////////////////
// ------------------------- Node on edge



export function countOverlapNodeEdgeNetwork(network: Network,networkStyle:GraphStyleProperties,coordAreCenter:boolean=false): number {
    let nb=0;
    const nodesID=Object.keys(network.nodes);
    nodesID.forEach( (nodeID) =>{

        const node=network.nodes[nodeID];
        const coordNode1=getCenterNode(node,networkStyle,coordAreCenter);
        const sizeNode=getSizeNodePixel(node,networkStyle);
        nb += countOverlapEdgeForNode(network,networkStyle,nodeID,coordNode1,sizeNode,coordAreCenter);

    });

    return nb;
}

function countOverlapEdgeForNode(network:Network,networkStyle:GraphStyleProperties,nodeID:string,coordNode:Coordinate,sizeNode:Size,coordAreCenter:boolean=false): number {
    let nb=0;

    network.links.forEach(link => {        
        // if node not linked to the edge : check if it is on the edge
        if(!(link.source.id==nodeID || link.target.id==nodeID)){

            let coordSource=getCenterNode(link.source,networkStyle,coordAreCenter);
            let coordTarget=getCenterNode(link.target,networkStyle,coordAreCenter);

            if (nodeEdgeOverlap(coordNode,sizeNode,coordSource,coordTarget)){
                nb+=1;
            }
        }
    });
    return nb;
}


function nodeEdgeOverlap(centerCoordNode: Coordinate, sizeNode: Size, coordSource: Coordinate, coordTarget: Coordinate): boolean { // CORRIGER !!!!!
    
    // Treat the node as a rectangle (coordinates are center of node)
    const rect = {
        left: centerCoordNode.x - sizeNode.width / 2,
        right: centerCoordNode.x + sizeNode.width / 2,
        top: centerCoordNode.y - sizeNode.height / 2,
        bottom: centerCoordNode.y + sizeNode.height / 2
    };

    // Check if any of the edge's endpoints is inside the rectangle => same as node overlap (to suppress ?)
    const isPointInsideRect = (point: Coordinate) => 
        point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;

    if (isPointInsideRect(coordSource) || isPointInsideRect(coordTarget)) {
        return true; // One of the endpoints is inside the rectangle
    }

    // Check for overlap between the edge and the sides of the rectangle
    // Convert the sides of the rectangle into line segments
    const rectangleEdges = [
        { start: { x: rect.left, y: rect.top }, end: { x: rect.right, y: rect.top } }, // Top
        { start: { x: rect.right, y: rect.top }, end: { x: rect.right, y: rect.bottom } }, // Right
        { start: { x: rect.left, y: rect.bottom }, end: { x: rect.right, y: rect.bottom } }, // Bottom
        { start: { x: rect.left, y: rect.top }, end: { x: rect.left, y: rect.bottom } } // Left
    ];

    // Use checkIntersection function to check if two line segments intersect
    for (const edge of rectangleEdges) {
        const result = checkIntersection(edge.start.x,edge.start.y, edge.end.x,edge.end.y, coordSource.x, coordSource.y,coordTarget.x,coordTarget.y);
        if (result.type === "intersecting") {
            return true; // There is an overlap
        }
    }

    return false; // No overlap detected
}


/////////////////////////////////////////////////////
// ------------------------- Node different coordinates

export function countDifferentCoordinatesNodeNetwork(network: Network, networkStyle: GraphStyleProperties, coordAreCenter: boolean = false, countSideCompound:boolean=true,roundAt: number = 2): { x: number, y: number } {
    let uniqueX = new Set<number>();
    let uniqueY = new Set<number>();

    Object.keys(network.nodes).forEach((nodeID) => {
        const node = network.nodes[nodeID];
        // Do not count side compounds if countSideCompound is false
        if (countSideCompound ||  !(node.metadata && node.metadata["isSideCompound"])) {
            const coordNode = getCenterNode(node, networkStyle, coordAreCenter);
            
            // Round the coordinates based on roundAt
            const roundedX = parseFloat(coordNode.x.toFixed(roundAt));
            const roundedY = parseFloat(coordNode.y.toFixed(roundAt));
            
            uniqueX.add(roundedX);
            uniqueY.add(roundedY);
        }
    });

    return { x: uniqueX.size, y: uniqueY.size };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//-------------------------------------------------------- Edge Metrics --------------------------------------------------------------//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////
// ------------------------- Edge intersection
// (overlap not taken into account)


/**
 * Counts how many crossings are in a network
 * @param network the network
 * @returns the number of crossings
 */
export function countIntersectionEdgeNetwork(network: Network,style:GraphStyleProperties,coordAreCenter:boolean=false): number {
    let nb: number = 0;
    for (let i=0 ; i<network.links.length ; i++) {
        for (let j=i+1 ; j<network.links.length ; j++) {
            const link1=network.links[i];
            const link2=network.links[j];
            if (edgesIntersect(link1, link2,style,coordAreCenter)){
                nb++;
            }
        }
    }
    return nb;
}

function edgesIntersect(link1: Link, link2: Link,style:GraphStyleProperties,coordAreCenter:boolean=false): boolean {

    // Case of common node
    if (commonNodeBetween2Links(link1,link2)) {
        return false;
    }

    // Get center of node : where the link is attached
    const node1Center=getCenterNode(link1.source,style,coordAreCenter);
    const node2Center=getCenterNode(link1.target,style,coordAreCenter);
    const node3Center=getCenterNode(link2.source,style,coordAreCenter);
    const node4Center=getCenterNode(link2.target,style,coordAreCenter);


    // Check intersection
    const result = checkIntersection(node1Center.x, node1Center.y, node2Center.x, node2Center.y, node3Center.x, node3Center.y, node4Center.x, node4Center.y);
    if (result.type == "intersecting") {
        return true;
    } else {
        return false;
    }
    
}

/////////////////////////////////////////////////////
// ------------------------- Edge length


export function coefficientOfVariationEdgeLength(network: Network,style:GraphStyleProperties,coordAreCenter:boolean=false,includeSideCompounds:boolean=true): number {

    let links = network.links;

    if (!includeSideCompounds) {
        links = links.filter(link => 
            !(link.source.metadata && link.source.metadata["isSideCompound"]) && 
            !(link.target.metadata && link.target.metadata["isSideCompound"])
        );
    }

    if (links.length === 0) {
        return 0; // Handle case with no edge 
    }

    const lengths = links.map(link => edgeLength(link, style, coordAreCenter));
    
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    if (mean === 0) {
        return 0; // Handle case with no edge lengths
    }
    const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
    const stdDeviation = Math.sqrt(variance);
    const coefVariation = stdDeviation / mean;
    return parseFloat(coefVariation.toFixed(3));
}

function edgeLength(link: Link,style:GraphStyleProperties,coordAreCenter:boolean=false): number {
    const sourceCenter=getCenterNode(link.source,style,coordAreCenter);
    const targetCenter=getCenterNode(link.target,style,coordAreCenter);

    const dx = sourceCenter.x - targetCenter.x;
    const dy = sourceCenter.y - targetCenter.y;
    return Math.sqrt(dx * dx + dy * dy);
}



/////////////////////////////////////////////////////
// ------------------------- Edge colinear with axis 
// => function used with edge direction

function calculateNormalizedDirectorVectors(links: Link[], style: GraphStyleProperties, coordAreCenter: boolean = false,includeSideCompounds:boolean=true): Coordinate[] {
    const vectors: Coordinate[] = [];

    links.forEach(link => {
        if (includeSideCompounds || !linkOfSideCompound(link)){
            const normalizedVector = getNormalizedDirectorVector(link, style, coordAreCenter);
            vectors.push(normalizedVector);
        }
       
    });

    return vectors;
}

function isColinearAxisNetwork(vector:Coordinate): boolean {
        return vector.x === 0 || vector.y === 0;
}

function countEdgeColinearAxisNetwork(vectors:Coordinate[], pourcentage:boolean=false): number {

    if (vectors.length === 0) {
        return 0;
    }

    let count = 0;
    vectors.forEach(vector => {
        if (isColinearAxisNetwork(vector)) {
            count += 1;
        }
    });
    if (pourcentage) {
        return parseFloat((count / vectors.length).toFixed(2));
    }
    return count;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//-------------------------------------------------------- Domain Metrics --------------------------------------------------------------//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// WHEN CLEAN : fonction that said if sidecompound or not

/////////////////////////////////////////////////////
// ------------------------- Edge direction

export function analyseDirectorVector(network: Network, style: GraphStyleProperties, coordAreCenter: boolean = false, pourcentageColinearAxis:boolean=false, includeSideCompounds:boolean=true):{colinearAxis:number,coefVariation:number} { 
    
    const result: { colinearAxis: number, coefVariation: number } = { colinearAxis: undefined, coefVariation: undefined };

    let links = network.links;

    if (!includeSideCompounds) {
        links = links.filter(link => 
            !(link.source.metadata && link.source.metadata["isSideCompound"]) && 
            !(link.target.metadata && link.target.metadata["isSideCompound"])
        );
    }
    
    // get all normalized director vectors
    const vectors = calculateNormalizedDirectorVectors(links, style, coordAreCenter,includeSideCompounds);
    if (vectors.length==0) return { colinearAxis: 0, coefVariation: 0 }

    // count colinear with axis
    result.colinearAxis = countEdgeColinearAxisNetwork(vectors,pourcentageColinearAxis);

    // coeficient of variation of angle

     // calculate angles of vectors
     const angles = vectors.map(vector => Math.atan2(vector.y, vector.x));

     // calculate mean of angles
     const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
     if (mean === 0) {
         result.coefVariation = 0; // Handle case with no angles
         return result;
     }
 
     // calculate variance of angles
     const variance = angles.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / angles.length;
 
     // calculate standard deviation
     const stdDeviation = Math.sqrt(variance);
 
     // calculate coefficient of variation
     const coefVariation = stdDeviation / mean;
     result.coefVariation = parseFloat(coefVariation.toFixed(2));
 
     return result;

}


