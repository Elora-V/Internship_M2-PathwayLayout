import { Network } from '@metabohub/viz-core/src/types/Network';
import type { Node } from "@metabohub/viz-core/src/types/Node";
import  dagre  from 'dagrejs';


/**
 * Take a dagre.graphlib.Graph object and return a Network object containing the same nodes and edge
 * @param {dagre.graphlib.Graph}  dagre.graphlib.Graph object 
 * @returns {Network} Return Network object 
 */
export function convertToNetwork(graph: dagre.graphlib.Graph): Network{

    // initialisation network
    const network: Network = {
		id: "netFromGraph",
		nodes: {},
		links: []
	};

    // insert nodes into network
    for (const node in graph["_nodes"]){

        const labelNode=graph["_nodes"][node]["label"];
        // get position if one
        let xNode:number;
        if (Object.keys(graph["_nodes"][node]).includes('x')){
            xNode= graph["_nodes"][node]["x"];
        }else{
            xNode= NaN;
        }
        let yNode:number;
        if (Object.keys(graph["_nodes"][node]).includes('y')){
            yNode= graph["_nodes"][node]["y"];
        }else{
            yNode= NaN;
        }
        network.nodes[node] = {
			id: node,
			x: xNode,
			y: yNode,
            label : labelNode
		};
       
    }

    // insert edges into network
    for (const link in graph["\_edgeObjs"]){
        const fromNode=graph["\_edgeObjs"][link]["v"];
        const toNode=graph["\_edgeObjs"][link]["w"];
        network.links.push({
            id: fromNode+" -- "+toNode,
            source: getNodeFromNetwork(fromNode,network),
            target: getNodeFromNetwork(toNode,network),
            directed: true
          }
          );
    }

    return network;

}

/**
 * Take dagre.graphlib.Graph object and the network associated (with the graph) : change the position of network node by the one of the graph.
 * The graph and network need to have the same nodes !
 * @param {dagre.graphlib.Graph}  dagre.graphlib.Graph object 
 * @param {Network} Network object (value of pointer)
 */
export function graphToNetwork(graph: dagre.graphlib.Graph,network: Network){

    for (const node in graph["_nodes"]){

        // get x (if one)
        if (Object.keys(graph["_nodes"][node]).includes('x')){
            network.nodes[node]["x"]= graph["_nodes"][node]["x"];
        }
        // get x (if one)
        if (Object.keys(graph["_nodes"][node]).includes('y')){
            network.nodes[node]["y"]= graph["_nodes"][node]["y"];
        }
    }
}




/**
 * Take an id string and return the corresponding node from the network
 * @param {Network} Network object
 * @param id identifier of the node 
 * @returns {Node} Return Node object 
 */
function getNodeFromNetwork(id: string, network:Network): Node{

    return network["nodes"][id]; 

}