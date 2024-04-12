import { Link } from "@metabohub/viz-core/src/types/Link";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { Network } from "@metabohub/viz-core/src/types/Network";

/**
 * Take a network and add a duplicated node of reversible reactions, and add links to this reaction
 * @param {Network}  Network object
 */
export function duplicateReversibleReactions(network: Network) {

  console.log('Duplicate');

  const newLinks: Array<Link> = []; //links associated with new reactions nodes

  network.links.forEach((link) => {
    // if the link is reversible :  get the reaction node and duplicate
    if (link.classes && typeof link.classes==='object' && link.classes.includes("reversible")) {
      ////// Duplication of the reaction node

      // get nodes class : we only want to duplicate class "reaction"
      let newReactionNode: Node;
      let reactionIsSource: boolean;

      if (link.source.classes?.includes("reaction")) {
        reactionIsSource = true;
        // duplicate source node
        newReactionNode = reversibleNodeReaction(link, "source");
      } else if (link.target.classes?.includes("reaction")) {
        reactionIsSource = false;
        // duplicate target node
        newReactionNode = reversibleNodeReaction(link, "target");
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
}

/**
 * Take a link and return a new link with same id and label but with a "_rev" at the end : the node of the reversible reaction
 * @param {Link}
 * @param sourceOrTarget indicate if the reaction on the link is the source or target
 * @returns {Node}
 */
function reversibleNodeReaction(link: Link, sourceOrTarget: "source" | "target"): Node {
  const { id, label, x, y } = link[sourceOrTarget];
  const node: Node = {
      id: id + "_rev",
      label: label + "_rev", // Change label to help in coding, but to remove after
      x: x,
      y: y,
      classes: ["reaction", "reversible", "reversibleVersion"],
      metadata: {},
  };

  return node;
}