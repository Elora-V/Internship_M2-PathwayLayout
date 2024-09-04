// Type imports
import { Network } from "@metabohub/viz-core/src/types/Network";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { Subgraph, TypeSubgraph } from "@/types/Subgraph";
import { Coordinate, Size } from "@/types/CoordinatesSize";

// Composable imports
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";
import { inCycle } from "./GetSetAttributsNodes";

// General imports
import { e } from "vitest/dist/reporters-1evA5lom";



/**
 * This file contains functions to calculate the size of nodes, edges and subgraphs. Anf function to shift coordinates depending on node size.
 * 
 * *********************************
 * 0.  Nodes
 * 
 * -> pixelsToInches :
 *          Converts pixels to inches based on the given DPI (dots per inch).
 * 
 * -> inchesToPixels :
 *         Converts inches to pixels based on the given DPI (dots per inch).
 * 
 * -> getSizeNodePixel :
 *        Calculates the size of a node in pixels based on its style properties.
 * 
 * -> getMeanNodesSizePixel :
 *       Calculates the mean size of nodes in pixels.
 * 
 * -> getSepAttributesInches :
 *      Calculate the rank separation and node separation in inches depending on node size.
 * 
 * -> getSepAttributesPixel :
 *     Calculate the rank separation and node separation in pixels depending on node size.
 * 
 * 
 * *********************************
 * 1.  Edges
 * 
 * -> minEdgeLength :
 *     Calculates the minimum edge length between nodes in a network.
 * 
 * -> medianLengthDistance :
 *    Calculates the median edge length between nodes in a network.
 * 
 * 
 * *********************************
 * 2.  Subgraphs
 * 
 * -> rectangleSize :
 *      Calculates the size and center coordinates of a rectangle based on a list of coordinates.
 * 
 * -> getSizeAllGroupCycles :
 *      Calculates the size of all group cycles.
 * 
 * -> getSizeGroupCycles :
 *      Calculates the size of a group cycle.
 * 
 * 
 * *********************************
 * 3.  Shift coordinates depending on size
 * 
 * -> shiftAllToGetTopLeftCoord :
 *       Shifts all nodes in the network to get the top left coordinate based on the given style.
 * 
 * -> getTopLeftCoordFromCenter :
*        Calculates the top left coordinate of a node based on its center coordinate and size.
 * 
 * -> getCenterCoordFromTopLeft :
 *       Calculates the center coordinates of a node based on its top-left coordinates and size.
 * 
 */


/*******************************************************************************************************************************************************/
//___________________________________________________0.  Nodes __________________________________________________________________________


const defaultHeightNode = 25;
const defaultWidthNode = 25;


/**
 * Converts pixels to inches based on the given DPI (dots per inch).
 * @param pixels - The number of pixels to convert.
 * @param dpi - The DPI value to use for the conversion. Defaults to 96 DPI.
 * @returns The converted value in inches.
 */
export function pixelsToInches(pixels: number, dpi: number = 72): number {
    return parseFloat((pixels / dpi).toFixed(2));
}

/**
 * Converts inches to pixels based on the given DPI (dots per inch).
 * @param inches - The number of inches to convert.
 * @param dpi - The DPI value to use for the conversion. Defaults to 72 DPI.
 * @returns The converted value in pixels.
 */
export function inchesToPixels(inches: number, dpi: number = 72): number {
    return parseFloat((inches * dpi).toFixed(2));
}

/**
 * Calculates the size of a node in pixels based on its style properties.
 * @param node - The node for which to calculate the size.
 * @param styleNetwork - The style properties of the graph.
 * @returns An object containing the height and width of the node in pixels.
 */
export function getSizeNodePixel(node:Node,styleNetwork:GraphStyleProperties):Size{
    let height:number;
    let width:number;
    if (node.classes && styleNetwork.nodeStyles){
        node.classes.forEach((classe)=>{
            if (classe in styleNetwork.nodeStyles){;
                const style=styleNetwork.nodeStyles[classe];
                height = style.height? style.height:height;
                width = style.width? style.width:width;
            }
        });
    }
    if (!height){
        height = defaultHeightNode;
    }
    if (!width){
        width = defaultWidthNode;
    }

    return {height:height,width:width};
}

/**
 * Calculates the mean size of nodes in pixels.
 * 
 * @param nodes - An array of nodes.
 * @param styleNetwork - The style properties of the graph.
 * @returns An object containing the mean height and width of the nodes in pixels.
 */
export function getMeanNodesSizePixel(nodes:Node[],styleNetwork:GraphStyleProperties,includeSideCompounds:boolean=true):Size{
    let height:number = 0;
    let width:number = 0;
    let n:number = 0;
    nodes.forEach((node)=>{
        if (includeSideCompounds ||  !(node.metadata && node.metadata["isSideCompound"])) {
            let size = getSizeNodePixel(node,styleNetwork);
            height += size.height;
            width += size.width;
            n+=1;
        }
    });

    if (n===0){
        return {height:defaultHeightNode,width:defaultWidthNode};
    }

    return {height:height/n,width:width/n};
}


