import { Subgraph, TypeSubgraph } from "@/types/Subgraph";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { Node } from "@metabohub/viz-core/src/types/Node";


/**
 * Creates a new subgraph with the specified properties.
 * @param name The name of the subgraph.
 * @param nodes The array of nodes in the subgraph (defaults to an empty array).
 * @param classes The array of classes associated with the subgraph (defaults to an empty array).
 * @returns The newly created subgraph.
 */
export function createSubgraph(name: string, nodes: Array<string>, classes: Array<string>, type: TypeSubgraph = TypeSubgraph.MAIN_CHAIN, forSubgraph?: {name:string,type:TypeSubgraph}, associatedSubgraphs?:Array<{name:string,type:TypeSubgraph}>): Subgraph {
    return {
        name,
        classes,
        nodes,
        type,
        forSubgraph,
        associatedSubgraphs
    };
}

export function addNewSubgraph(subgraphNetwork:SubgraphNetwork,subgraph:Subgraph,type:TypeSubgraph=TypeSubgraph.MAIN_CHAIN): SubgraphNetwork {
    if (!subgraphNetwork[type]) subgraphNetwork[type]={};
    if(!(subgraph.name in subgraphNetwork[type])){
        // adding subgraph to subgraphNetwork
        subgraphNetwork[type][subgraph.name]=subgraph;
        // node matadata update
        subgraph.nodes.forEach(node=>{
            updateNodeMetadataSubgraph(subgraphNetwork.network.value, node, subgraph.name, type);
        });
        // if subgraph associated with another subgraph : add to associatedSubgraphs of the "parent" subgraph
        if (subgraph.forSubgraph){
          subgraphNetwork=updateParentSubgraphOf(subgraphNetwork,subgraph);
        }
    }else{
        console.error("subgraph already in subgraphNetwork : "+subgraph.name);
    }
    return subgraphNetwork;
    
}

export function updateParentSubgraphOf(subgraphNetwork:SubgraphNetwork,subgraph:Subgraph):SubgraphNetwork{
    if (subgraph.forSubgraph){
        const nameParent=subgraph.forSubgraph.name;
        const typeParent=subgraph.forSubgraph.type;
        if (nameParent in subgraphNetwork[typeParent]){
            if (!subgraphNetwork[typeParent][nameParent].associatedSubgraphs){
                subgraphNetwork[typeParent][nameParent].associatedSubgraphs=[];
            }
            subgraphNetwork[typeParent][nameParent].associatedSubgraphs.push({name:subgraph.name,type:subgraph.type});
        }else{
            console.error("parent subgraph not in subgraphNetwork");
        }
    }
    return subgraphNetwork;
}

/**
 * Adds a class to the cluster if it doesn't already exist.
 * @param subgraph The cluster to which the class will be added.
 * @param newClass The class to be added.
 * @returns The updated cluster.
 */
export function addClassSubgraph(subgraph: Subgraph, newClass: string): Subgraph {
    if (subgraph.classes && !subgraph.classes.includes(newClass)) {
        subgraph.classes.push(newClass);
    }
    return subgraph;
}

/**
 * Removes a node from the cluster.
 * @param subgraph The cluster from which the node will be removed.
 * @param name The name of the node to be removed.
 * @returns The updated cluster.
 */
export function removeNodeSubgraph(subgraph: Subgraph, name: string): Subgraph {
    const index = subgraph.nodes.indexOf(name);
    if (index !== -1) {
        subgraph.nodes.splice(index, 1);
    }
    return subgraph;
}

/**
 * Removes a class from the cluster.
 * @param subgraph The cluster from which the class will be removed.
 * @param className The name of the class to be removed.
 * @returns The updated cluster.
 */
export function removeClassSubgraph(subgraph: Subgraph, className: string): Subgraph {
    if (subgraph.classes) {
        const index = subgraph.classes.indexOf(className);
        if (index !== -1) {
            subgraph.classes.splice(index, 1);
        }
    }
    return subgraph;
}


/**
 * Adds a node to a subgraph in the subgraph network, and update the metadata of the node (name of the subgraph to wich it belongs)
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param subgraphID - The ID of the subgraph.
 * @param nodeID - The ID of the node to be added.
 * @param subgraphType - The type of the subgraph (defaults to MAIN_CHAIN).
 * @returns The updated subgraph network object.
 */
export function addNodeToSubgraph(subgraphNetwork:SubgraphNetwork,subgraphID:string,nodeID:string,subgraphType: TypeSubgraph = TypeSubgraph.MAIN_CHAIN):SubgraphNetwork{
    const network=subgraphNetwork.network.value;

    if (subgraphID in subgraphNetwork[subgraphType]){
        // if node not already in subgraph :
        if (!subgraphNetwork[subgraphType][subgraphID].nodes.includes(nodeID)){
            // add to subgraph
            subgraphNetwork[subgraphType][subgraphID].nodes.push(nodeID);
            // update metadata of node
            updateNodeMetadataSubgraph(network, nodeID, subgraphID,subgraphType);
        }
    }else{
        console.error("subgraph not in subgraphNetwork");
    }
    return subgraphNetwork;
}

/**
 * Updates the metadata of a node in the network by adding a subgraph ID to its list of subgraph.
 * If the metadata does not exist, they will be created.
 * 
 * @param network - The network object.
 * @param nodeID - The ID of the node to update.
 * @param subgraphID - The ID of the cluster to add.
 */
export function updateNodeMetadataSubgraph(network: Network, nodeID: string, subgraphID: string, subgraphType: TypeSubgraph = TypeSubgraph.MAIN_CHAIN): void {
  if ( !("metadata" in network.nodes[nodeID])){
    network.nodes[nodeID].metadata={mainChain:[],secondaryChain:[],cycles:[]};
  }
  if (!(subgraphType in network.nodes[nodeID].metadata)){
    network.nodes[nodeID].metadata[subgraphType]=[];
  }
  const listSubgraph=network.nodes[nodeID].metadata[subgraphType] as Array<string>;
  listSubgraph.push(subgraphID);
}