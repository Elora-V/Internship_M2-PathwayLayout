import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { Node } from "@metabohub/viz-core/src/types/Node";


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
 * Calculates the size of a node in pixels based on its style properties.
 * @param node - The node for which to calculate the size.
 * @param styleNetwork - The style properties of the graph.
 * @returns An object containing the height and width of the node in pixels.
 */
function getSizeNodePixel(node:Node,styleNetwork:GraphStyleProperties):{height:number,width:number}{
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
function pixelsToInches(pixels: number, dpi: number = 96): number {
    return parseFloat((pixels / dpi).toFixed(2));
}