// Type imports
import { TypeSubgraph } from "@/types/Subgraph";
import { Network } from "@metabohub/viz-core/src/types/Network";

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

