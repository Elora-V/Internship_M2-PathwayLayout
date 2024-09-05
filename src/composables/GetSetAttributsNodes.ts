// Type imports
import { NetworkLayout } from "@/types/NetworkLayout";
import { TypeSubgraph } from "@/types/Subgraph";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { link } from "fs";
import { Link } from "@metabohub/viz-core/src/types/Link";

/**
 * This file contains functions to check if a node has a specific attribute
 * 
 * *********************************
 * 0. Side Compounds
 * 
 * -> isSideCompound :
 *      Return if the node is declare as side compound
 * 
 * -> getAttributSideCompounds :
 *     Returns the attribut for side compound nodes.
 * 
 * -> setAsSideCompound :
 *    Set the node as side compound
 * 
 * 
 * *********************************
 * 1. Duplicate
 * 
 * -> isDuplicate :
 *          Checks if a node in the network is a duplicate.
 * 
 * -> getClassDuplicate :
 *           Returns the class name for duplicated nodes.
 * 
 * *********************************
 * 2. Reversible
 * 
 * 
 * 
 * *********************************
 * 3.  Cycle
 * 
 * 
 */


/*******************************************************************************************************************************************************/
//___________________________________________________0.  Side Compounds __________________________________________________________________________



const sideCompoundAttribute="isSideCompound";

/**
 * Return if the node is declare as side compound
 * @param network 
 * @param nodeID id of the node
 * @returns node is a side compound ?
 */
export function isSideCompound(network:Network,nodeID:string):boolean{
    return Boolean(network.nodes[nodeID].metadata && network.nodes[nodeID].metadata[sideCompoundAttribute]);
}

/**
 * Returns the attribut for side compound nodes.
 * @returns the attribut for side compound nodes
 */
export function getAttributSideCompounds():string{
    return sideCompoundAttribute;
}

/**
 * Set the node as side compound
 * @param network 
 * @param nodeID id of the node
 */
export function setAsSideCompound(network:Network,nodeID:string):void{
    if(!network.nodes[nodeID]) throw new Error("Node not found");
    if(!network.nodes[nodeID].metadata) network.nodes[nodeID].metadata={};
    network.nodes[nodeID].metadata[sideCompoundAttribute]=true;
}


/*******************************************************************************************************************************************************/
//___________________________________________________1.  Duplicate __________________________________________________________________________



const classDuplicate="duplicate";

/**
 * Checks if a node in the network is a duplicate.
 * @param network - The network object.
 * @param nodeID - The ID of the node to check.
 * @returns A boolean indicating whether the node is a duplicate.
 */
export function isDuplicate(network:Network,nodeID:string):boolean{
    return Boolean(network.nodes[nodeID].classes && network.nodes[nodeID].classes.includes(classDuplicate));
}

/**
 * Returns the class name for duplicated nodes.
 * @returns the class name for duplicate nodes
 */
export function getClassDuplicate():string{
    return classDuplicate;
}



/*******************************************************************************************************************************************************/
//___________________________________________________2.  Reversible __________________________________________________________________________

const classReversible="reversible";
const reversibleAttribute="reversible";
const reactionClass="reaction";

/**
 * Checks if a node in the network is reversible by checking its classes.
 * => done for my type of file, not necessaty if reversible information already in the metadata
 * @param network - The network object.
 */
export async function addMetadataReversibleWithClass(network:Network):Promise<void>{
    Object.values(network.nodes).forEach((node) => {
      if(node.classes && node.classes.includes(classReversible)){
        addReversibleNetwork(network,node.id);
      }
    });
  }


/**
 * Adds the reversible attribute to the given node in the network.
 * 
 * @param network - The network object.
 * @param node - The node to add the reversible attribute to.
 */
export function addReversibleNetwork(network:Network,nodeID:string):void{
    if (!network.nodes[nodeID]){
        throw new Error("Node not found to set as reversible ");
    }
    if(!network.nodes[nodeID].metadata){
        network.nodes[nodeID].metadata={};
    }
    network.nodes[nodeID].metadata[reversibleAttribute]=true;
}

/**
 * Adds the reversible attribute to the given node.
 * 
 * @param node - The node to add the reversible attribute to.
 * @returns The modified node with the reversible attribute added.
 */
export function addReversible(node:Node):Node{
    if(!node.metadata){
        node.metadata={};
    }
    node.metadata[reversibleAttribute]=true;
    return node;
}

/**
 * Adds a class to the given node's classes array in a reversible manner.
 * If the node does not have a classes array, it creates one.
 * @param node - The node to add the class to.
 * @returns The modified node with the added class.
 */
export function addLinkClassReversible(link:Link):Link{
    if(!link.classes){
        link.classes=[];
    }
    link.classes=pushUniqueString(link.classes,classReversible);
    return link;
}

/**
 * Adds a unique string value to an array if it does not already exist.
 * 
 * @param object - The array to add the value to.
 * @param value - The string value to add.
 * @returns The updated array with the added value, if it was not already present.
 */
export function pushUniqueString(object:Array<string>, value: string): Array<string> {
    if (!object.includes(value)) {
        object.push(value);
    }
    return object;
  }


/**
 * Checks if a node in the network is reversible.
 * 
 * @param {Network} network - The network object.
 * @param {string} nodeID - The ID of the node to check.
 * @returns {boolean} - Returns true if the node is reversible, otherwise false.
 * @throws {Error} - Throws an error if the node is not found.
 */
export function isReversible(network:Network,nodeID:string):boolean{
    if (!network.nodes[nodeID]){
        throw new Error("Node not found to check if reversible");
    }
    return Boolean(network.nodes[nodeID].metadata && network.nodes[nodeID].metadata[reversibleAttribute]);
}

/**
 * Checks if a given node is a reaction.
 * 
 * @param node - The node to check.
 * @returns A boolean indicating whether the node is a reaction.
 */
export function isReaction(node:Node):boolean{
    return Boolean(node.classes && node.classes.includes(reactionClass));
}


/*******************************************************************************************************************************************************/
//___________________________________________________3.  Cycle  __________________________________________________________________________



/**
 * Checks if a node is part of a cycle in the network.
 * @param network - The network object.
 * @param idNode - The ID of the node to check.
 * @returns A boolean indicating whether the node is in a cycle or not.
 */
export function inCycle(network: Network, idNode: string): boolean {
    // no metadata or no cycle metadata or empty cycle metadata : that is, not in a cycle
    console.warn("change matadatlayout inCycle");
    let inCycle:boolean=false;
    if (idNode in network.nodes && "metadata" in network.nodes[idNode] 
        && TypeSubgraph.CYCLE in network.nodes[idNode].metadata){
            const cycles=network.nodes[idNode].metadata[TypeSubgraph.CYCLE] as string[];
            if (cycles.length>0) inCycle=true;
    }
    return inCycle;
}

