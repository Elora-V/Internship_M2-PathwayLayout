import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { getNodesPlacedInGroupCycle, inCycle } from "./drawCycle";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { Subgraph } from "@/types/Subgraph";


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

export function getSepAttributesPixel(network:Network,styleNetwork:GraphStyleProperties,factor:number=1):{rankSep:number,nodeSep:number}{
    const meanSizeNode=getMeanNodesSizePixel(Object.values(network.nodes),styleNetwork);
    const rankSep = meanSizeNode.height * factor;
    const nodeSep = meanSizeNode.width * factor;
    return { rankSep, nodeSep };
}


/**
 * Calculates the size of a node in pixels based on its style properties.
 * @param node - The node for which to calculate the size.
 * @param styleNetwork - The style properties of the graph.
 * @returns An object containing the height and width of the node in pixels.
 */
export function getSizeNodePixel(node:Node,styleNetwork:GraphStyleProperties):{height:number,width:number}{
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
    return {height:height,width:width};
}

/**
 * Calculates the mean size of nodes in pixels.
 * 
 * @param nodes - An array of nodes.
 * @param styleNetwork - The style properties of the graph.
 * @returns An object containing the mean height and width of the nodes in pixels.
 */
export function getMeanNodesSizePixel(nodes:Node[],styleNetwork:GraphStyleProperties):{height:number,width:number}{
    let height:number = 0;
    let width:number = 0;
    nodes.forEach((node)=>{
        let size = getSizeNodePixel(node,styleNetwork);
        height += size.height;
        width += size.width;
    });
    return {height:height/nodes.length,width:width/nodes.length};
}

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
 * Calculates the minimum length distance between nodes in a network.
 * 
 * @param network - The network object containing nodes.
 * @returns The minimum length distance between nodes.
 */
export function minLengthDistance(network: Network,cycleInclude:boolean=true,defaultMinLength:number=0): number {
    let minDistance = Infinity;
    network.links.forEach((link) => {
        if (cycleInclude || (!inCycle(network,link.target.id) || !inCycle(network,link.source.id)) ){
            const dx = link.source.x - link.target.x;
            const dy = link.source.y - link.target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            minDistance = Math.min(minDistance, distance);
        }
    });
    minDistance= parseFloat(minDistance.toFixed(2));
    if(minDistance === Infinity){
        return defaultMinLength;
    }
    return minDistance;
}

/**
 * Calculates the median length distance between nodes in a network.
 * 
 * @param network - The network object containing nodes.
 * @param cycleInclude - Flag to include or exclude links in cycles.
 * @returns The median length distance between nodes.
 */
export function medianLengthDistance(network: Network, cycleInclude: boolean = true): number {
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

/**
 * Calculates the size and center coordinates of a rectangle based on a list of coordinates.
 * @param listCoordinates - The list of coordinates representing the corners of the rectangle.
 * @returns An object containing the width, height, and center coordinates of the rectangle.
 */
export function rectangleSize(listCoordinates:{x:number,y:number}[],listID?:string[],subgraphNetwork?:SubgraphNetwork):{width:number,height:number,center:{x:number,y:number}}{

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
        const minXNode = listID[minXIndex];
        const sizeMinXNode = getSizeNodePixel(subgraphNetwork.network.value.nodes[minXNode],subgraphNetwork.networkStyle.value);
        minX = minX - sizeMinXNode.width/2;
        // max x
        const maxXNode = listID[maxXIndex];
        const sizeMaxXNode = getSizeNodePixel(subgraphNetwork.network.value.nodes[maxXNode],subgraphNetwork.networkStyle.value);
        maxX = maxX + sizeMaxXNode.width/2;
        // min y
        const minYNode = listID[minYIndex];
        const sizeMinYNode = getSizeNodePixel(subgraphNetwork.network.value.nodes[minYNode],subgraphNetwork.networkStyle.value);
        minY = minY - sizeMinYNode.height/2;
        // max y
        const maxYNode = listID[maxYIndex];
        const sizeMaxYNode = getSizeNodePixel(subgraphNetwork.network.value.nodes[maxYNode],subgraphNetwork.networkStyle.value);
        maxY = maxY + sizeMaxYNode.height/2;
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

export function getSizeAllGroupCycles(subgraphNetwork:SubgraphNetwork):SubgraphNetwork{
    Object.values(subgraphNetwork.cyclesGroup).forEach(groupCycle => {
        subgraphNetwork=getSizeGroupCycles(subgraphNetwork,groupCycle);
    });

    return subgraphNetwork;
}

function getSizeGroupCycles(subgraphNetwork:SubgraphNetwork,groupCycle:Subgraph):SubgraphNetwork{
    if (groupCycle.metadata){
        // get all nodes with x and y coordinates
        const listNodesMetadata = Object.entries(groupCycle.metadata)
                        .filter(([_,item]) => item["x"] !== undefined && item["y"] !== undefined);
        const listCoordinates = listNodesMetadata.map(([_,item]) => {return {x:item["x"],y:item["y"]}});
        const listID = listNodesMetadata.map(([id,_]) => {return id});
        // get the size of the rectangle
        const {width,height,center}=rectangleSize(listCoordinates,listID,subgraphNetwork);
        groupCycle.width=width;
        groupCycle.height=height;
        groupCycle.originCoordinates=center;
    }
    return subgraphNetwork;
}