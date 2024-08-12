import { JsonViz } from '@/types/JsonViz';
import { Coordinate } from '@/types/CoordinatesSize';
import { Network } from '@metabohub/viz-core/src/types/Network';
import type { Node } from "@metabohub/viz-core/src/types/Node";
import  dagre  from 'dagrejs/dist/dagre.js';
import { type } from 'os';
import { assignRankOrder } from './rankAndSources';
import { SubgraphNetwork } from '@/types/SubgraphNetwork';
import { TypeSubgraph } from '@/types/Subgraph';
import { getSizeNodePixel } from './calculateSize';
import { GraphStyleProperties } from '@metabohub/viz-core/src/types/GraphStyleProperties';


import cytoscape, { ElementDefinition } from 'cytoscape';


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
 * @param assignRank boolean that indicates if rank and order need to be infered and assigned to nodes
 */
export async function changeNetworkFromViz(json: JsonViz, subgraphNetwork: SubgraphNetwork, assignRank:boolean=false): Promise<SubgraphNetwork> {
    const network=subgraphNetwork.network.value;
    const unique_y:Array<number> =[];
    json["objects"].forEach((node) => {
       
        const nodeId = node.name;

        // if node is a 'classic' node
        if (nodeId in network.nodes && 'pos' in node){
                const pos = node.pos.split(',');
                let x = parseFloat(pos[0]);
                let y = parseFloat(pos[1]);
                
                network.nodes[nodeId].x = x;
                network.nodes[nodeId].y = y;

                if( !unique_y.includes(y)){
                    unique_y.push(y);
                }

        }else if (subgraphNetwork.cyclesGroup && nodeId in subgraphNetwork.cyclesGroup && 'pos' in node){

            //if node is a cycle metanode
            const pos = node.pos.split(',');
            const x = parseFloat(pos[0]);
            const y = parseFloat(pos[1]);
            if (!subgraphNetwork.cyclesGroup[nodeId].metadata){
                subgraphNetwork.cyclesGroup[nodeId].metadata={};
            }
            subgraphNetwork.cyclesGroup[nodeId].position={x:x,y:y};
            
        }
    });

        // for test to see as a single node:
        // if (subgraphNetwork.cyclesGroup){
        //     Object.keys(subgraphNetwork.cyclesGroup).forEach(cycle=>{
        //         const nodeInsideMetanode = Object.entries(subgraphNetwork.cyclesGroup[cycle].metadata)
        //                                     .filter(([key, item]) => item["x"] !== undefined && item["y"] !== undefined)
        //         nodeInsideMetanode.forEach( ([key, item])=>{
        //             //console.log(network.nodes[cycleNode]);
        //            network.nodes[key].x=subgraphNetwork.cyclesGroup[cycle].position.x;
        //            network.nodes[key].y=subgraphNetwork.cyclesGroup[cycle].position.y;
        //        });
        //     })
            
        // }
                

    if(assignRank){
        assignRankOrder(network,unique_y); // the information of rank isn't in the result, unlike dagre 
    }

    return subgraphNetwork;
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

export function changeNetworkFromCytoscape(jsonCytoscape: {elements:  { nodes:ElementDefinition[] } }, network:Network) : void {

    jsonCytoscape.elements.nodes.forEach((node: any) => {
        const idNode= node.data.id;
        if (Object.keys(network.nodes).includes(idNode)) {
            network.nodes[idNode].x = node.position.x;
            network.nodes[idNode].y = node.position.y;
        }
    });
}



