import { Network } from '@metabohub/viz-core/src/types/Network';
import type { Node } from "@metabohub/viz-core/src/types/Node";
import  dagre  from 'dagrejs/dist/dagre.js';




/**
 * Take dagre.graphlib.Graph object and the network associated (with the graph) : change the position of network node by the one of the graph.
 * The graph and network need to have the same nodes !
 * @param {dagre.graphlib.Graph}  dagre.graphlib.Graph object 
 * @param {Network} Network object (value of pointer)
 */
export function changeNetworkFromDagre(graph: dagre.graphlib.Graph,network: Network){

    for (const node in graph["_nodes"]){

        // get x (if one)
        if (Object.keys(graph["_nodes"][node]).includes('x')){
            network.nodes[node].x= graph["_nodes"][node]["x"];
        }
        // get x (if one)
        if (Object.keys(graph["_nodes"][node]).includes('y')){
            network.nodes[node].y= graph["_nodes"][node]["y"];
        }
    }
}


/**
 * Take a json of a viz graph and the network associated (with the json) : change the position of network node by the one of the json.
 * The json and network need to have the same nodes !
 * @param {object}  object return by render method from viz (renderJSON)
 * @param {Network} Network object (value of pointer)
 */
export function changeNetworkFromViz(json: object,network: Network){

    for (const node in json["objects"]){
        const nodeId=json["objects"][node]["name"];
        // get position (if one)
        if (Object.keys(json["objects"][node]).includes('pos')){
            const pos= json["objects"][node]["pos"].split(',');
            network.nodes[nodeId].x= parseFloat(pos[0]);
            network.nodes[nodeId].y= parseFloat(pos[1]);
        }

    }
}



/**
 * Take a dagre.graphlib.Graph object and return a Network object containing the same nodes and edge
 * @param {dagre.graphlib.Graph}  dagre.graphlib.Graph object 
 * @returns {Network} Return Network object 
 */
export function dagreToNetwork(graph: dagre.graphlib.Graph): Network{

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
            source: network.nodes[fromNode],
            target: network.nodes[toNode],
            directed: true
          }
          );
    }

    return network;

}
