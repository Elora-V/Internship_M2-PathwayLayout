import { Network } from "@metabohub/viz-core/src/types/Network";
import dagre from 'dagrejs';

export function method_to_try(network: Network) {
    // network["nodes"]["M_HC00080_c"]["x"]=0;
    
    // for (const link in network["links"]) {
        
    //     if( network["links"][link]["target"]["id"]=="M_HC00080_c"){
    //         //network["links"][link]["target"]["x"]==0;
    //         network["links"][link]["target"]=network["nodes"]["M_HC00080_c"]
    //         console.log(link);
    //     }
    //     else if( network["links"][link]["source"]["id"]=="M_HC00080_c"){
    //         //network["links"][link]["source"]["x"]==0;
    //         network["links"][link]["source"]=network["nodes"]["M_HC00080_c"]
    //         console.log(link);
    //     }
        
        
    // } 
    // console.log(network);
    console.log('test methodtotry');
    //var dagre = require("dagre");
    // Create a new directed graph 
    var g = new dagre.graphlib.Graph();

    // Set an object for the graph label
    g.setGraph({});

    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(function() { return {}; });

    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    g.setNode("kspacey",    { label: "Kevin Spacey",  width: 144, height: 100 });
    g.setNode("swilliams",  { label: "Saul Williams", width: 160, height: 100 });
    g.setNode("bpitt",      { label: "Brad Pitt",     width: 108, height: 100 });
    g.setNode("hford",      { label: "Harrison Ford", width: 168, height: 100 });
    g.setNode("lwilson",    { label: "Luke Wilson",   width: 144, height: 100 });
    g.setNode("kbacon",     { label: "Kevin Bacon",   width: 121, height: 100 });

    // Add edges to the graph.
    g.setEdge("kspacey",   "swilliams");
    g.setEdge("swilliams", "kbacon");
    g.setEdge("bpitt",     "kbacon");
    g.setEdge("hford",     "lwilson");
    g.setEdge("lwilson",   "kbacon");
    dagre.layout(g);
    console.log(g);
} 