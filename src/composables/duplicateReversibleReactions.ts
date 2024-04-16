import { Link } from "@metabohub/viz-core/src/types/Link";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { removeAllSelectedNode } from "@metabohub/viz-core";

/**
 * Take a network and add a duplicated node of reversible reactions, and add links to this reaction
 * @param {Network}  Network object
 */
export function duplicateReversibleReactions(network: Network,suffix:string="_rev") {

  console.log('Duplicate');

  const newLinks: Array<Link> = []; //links associated with new reactions nodes
  const nodeToSupress: Array<string> = [];

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
        newReactionNode = reversibleNodeReaction(link.source,suffix);
      } else if (link.target.classes?.includes("reaction")) {
        reactionIsSource = false;
        // duplicate target node
        newReactionNode = reversibleNodeReaction(link.target,suffix);
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
      
    } else {
      // if link not reversible : 
      // but a the reaction associated had been reverted : this reaction isn't reversible for all links so it will be suppressed
      if (link.source.classes?.includes("reaction") && !nodeToSupress.includes(link.source.id+suffix)){
        nodeToSupress.push(link.source.id+suffix)
      }
      if (link.target.classes?.includes("reaction") && !nodeToSupress.includes(link.target.id+suffix)){
        nodeToSupress.push(link.target.id+suffix)
      }
    }
  });

  newLinks.forEach((link) => {
    network.links.push(link);
  });

  removeAllSelectedNode(nodeToSupress,network);

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


