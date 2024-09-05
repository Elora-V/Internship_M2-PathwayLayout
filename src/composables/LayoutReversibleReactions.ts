// Type imports
import { Link } from "@metabohub/viz-core/src/types/Link";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { TypeSubgraph } from "@/types/Subgraph";
import { StartNodesType } from "@/types/EnumArgs";
import { NetworkLayout, NodeLayout } from "@/types/NetworkLayout";

// Composable imports
import { removeAllSelectedNodes } from "@metabohub/viz-core";
import { BFSWithSources } from "./AlgorithmBFS";
import { updateNodeMetadataSubgraph } from "./UseSubgraphNetwork";
import { addLinkClassReversible, addMetadataReversibleWithClass, addReversible, isReaction, isReversible } from "./GetSetAttributsNodes";

// General imports
import { e } from "vitest/dist/reporters-1evA5lom";
import { l } from "vite/dist/node/types.d-aGj9QkWt";



/**
 * 
 * 
 */






/**
 * Take a network and add a duplicated node of reversible reactions, and add links to this reaction
 * @param {Network}  Network object
 * @param suffix to put at the end of id of the original reaction : can't be "" !
 */
export async function duplicateReversibleReactions(networkLayout:NetworkLayout):Promise<void> {

  try {
    // add metadata "reversible" to nodes
    console.warn("add metadata reversible if in the class. Not necessary if file with correct format (done bcs of the file I have) => to remove ?");
    await addMetadataReversibleWithClass(networkLayout);

    const newLinks: Array<Link> = []; //links associated with new reactions nodes

    console.warn("metadata en double pr old et new attr")
    networkLayout.links.forEach( async (link) => {
      // if the link is reversible :  get the reaction node and duplicate

      const linkReversible=linkIsReversible(networkLayout,link);

        if (linkReversible.isReversible) {  
          ////// Duplication of the reaction node

          // get nodes class : we only want to duplicate class "reaction"
          //let newReactionNode: NodeLayout;
          let nodeToDuplicate: NodeLayout;
          const reactionIsSource: boolean= linkReversible.sourceIsReversible;

          if (reactionIsSource) {
            nodeToDuplicate=link.source;
            //newReactionNode = await duplicateNodeReactionReversible(networkLayout,link.source);
            // console.log(link.source.id);
            // console.log(networkLayout.nodes[link.source.id].metadataLayout);
            // // duplicate source node
            // newReactionNode = reversibleNodeReaction(link.source);
            // // add attribut reversible to original reaction
            // network.nodes[link.source.id].classes=pushUniqueString(network.nodes[link.source.id].classes,"reversible");
            // // add metadata of reversibleVersion for original reaction
            // if(!network.nodes[link.source.id].metadata){
            //   network.nodes[link.source.id].metadata={};
            // }
            // network.nodes[link.source.id].metadata.reversibleVersion=newReactionNode.id;
          } else {
            nodeToDuplicate=link.target;
            //newReactionNode = await duplicateNodeReactionReversible(networkLayout,link.target);
            // console.log(link.target.id);
            // console.log(networkLayout.nodes[link.target.id].metadataLayout);

            // // duplicate target node
            // newReactionNode = reversibleNodeReaction(link.target);
            // // add attribut reversible to original reaction
            // network.nodes[link.target.id].classes=pushUniqueString(network.nodes[link.target.id].classes,"reversible");
            // // add metadata of reversibleVersion for original reaction
            // if(!network.nodes[link.target.id].metadata){
            //   network.nodes[link.target.id].metadata={};
            // }
            // network.nodes[link.target.id].metadata.reversibleVersion=newReactionNode.id;
          }
          //console.log(newReactionNode);
          
         await duplicateNodeReactionReversible(networkLayout,link.source).then((newReactionNode) => {
            // adding new reaction node if not already the case
            if (newReactionNode && !networkLayout.nodes[newReactionNode.id]) {
              networkLayout.nodes[newReactionNode.id] = newReactionNode;
            }

          //////// Adding link to new reaction node in reverse (target become source and source become target)
          if (reactionIsSource) {
            const target = link.target;
            newLinks.push(reversibleLink(networkLayout,link,newReactionNode.id,target.id));
          } else {
            const source = link.source;
            newLinks.push(reversibleLink(networkLayout,link,source.id,newReactionNode.id,));      
          }
         });

        }

    });

    newLinks.forEach((link) => {
      networkLayout.links.push(link);
    });

  } catch (error) {
    throw error;
  }
}

