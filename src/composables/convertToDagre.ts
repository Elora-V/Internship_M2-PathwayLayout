import dagre from 'dagrejs';



/**
 * Take an network object and return a dagre.graphlib.Graph object containing the same nodes and edge
 * @param {Network}  Network object 
 * @returns {dagre.graphlib.Graph} Return dagre.graphlib.Graph object 
 */
export function convertToDagre(network: Network): dagre.graphlib.Graph{

    // initialisation dagre graph
    var g = new dagre.graphlib.Graph();
    g.setGraph({});
    g.setDefaultEdgeLabel(function() { return {}; });

    // insert nodes into graph
    for (const node in network["nodes"]){
        let keyNode=node;
        let labelNode=network["nodes"][node]["label"];
        //let width= labelNode.length;
        g.setNode(keyNode,    { label: labelNode,  width: 100, height: 100 });
    }

    // insert edges into graph
    for (const link in network["links"]){
        let fromNode=network["links"][link]["source"]["id"];
        let toNode=network["links"][link]["target"]["id"];
        g.setEdge(fromNode,   toNode);
    }

    return g;

}