/**
 * Calculate the rank separation and node separation in inches depending on node size : 
 * rank separation = mean height node * factor
 * node separation = mean width node * factor
 * @param network contains nodes
 * @param styleNetwork contains informations of nodes size
 * @param factor number of mean size node for the sep attributes
 * @returns rank separation and node separation in inches
 */
export function getSepAttributesInches(network:Network,styleNetwork:GraphStyleProperties,factor:number=1):{rankSep:number,nodeSep:number}{
    const meanSizeNode=getMeanNodesSizePixel(Object.values(network.nodes),styleNetwork);
    const rankSep = pixelsToInches(meanSizeNode.height * factor);
    const nodeSep = pixelsToInches(meanSizeNode.width * factor);
    return { rankSep, nodeSep };
}

/**
 * Calculate the rank separation and node separation in pixels depending on node size : 
 * rank separation = mean height node * factor
 * node separation = mean width node * factor
 * @param network contains nodes
 * @param styleNetwork contains informations of nodes size
 * @param factor number of mean size node for the sep attributes
 * @returns rank separation and node separation in pixels
 */
export function getSepAttributesPixel(network:Network,styleNetwork:GraphStyleProperties,factor:number=1):{rankSep:number,nodeSep:number}{
    const meanSizeNode=getMeanNodesSizePixel(Object.values(network.nodes),styleNetwork);
    const rankSep = meanSizeNode.height * factor;
    const nodeSep = meanSizeNode.width *factor;
    return { rankSep, nodeSep };
}


/*******************************************************************************************************************************************************/
//___________________________________________________1.  Edges __________________________________________________________________________


const defaultMinEdgeLength = 25;


/**
 * Calculates the minimum edge length between nodes in a network.
 * 
 * @param network - The network object containing nodes.
 * @returns The minimum edge length between nodes.
 */
export function minEdgeLength(network: Network,cycleInclude:boolean=true): number {
    let minDistance = Infinity;
    network.links.forEach((link) => {
        if (cycleInclude || (!inCycle(network,link.target.id) || !inCycle(network,link.source.id)) ){
            const dx = link.source.x - link.target.x;
            const dy = link.source.y - link.target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance !==null && distance !== undefined && !isNaN(distance)){
                minDistance = Math.min(minDistance, distance);
            }
        }
    });
    minDistance= parseFloat(minDistance.toFixed(2));
    if(minDistance === Infinity || !minDistance){
        return NaN;
    }
    return minDistance;
}

/**
 * Calculates the median edge length between nodes in a network.
 * 
 * @param network - The network object containing nodes.
 * @param cycleInclude - Flag to include or exclude links in cycles.
 * @returns The median length distance between nodes.
 */
export function medianEdgeLength(network: Network, cycleInclude: boolean = true): number {
    const distances: number[] = [];
    network.links.forEach((link) => {
        if (cycleInclude || (!inCycle(network, link.target.id) || !inCycle(network, link.source.id))) {
            const dx = link.source.x - link.target.x;
            const dy = link.source.y - link.target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            distances.push(distance);
        }
    });

    distances.sort((a, b) => a - b);

    if (distances.length === 0) return 0; // Handle case with no distances

    const mid = Math.floor(distances.length / 2);

    // If even number of distances, median is average of two middle numbers
    if (distances.length % 2 === 0) {
        return parseFloat(((distances[mid - 1] + distances[mid]) / 2).toFixed(2));
    }

    // If odd number of distances, median is middle number
    return parseFloat(distances[mid].toFixed(2));
}


/*******************************************************************************************************************************************************/
//___________________________________________________2.  Subgraphs __________________________________________________________________________


/**
 * Calculates the size and center coordinates of a rectangle based on a list of coordinates.
 * @param listCoordinates - The list of coordinates in the rectangle.
 * @returns An object containing the width, height, and center coordinates of the rectangle.
 */