/**
 * Determines if a link is reversible in a network by checking if the source or target is a reversible reaction.
 * 
 * @param network - The network object.
 * @param link - The link object.
 * @returns An object containing the reversibility information:
 *   - `isReversible` - A boolean indicating if the link is reversible.
 *   - `sourceIsReversible` - A boolean indicating if it's the source of the link that is reversible.
 */
function linkIsReversible(network:Network,link: Link): {isReversible:boolean,sourceIsReversible:boolean}{ 
    if (isReaction(link.source) && isReversible(network,link.source.id)){
      return {isReversible:true,sourceIsReversible:true};
    } else if (isReaction(link.target) && isReversible(network,link.target.id)){
      return {isReversible:true,sourceIsReversible:false};
    } else{
      return {isReversible:false,sourceIsReversible:undefined};
    }
}

/**
 * Duplicates a node reaction and makes it reversible.
 * 
 * @param networkLayout - The network layout.
 * @param nodeReaction - The node reaction to duplicate.
 * @returns The duplicated node reaction with reversible metadata.
 */
async function duplicateNodeReactionReversible(networkLayout:NetworkLayout,nodeReaction:Node):Promise<Node> {
    // duplicate target node
    const newReactionNode = await reversibleNodeReaction(nodeReaction);
    //console.log('newReactionNode',newReactionNode);
    // add attribut reversible to original reaction
    //networkLayout.nodes[nodeReaction.id].classes=pushUniqueString(network.nodes[link.target.id].classes,"reversible");
    // add metadata of reversibleVersion for original reaction

    if(!networkLayout.nodes[nodeReaction.id].metadata){ // TO remove
      networkLayout.nodes[nodeReaction.id].metadata={};
    }
    if(!networkLayout.nodes[nodeReaction.id].metadataLayout){
      networkLayout.nodes[nodeReaction.id].metadataLayout={};
    }
    networkLayout.nodes[nodeReaction.id].metadata["reversibleVersion"]=newReactionNode.id; // TO remove
    networkLayout.nodes[nodeReaction.id].metadataLayout.reversibleVersion=newReactionNode.id;

    return newReactionNode;
  }


/**
 * Reverses the given node layout by appending a suffix to its ID and updating its metadataLayout.
 * 
 * @param node - The original node layout to be reversed.
 * @param suffix - The suffix to be appended to the ID of the reversed node. Default value is "_rev".
 * @returns The reversed node layout.
 */
async function reversibleNodeReaction(node: NodeLayout, suffix: string = "_rev"): Promise<Node> {
  const  id = node.id;
  const newId = id.endsWith(suffix) ? id.slice(0, -suffix.length) : id + suffix;
  
  //const newLabel = label.endsWith(suffix) ? label.slice(0, -suffix.length) : label + suffix;

  //const newClasses: string[] = [];
  // add classes of original reaction, 
  // and add class reversibleVersion if not present, removed if present
  // classes.forEach(item =>{
  //   newClasses.push(item)
  // });
  // const revIndex = newClasses.indexOf("reversibleVersion");
  // if (revIndex !== -1) {
  //   newClasses.splice(revIndex, 1);
  // }else{
  //   newClasses.push("reversibleVersion");
  // }
  
  const newNode: NodeLayout = {
    ...node,
    id: newId,
    metadata: {...node.metadata, reversibleVersion: id},  // to remove : doest work
    metadataLayout: {reversibleVersion:id},
  };
  return newNode;
}

/**
 * Links two nodes in a network with a reversible link.
 * 
 * @param network - The network object.
 * @param link - The link to be made reversible.
 * @param sourceID - The ID of the source node.
 * @param targetID - The ID of the target node.
 * @returns The new reversible link.
 * @throws Error if either the source node or the target node is not found in the network.
 */
function reversibleLink(network:Network,link:Link,sourceID:string,targetID:string):Link{
  if (!network.nodes[sourceID] || !network.nodes[targetID]){
    throw new Error("Node not found to set as reversible ");
  }
  let newLink:Link={
    ...link,
    id: `${targetID}--${sourceID}`,
    source: network.nodes[targetID],
    target: network.nodes[sourceID],
  }
  newLink= addLinkClassReversible(newLink);
  return newLink;
}





