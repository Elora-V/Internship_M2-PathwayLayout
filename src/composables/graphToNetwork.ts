import { Network } from '@metabohub/viz-core/src/types/Network';
import type { Node } from "@metabohub/viz-core/src/types/Node";
import  dagre  from 'dagrejs/dist/dagre.js';
import { type } from 'os';




/**
 * Take dagre.graphlib.Graph object and the network associated (with the graph) : change the position and metadata (rank and order) of network's node by the one of the graph.
 * The graph and network need to have the same nodes !
 * @param {dagre.graphlib.Graph}  dagre.graphlib.Graph object 
 * @param {Network} Network object (value of pointer)
 */
export async function changeNetworkFromDagre(graph: dagre.graphlib.Graph,network: Network): Promise<void>{

    for (const node in graph["_nodes"]){
        // add metadata key
        if ( !Object.keys(network.nodes[node]).includes("metadata")){
            network.nodes[node]["metadata"]= {};
        }
        // get x (if one)
        if (Object.keys(graph["_nodes"][node]).includes('x')){
            const x=graph["_nodes"][node]["x"];
            network.nodes[node]["x"]= x;
        }
            
        // get y (if one)
        if (Object.keys(graph["_nodes"][node]).includes('y')){
            const y=graph["_nodes"][node]["y"];
            network.nodes[node]["y"]= y;
        }

        // get order (if one)
        if (Object.keys(graph["_nodes"][node]).includes('_order')){
            network.nodes[node]["metadata"]["order"]= graph["_nodes"][node]["_order"];
        }

        // get rank (if one)
        if (Object.keys(graph["_nodes"][node]).includes('_rank')){
            network.nodes[node]["metadata"]["rank"]= graph["_nodes"][node]["_rank"]/2; //dagre has rank that goes 2 by 2 (rank 0,2,4...)
        }
    }
}


/**
 * Take a json of a viz graph and the network associated (with the json) : change the position and metadata (rank and order) of network's node by the one of the json.
 * The json and network need to have the same nodes !
 * @param {object}  object return by render method from viz (renderJSON)
 * @param {Network} Network object (value of pointer)
 */
export async function changeNetworkFromViz(json: object, network: Network): Promise<void> {
    
    const unique_y:Array<number> =[];

    for (const node in json["objects"]) {
        const nodeId = json["objects"][node]["name"];
        // get position (if one)
        if (Object.keys(json["objects"][node]).includes('pos')) {
            const pos = json["objects"][node]["pos"].split(',');
            const x = parseFloat(pos[0]);
            const y = parseFloat(pos[1]);
            network.nodes[nodeId]["x"] = x;
            network.nodes[nodeId]["y"] = y;
            if( !unique_y.includes(y)){
                unique_y.push(y);
            }
        }
    }
    
    assignRankOrder(network,unique_y); // the information of rank isn't in the result, unlike dagre 

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

/**
 * Take an id string and return the corresponding node from the network
 * @param {Network} Network object
 * @param id identifier of the node 
 * @returns {Node} Return Node object 
 */
function getNodeFromNetwork(id: string, network:Network): Node{

    return network["nodes"][id]; 

}




/**
 * Take network and all the unique y coordinate. Add the rank (y position : first, second...; not coordinate) and order ( x position in the rank: first, second,....) to metadata of network.
 * @param {Network} Network object
 * @param unique_y array of all unique y for node position
 */
function assignRankOrder(network: Network, unique_y: Array<number>) {

    // sort the y to know the associated rank for a y coordinate
    unique_y.sort((a:number, b:number) => a - b);

    // get the rank for each node
    const xNodeByRank: number[][] = Array.from({ length: unique_y.length }, () => []);
    for (const node in network["nodes"]){
        const rank = unique_y.indexOf(network.nodes[node].y);
        if (!Object.keys(network.nodes).includes("metadata")){
            network.nodes[node]["metadata"]={};
        }
        network.nodes[node].metadata["rank"]=rank;
        xNodeByRank[rank].push(network.nodes[node].x);
    }

    // sort the y by rank
    xNodeByRank.forEach(sublist => {
        sublist.sort((a, b) => a - b); 
    });

    // get the order for each node 
    for (const node in network["nodes"]){
        const rank= network.nodes[node].metadata["rank"];
        if (typeof rank === 'number'){
            const order = xNodeByRank[rank].indexOf(network.nodes[node].x);
            network.nodes[node].metadata["order"]=order;
        } else {
            console.error("Rank isn't a number");
            network.nodes[node].metadata["order"]=0; // order by default
        }
    }
}
