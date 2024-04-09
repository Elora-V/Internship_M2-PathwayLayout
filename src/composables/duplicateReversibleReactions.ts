import { Link } from '@metabohub/viz-core/src/types/Link';
import { Node } from '@metabohub/viz-core/src/types/Node';
import { Network } from '@metabohub/viz-core/src/types/Network';


/** 
 * Take a network and add a duplicated node of reversible reactions, and add links to this reaction 
 * @param {Network}  Network object 
 */
export function duplicateReversibleReactions(network: Network){

    const newLinks:Array<Link>=[]; //links associated with new reactions nodes

    for (const link in network.links){
        // if the link is reversible :  get the reaction node and duplicate
        if (network.links[link].classes.includes("reversible")){

            ////// Duplication of the reaction node

            // get nodes class : we only want to duplicate class "reaction"
            const sourceClasses=network.links[link].source.classes;
            const targetClasses=network.links[link].target.classes;

            let newReactionNode:Node;
            let reactionIsSource:boolean;

            if (sourceClasses.includes("reaction")){
                reactionIsSource=true;
                // duplicate source node
                newReactionNode= reversibleNodeReaction(network.links[link],"source");
            } else if (targetClasses.includes("reaction")){
                reactionIsSource=false;
                // duplicate target node
                newReactionNode= reversibleNodeReaction(network.links[link],"target");
            }
            // adding new reaction node if not already the case
            if ( !(Object.keys(network.nodes).includes(newReactionNode.id))) {
                network.nodes[newReactionNode.id]=newReactionNode;
            }

            //////// Adding link to new reaction node in reverse (target become source and source become target)

            if (reactionIsSource){
                const target =network.links[link].target;
                newLinks.push({
                    "id":target.id+"--"+newReactionNode.id ,
                    "source": network.nodes[target.id], 
                    "target":newReactionNode,
                    "classes":["reversible"]
                });
            } else {
                const source =network.links[link].source;
                newLinks.push( {"id":newReactionNode.id+"--"+source.id ,"source":newReactionNode, "target":network.nodes[source.id],"classes":["reversible"],directed: true}  );

            }

        } 
        
    }

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
function reversibleNodeReaction(link:Link, sourceOrTarget: "source" | "target"):Node{
    const newNodeID= link[sourceOrTarget].id + "_rev";
    const nodeLabel= link[sourceOrTarget].label + "_rev"; // change label to help in coding, but to remove after
    return {
        id: newNodeID,
        x: 0,
        y: 0,
        label : nodeLabel
    };
}