/**
 * Take a network with duplicated nodes (a node is duplicated if the id of the duplicated version is in metadata.reversibleVersion of a node),
 * and remove one of the duplication. A method in argument (nodeOrderFunction) is used for the choice, the source nodes for the method are in parameter of the function. The node that is keeped 
 * is the first in the returned array.
 * BEWARE : the method with not all sources might miss some duplicated nodes
 * @param subgraphNetwork 
 * @param sources sources nodes (id) to use, if type source :
 * RANK_ONLY : sources are nodes of rank 0
 * SOURCE_ONLY : sources are topological sources of the network (nul indegree)
 * RANK_SOURCE : sources are node of rank 0, then source nodes
 * ALL : sources are all nodes
 * SOURCE_ALL : sources are topological sources, then all the others nodes
 * RANK_SOURCE_ALL : sources are node of rank 0, then topological sources, then all the other nodes
 * For this method, a source type with "all" is advised, to not miss any duplicated reaction.
 * @param nodeOrderFunction the method that return an array of nodes order (a same node can be present several time!), with sources as input
 */
export async function chooseReversibleReaction(
  subgraphNetwork:SubgraphNetwork,
  sources: Array<string> | StartNodesType,
  nodeOrderFunction: (network: Network, sources: Array<string> | StartNodesType) => string[] =BFSWithSources
): Promise<SubgraphNetwork> {
  let nodeOrder: string[] = [];
  const network = subgraphNetwork.network.value;
  // get node order
  nodeOrder = nodeOrderFunction(network,sources);

  // keep the first node seen only, for duplicated nodes
  subgraphNetwork=keepFirstReversibleNode(subgraphNetwork, nodeOrder) as SubgraphNetwork;

  return subgraphNetwork;
}


/**
 * Keeps the first reversible node in the given node order, removing all others and their corresponding reversible versions from the network.
 * @param subgraphNetwork 
 * @param nodeOrder The order of nodes to consider for keeping the first reversible node.
 */
export function keepFirstReversibleNode(subgraphNetwork:SubgraphNetwork,nodeOrder:string[],doRename:boolean=true):SubgraphNetwork |{[key: string]: string}{
  const network = subgraphNetwork.network.value;
  const reactionToRemove:Array<string>=[];
  const nodeToRename:{[key: string]: string}={};

  for(let i=0;i<nodeOrder.length;i++){
    const nodeID=nodeOrder[i];
    // if there is a reversible version of the current node:
    if(network.nodes[nodeID].metadata && network.nodes[nodeID].metadata.reversibleVersion){
      
      const reversibleNodeID=network.nodes[nodeID].metadata.reversibleVersion as string;
      // add the reversible reaction to the list of nodes to remove
      reactionToRemove.push(reversibleNodeID);
      // Rename of id if necessary :
      if(network.nodes[nodeID].classes && network.nodes[nodeID].classes.includes("reversibleVersion")){
        // the reversible version is the one keeped, its id have to be renamed by the original id
        nodeToRename[nodeID]=reversibleNodeID;
      }
      // remove metadata information about reversible node for current node and its reversible version
      delete network.nodes[nodeID].metadata.reversibleVersion;
      if(reversibleNodeID in network.nodes && network.nodes[reversibleNodeID].metadata && "reversibleVersion" in network.nodes[reversibleNodeID].metadata){ 
        delete network.nodes[reversibleNodeID].metadata.reversibleVersion;
      }
    }
  }

  // remove one version of the reaction
  removeAllSelectedNodes(reactionToRemove,network);
  // rename the other if it was the reversible version that is keeped
  if(doRename){
    return renameAllIDNode(subgraphNetwork,nodeToRename); // return object renamed
  }
  return nodeToRename; // if doRename is false, return the list of node to rename to do it later
}

