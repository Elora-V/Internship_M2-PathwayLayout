import { Link } from "@metabohub/viz-core/src/types/Link";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { removeAllSelectedNode } from "@metabohub/viz-core";

/**
 * Take a network and add a duplicated node of reversible reactions, and add links to this reaction
 * @param {Network}  Network object
 * @param suffix to put at the end of id of the original reaction : can't be "" !
 */
export function duplicateReversibleReactions(network: Network,suffix:string="_rev") {

  if (suffix ==""){
    console.error("Suffix to new reaction node can't be the same that original node (unique identifier).")
  }

  console.log('Duplicate');

  // Duplication of reaction node involve with at least one reversible link
  network.links.forEach((link)=> {
      // if the link is reversible :  get the reaction node and duplicate
      if (link.classes && link.classes.includes("reversible")) {
        ////// Duplication of the reaction node
        // get nodes class : we only want to duplicate class "reaction"
        let newReactionNode: Node;
        if (link.source.classes?.includes("reaction")) {
          // duplicate source node
          newReactionNode = reversibleNodeReaction(link.source,suffix);
        } else if (link.target.classes?.includes("reaction")) {
          // duplicate target node
          newReactionNode = reversibleNodeReaction(link.target,suffix);
        }
        // adding new reaction node if not already the case
        if (!network.nodes[newReactionNode.id]) {
          network.nodes[newReactionNode.id] = newReactionNode;
        }
    }
  });

  // Adding link to duplicated node
  const newLinks: Array<Link> = []; //links associated with new reactions nodes
  network.links.forEach((link) => {
    const newNodeSourceID=link.source.id+suffix;
    const newNodeTargetID=link.target.id+suffix;
    // if source node had been duplicated :
    if (Object.keys(network.nodes).includes(newNodeSourceID)){
      // if link reversible :
      if (link.classes && link.classes.includes("reversible")) {
        // link from target to reaction reversed (link is reversed)
        const target = link.target;
        newLinks.push({
            id: `${target.id}--${newNodeSourceID}`,
            source: network.nodes[target.id],
            target: network.nodes[newNodeSourceID],
            classes: ["reversible"],
        });
      } else{
        // link not reversible but associated with a reversible reaction
        newLinks.push({
          id: `${newNodeSourceID}--${link.target.id}`,
          source: network.nodes[newNodeSourceID],
          target: network.nodes[link.target.id],
          classes: ["irreversible"],
        });
      }
    }

      // if target node had been duplicated :
    if (Object.keys(network.nodes).includes(newNodeTargetID)){
      // if link reversible :
      if (link.classes && link.classes.includes("reversible")) {
        // link from reaction reversed to source  (link is reversed)
        const target = link.target;
        newLinks.push({
            id: `${newNodeTargetID}--${link.source.id}`,
            source: network.nodes[newNodeTargetID],
            target: network.nodes[link.source.id],
            classes: ["reversible"],
        });
      } else{
        // link not reversible but associated with a reversible reaction
        newLinks.push({
          id: `${link.source.id}--${newNodeTargetID}`,
          source: network.nodes[link.source.id],
          target: network.nodes[newNodeTargetID],
          classes: ["irreversible"],
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
function reversibleNodeReaction(node: Node, suffix:string="_rev"): Node {
  const { id, label, x, y } = node;
  const newNode: Node = {
      id: id + suffix,
      label: label + suffix, // Change label to help in coding, but to remove after
      x: x,
      y: y,
      classes: ["reaction", "reversible", "reversibleVersion"],
      metadata: {},
  };

  return newNode;
}


