import { Link } from "@metabohub/viz-core/src/types/Link";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { removeAllSelectedNode } from "@metabohub/viz-core";
import { DFSWithSources } from "./algoDFS";
import { SourceType } from "@/types/EnumArgs";
import { BFSWithSources } from "./algoBFS";

/**
 * Take a network and add a duplicated node of reversible reactions, and add links to this reaction
 * @param {Network}  Network object
 * @param suffix to put at the end of id of the original reaction : can't be "" !
 */
export async function duplicateReversibleReactions(network: Network,suffix:string="_rev"):Promise<void> {

  console.log('Duplicate');

  const newLinks: Array<Link> = []; //links associated with new reactions nodes

  network.links.forEach((link) => {
    // if the link is reversible :  get the reaction node and duplicate
    if (link.classes && link.classes.includes("reversible")) {
      ////// Duplication of the reaction node
      // get nodes class : we only want to duplicate class "reaction"
      let newReactionNode: Node;
      let reactionIsSource: boolean;

      if (link.source.classes?.includes("reaction")) {
        reactionIsSource = true;
        // duplicate source node
        newReactionNode = reversibleNodeReaction(link.source);
        // add attribut reversible to original reaction
        network.nodes[link.source.id].classes=pushUniqueString(network.nodes[link.source.id].classes,"reversible");
        // add metadata of reversibleVersion for original reaction
        if(!network.nodes[link.source.id].metadata){
          network.nodes[link.source.id].metadata={};
        }
        network.nodes[link.source.id].metadata.reversibleVersion=newReactionNode.id;
      } else if (link.target.classes?.includes("reaction")) {
        reactionIsSource = false;
        // duplicate target node
        newReactionNode = reversibleNodeReaction(link.target);
        // add attribut reversible to original reaction
        network.nodes[link.target.id].classes=pushUniqueString(network.nodes[link.target.id].classes,"reversible");
        // add metadata of reversibleVersion for original reaction
        if(!network.nodes[link.target.id].metadata){
          network.nodes[link.target.id].metadata={};
        }
        network.nodes[link.target.id].metadata.reversibleVersion=newReactionNode.id;
      }
      // adding new reaction node if not already the case
      if (!network.nodes[newReactionNode.id]) {
        network.nodes[newReactionNode.id] = newReactionNode;
      }

      //////// Adding link to new reaction node in reverse (target become source and source become target)

      if (reactionIsSource) {
        const target = link.target;
        newLinks.push({
            id: `${target.id}--${newReactionNode.id}`,
            source: network.nodes[target.id],
            target: network.nodes[newReactionNode.id],
            classes: ["reversible"],
        });
    } else {
        const source = link.source;
        newLinks.push({
            id: `${newReactionNode.id}--${source.id}`,
            source: network.nodes[newReactionNode.id],
            target: network.nodes[source.id],
            classes: ["reversible"],
        });
    }
      
    }
  });

  newLinks.forEach((link) => {
    network.links.push(link);
  });

  console.log(network);

}

/**
 * Take a node and return a new node with same id and label but with a "_rev" at the end : the node of the reversible reaction
 * @param {Link}
 * @param suffix to put at the end of id of the original reaction : can't be "" !
 * @returns {Node}
 */
function reversibleNodeReaction(node: Node, suffix: string = "_rev"): Node {
  const { id, label, x, y, classes } = node;

  const newId = id.endsWith(suffix) ? id.slice(0, -suffix.length) : id + suffix;
  const newLabel = label.endsWith(suffix) ? label.slice(0, -suffix.length) : label + suffix;

  const newClasses: string[] = [];
  // add classes of original reaction, 
  // and add class reversibleVersion if not present, removed if present
  classes.forEach(item =>{
    newClasses.push(item)
  });
  const revIndex = newClasses.indexOf("reversibleVersion");
  if (revIndex !== -1) {
    newClasses.splice(revIndex, 1);
  }else{
    newClasses.push("reversibleVersion");
  }
  
  const newNode: Node = {
    id: newId,
    label: newLabel,
    x: x,
    y: y,
    classes: newClasses,
    metadata: {reversibleVersion:id},
  };

  return newNode;
}



export function pushUniqueString(object:Array<string>, value: string): Array<string> {
  if (!object.includes(value)) {
      object.push(value);
  }
  return object;
}



/**
 * Take a network with duplicated nodes (a node is duplicated if the id of the duplicated version is in metadata.reversibleVersion of a node),
 * and remove one of the duplication. A method in argument (nodeOrderFunction) is used for the choice, the source nodes for the method are in parameter of the function. The node that is keeped 
 * is the first in the returned array.
 * BEWARE : the method with not all sources might miss some duplicated nodes
 * @param network the network with the duplicated nodes
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
  network: Network,
  sources: Array<string> | SourceType,
  nodeOrderFunction: (network: Network, sources: Array<string> | SourceType) => string[] =BFSWithSources
): Promise<void> {
  let nodeOrder: string[] = [];

  // get node order
  nodeOrder = nodeOrderFunction(network,sources);

  // keep the first node seen only, for duplicated nodes
  keepFirstReversibleNode(network, nodeOrder);
}


/**
 * Keeps the first reversible node in the given node order, removing all others and their corresponding reversible versions from the network.
 * @param network The network containing nodes and reactions.
 * @param nodeOrder The order of nodes to consider for keeping the first reversible node.
 */
function keepFirstReversibleNode(network,nodeOrder:string[]){
  const reactionToRemove:Array<string>=[];

  for(let i=0;i<nodeOrder.length;i++){
    const nodeID=nodeOrder[i];
    // if there is a reversible version of the current node:
    if(network.nodes[nodeID].metadata && network.nodes[nodeID].metadata.reversibleVersion){
      const reversibleNodeID=network.nodes[nodeID].metadata.reversibleVersion;
      // add the reversible reaction to the list of nodes to remove
      reactionToRemove.push(String(reversibleNodeID));
      // remove metadata information about reversible node for current node and its reversible version
      delete network.nodes[nodeID].metadata.reversibleVersion;
      delete network.nodes[String(reversibleNodeID)].metadata.reversibleVersion;
    }
  }

  removeAllSelectedNode(reactionToRemove,network);
}
