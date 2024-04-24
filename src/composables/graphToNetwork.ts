import { JsonViz } from '@/types/JsonViz';
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
    Object.entries(graph["_nodes"]).forEach(([node, nodeData]:[string, dagre.graphlib.Node]) => {
        if (!network.nodes[node].metadata) {
            network.nodes[node].metadata = {};
        }
        const { x, y, _order,_rank  } = nodeData;
        // if there is some position x and y : network is updated
        if (x !== undefined && y !== undefined){
            if (network.nodes[node]) {
                network.nodes[node].x = x;
                network.nodes[node].y = y;
            } else {
                console.warn(`Node '${node}' not found in the network.`);
            }
            network.nodes[node].metadata.order = _order;
            network.nodes[node].metadata.rank = _rank / 2;
        }
    });
}


/**
 * Take a json of a viz graph and the network associated (with the json) : change the position and metadata (rank and order) of network's node by the one of the json.
 * The json and network need to have the same nodes !
 * @param {object}  object return by render method from viz (renderJSON)
 * @param {Network} Network object (value of pointer)
 */
export async function changeNetworkFromViz(json: JsonViz, network: Network): Promise<void> {

    const unique_y:Array<number> =[];
    json["objects"].forEach((node) => {
        const nodeId = node.name;
        if ('pos' in node) {
            const pos = node.pos.split(',');
            const x = parseFloat(pos[0]);
            const y = parseFloat(pos[1]);
            network.nodes[nodeId].x = x;
            network.nodes[nodeId].y = y;
            if( !unique_y.includes(y)){
                unique_y.push(y);
            }
        }
    });
    
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
    graph.nodes().forEach((node) => {
        const { label, x, y } = graph.node(node);
        network.nodes[node] = {
            id: node,
            label: label,
            x: x || NaN,
            y: y || NaN
        };
    });
       
    // insert edges into network
    graph.edges().forEach((edge) => {
        const fromNode = edge.v;
        const toNode = edge.w;
        network.links.push({
            id: `${fromNode} -- ${toNode}`,
            source: network.nodes[fromNode],
            target: network.nodes[toNode],
            directed: true
        });
    });

    return network;

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
    Object.values(network.nodes).forEach((node) => {
        const rank = unique_y.indexOf(node.y);
        node.metadata = node.metadata || {}; 
        node.metadata.rank = rank;
        xNodeByRank[rank].push(node.x);
    });

    // sort the y by rank
    xNodeByRank.forEach(sublist => {
        sublist.sort((a, b) => a - b); 
    });

    // get the order for each node 
    Object.values(network.nodes).forEach((node) => {
        const rank = node.metadata.rank;
        if (typeof rank === 'number') {
            const order = xNodeByRank[rank].indexOf(node.x);
            node.metadata.order = order;
        } else {
            console.error("Le rang n'est pas un nombre");
            node.metadata.order = -1;
        }
    });
}