export function renameAllIDNode(subgraphNetwork:SubgraphNetwork,nodesToRename:{[key: string]: string}):SubgraphNetwork{
  const network = subgraphNetwork.network.value;

  // Modify nodes
  Object.keys(network.nodes).forEach(ID => { 
    if (nodesToRename[ID]) { 
      // then change the name of the node :
      const oldName=ID;
      const newName=nodesToRename[ID];
      // insert new node with new name
      network.nodes[newName]=network.nodes[oldName];
      network.nodes[newName].id=newName;
      // delete old node
      delete network.nodes[oldName];     
    }
  });

  // Modify edges
  network.links.forEach(link => {
    if (nodesToRename[link.source.id]) {
      link.source = network.nodes[nodesToRename[link.source.id]];
    }
    if (nodesToRename[link.target.id]) {
      link.target = network.nodes[nodesToRename[link.target.id]];
    }
  });

  // Modify subgraphs
  // in cycles
  renameAllInSubgraph(subgraphNetwork,TypeSubgraph.CYCLE,nodesToRename);
  // in main chains
  renameAllInSubgraph(subgraphNetwork,TypeSubgraph.MAIN_CHAIN,nodesToRename);
  // in secondary chains
  renameAllInSubgraph(subgraphNetwork,TypeSubgraph.SECONDARY_CHAIN,nodesToRename);

  return subgraphNetwork;
}



function renameAllInSubgraph(subgraphNetwork:SubgraphNetwork, typeSubgraph:TypeSubgraph, nodesToRename:{[key: string]: string}){
  const subgraphs = subgraphNetwork[typeSubgraph] ? subgraphNetwork[typeSubgraph] : {};
  Object.entries(subgraphs).forEach(([ID, subgraph]) => {
    subgraph.nodes = subgraph.nodes.map(node => {
      if(nodesToRename[node]){
        // change metadata of node to know in which subgraph it is
        updateNodeMetadataSubgraph(subgraphNetwork.network.value, nodesToRename[node], ID, typeSubgraph);
        // change the name of the node in the subgraph
        return nodesToRename[node];
      }
      return node;
    });
  });
}




// export function renameIDNode(subgraphNetwork:SubgraphNetwork,oldName:string,newName:string):SubgraphNetwork{
//   const network = subgraphNetwork.network.value;
//   if(oldName in network.nodes && !(newName in network.nodes)){

//     // modify node :
//     // insert new node with new name
//     network.nodes[newName]=network.nodes[oldName];
//     const newNode=network.nodes[newName];
//     newNode.id=newName;
//     // delete old node
//     delete network.nodes[oldName];

//     // modify edges :
//     // when the node is source
//     const linksOldNodeAsSource = Object.values(network.links).filter((link) => {
//       return link.source.id === oldName;
//     });
//     linksOldNodeAsSource.forEach((link) => {
//       link.source = newNode;
//     });
//     // when the node is target
//     const linksOldNodeAsTarget = Object.values(network.links).filter((link) => {
//       return link.target.id === oldName;
//     });
//     linksOldNodeAsTarget.forEach((link) => {
//       link.target = newNode;
//     });

//     // modify subgraphs :
//     // in cycles
//     renameInSubgraph(subgraphNetwork,TypeSubgraph.CYCLE,oldName,newName);
//     // in main chains
//     renameInSubgraph(subgraphNetwork,TypeSubgraph.MAIN_CHAIN,oldName,newName);
//     // in secondary chains
//     renameInSubgraph(subgraphNetwork,TypeSubgraph.SECONDARY_CHAIN,oldName,newName);

//     return subgraphNetwork;

//   }else{
//     console.log("Error : impossible to rename node "+oldName+" to "+newName+", node already exist or not found in network.");
//   }
// }

// function renameInSubgraph(subgraphNetwork:SubgraphNetwork,typeSubgraph:TypeSubgraph,oldName:string,newName:string){
//   const subgraphs = subgraphNetwork[typeSubgraph]? subgraphNetwork[typeSubgraph]:{};
//     Object.entries(subgraphs).forEach(([ID,subgraph])=>{
//       if(subgraph.nodes.includes(oldName)){
//         // change the name of the node in the subgraph
//         subgraph.nodes = subgraph.nodes.map(node => node === oldName ? newName : node);
//         // change metadata of node to know in which subgraph it is
//         updateNodeMetadataSubgraph(subgraphNetwork.network.value, newName, ID,typeSubgraph); //newName because the node has been renamed
//       }
//     });
// }