export function rectangleSize(listCoordinates:Coordinate[],listID?:string[],subgraphNetwork?:SubgraphNetwork):{width:number,height:number,center:Coordinate}{

    // get the x and y coordinates
    const xCoordinates=listCoordinates.map(coord=>coord.x);
    const yCoordinates=listCoordinates.map(coord=>coord.y);

    // get the min and max of x and y coordinates
    let minX = Math.min(...xCoordinates);
    const minXIndex = xCoordinates.indexOf(minX); 

    let maxX = Math.max(...xCoordinates);
    const maxXIndex = xCoordinates.indexOf(maxX); 

    let minY = Math.min(...yCoordinates);
    const minYIndex = yCoordinates.indexOf(minY); 

    let maxY = Math.max(...yCoordinates);
    const maxYIndex = yCoordinates.indexOf(maxY); 

    // if nodes ID : take into account its size
    if (listID && subgraphNetwork){

        // min x
        if (minXIndex === -1){
            minX = -defaultWidthNode/2;
        } else {
            const minXNode = listID[minXIndex];
            const sizeMinXNode = getSizeNodePixel(subgraphNetwork.network.value.nodes[minXNode],subgraphNetwork.networkStyle.value);
            minX = minX - sizeMinXNode.width/2;
        }

        // max x
        if (maxXIndex === -1){
            maxX = defaultWidthNode/2;
        }else {
            const maxXNode = listID[maxXIndex];
            const sizeMaxXNode = getSizeNodePixel(subgraphNetwork.network.value.nodes[maxXNode],subgraphNetwork.networkStyle.value);
            maxX = maxX + sizeMaxXNode.width/2;
        }

        // min y
        if (minYIndex === -1){
            minY = -defaultHeightNode/2;
        } else {
            const minYNode = listID[minYIndex];
            const sizeMinYNode = getSizeNodePixel(subgraphNetwork.network.value.nodes[minYNode],subgraphNetwork.networkStyle.value);
            minY = minY - sizeMinYNode.height/2;
        }

        // max y
        if (maxYIndex === -1){
            maxY = defaultHeightNode/2;
        } else {
            const maxYNode = listID[maxYIndex];
            const sizeMaxYNode = getSizeNodePixel(subgraphNetwork.network.value.nodes[maxYNode],subgraphNetwork.networkStyle.value);
            maxY = maxY + sizeMaxYNode.height/2;
        }
    }

    return {
        width: maxX - minX,
        height: maxY - minY,
        center: {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2
        }
    };
}



/**
 * Calculates the size of all group cycles 
 * 
 * @param subgraphNetwork - The subgraph network to calculate the size for.
 * @returns The subgraphNetwork with the size of all group cycles calculated.
 */
export function getSizeAllGroupCycles(subgraphNetwork:SubgraphNetwork):SubgraphNetwork{
    Object.values(subgraphNetwork[TypeSubgraph.CYCLEGROUP]).forEach(groupCycle => {
        subgraphNetwork=getSizeGroupCycles(subgraphNetwork,groupCycle);
    });

    return subgraphNetwork;
}

/**
 * Calculates the size of a group cycle.
 * 
 * @param subgraphNetwork - The subgraph network to calculate the size for.
 * @param groupCycle - The group cycle to calculate the size for.
 * @returns The subgraphNetwork with the size of the group cycle calculated.
 */
function getSizeGroupCycles(subgraphNetwork:SubgraphNetwork,groupCycle:Subgraph):SubgraphNetwork{
    if (groupCycle.metadata){
        // get all nodes with x and y coordinates
        console.warn('modifier getSizeGroupCycle avec nouveau attribut position');
        const listNodesMetadata = Object.entries(groupCycle.metadata)
                        .filter(([_,item]) => item["x"] !== undefined && item["y"] !== undefined);
        const listCoordinates = listNodesMetadata.map(([_,item]) => {return {x:item["x"],y:item["y"]}});
        const listID = listNodesMetadata.map(([id,_]) => {return id});
        // get the size of the rectangle
        const {width,height,center}=rectangleSize(listCoordinates,listID,subgraphNetwork);
        groupCycle.width=width;
        groupCycle.height=height;
        groupCycle.originalPosition=center;
    }
    return subgraphNetwork;
}


/*******************************************************************************************************************************************************/
//___________________________________________________3.  Shift coordinates depending on size ____________________________________________________________


/**
 * Shifts all nodes in the network to get the top left coordinate based on the given style.
 * 
 * @param network - The network object containing the nodes.
 * @param style - The style properties used to calculate the top left coordinate.
 * @param moveCycleToo - Optional parameter indicating whether to move nodes in cycles as well. Defaults to true.
 */
export function shiftAllToGetTopLeftCoord(network:Network,style:GraphStyleProperties,moveCycleToo:boolean=true) {
    Object.values(network.nodes).forEach(node=>{
        if( moveCycleToo || !inCycle(network,node.id)){
            const {x,y}=getTopLeftCoordFromCenter(node,style);
            node.x=x;
            node.y=y;
        }
    })
}

/**
 * Calculates the top left coordinate of a node based on its center coordinate and size.
 * 
 * @param node - The node for which to calculate the top left coordinate.
 * @param style - The style properties of the node.
 * @returns The top left coordinate of the node.
 */
export function getTopLeftCoordFromCenter(node:Node,style:GraphStyleProperties):Coordinate{
    const size = getSizeNodePixel(node,style);
    return {x:node.x-size.width/2,y:node.y-size.height/2}
}

/**
 * Calculates the center coordinates of a node based on its top-left coordinates and size.
 * 
 * @param node - The node for which to calculate the center coordinates.
 * @param style - The style properties of the node.
 * @returns The center coordinates of the node.
 */
export function getCenterCoordFromTopLeft(node:Node,style:GraphStyleProperties):Coordinate{
    const size = getSizeNodePixel(node,style);
    return {x:node.x+size.width/2,y:node.y+size.height/2}
}