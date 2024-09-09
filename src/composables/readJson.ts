//  import { v4 as uuidv4 } from 'uuid';

//  import { Node } from "@metabohub/viz-core/src/types/Node";
//  import { Link } from "@metabohub/viz-core/src/types/Link";
//  import { Network} from '@metabohub/viz-core/src/types/Network';
//  import type { GraphStyleProperties } from "@metabohub/viz-core/src//types/GraphStyleProperties";
//  import { JsonStyle } from '@/types/JsonStyle';

// export function readJsonGraph(jsonGraph: string): { network: Network, networkStyle: GraphStyleProperties } {
// 	const jsonObject = JSON.parse(jsonGraph);

// 	const network: Network = {
// 		id: "",
// 		nodes: {},
// 		links: []
// 	};

// 	const networkStyle: GraphStyleProperties = {
// 		nodeStyles: {}
// 	}

// 	if (!jsonObject.graph) {
// 		throw new Error("graph attribute lacking in json graph format")
// 	}

// 	if (!jsonObject.graph.nodes) {
// 		throw new Error("nodes attribute lacking in json graph format")
// 	}

// 	if (!jsonObject.graph.edges) {
// 		throw new Error("edges attribute lacking in json graph format")
// 	}

// 	if (jsonObject.graph.id) {
// 		network.id = jsonObject.graph.id;
// 	}
// 	else {
// 		network.id = uuidv4();
// 	}

// 	if (jsonObject.graph.label) {
// 		network.label = jsonObject.graph.label;
// 	}
// 	else {
// 		network.label = network.id;
// 	}


// 		Object.keys(jsonObject.graph.nodes).forEach((id: string) => {
// 			const nodeJSON = jsonObject.graph.nodes[id];
// 			const node: Node = {
// 				id: "",
// 				x: 0,
// 				y: 0
// 			};
	
// 			node.id = id;
	
// 			if (!nodeJSON.label) {
// 				node.label = id;
// 			}
// 			else {
// 				node.label = nodeJSON.id;//nodeJSON.label;
// 			}
	
// 			if (node.id in network.nodes) {
// 				throw new Error("Duplicated node id : " + node.id);
// 			}
	
// 			if (nodeJSON.metadata) {
// 				node.metadata = nodeJSON.metadata;
	
// 				if (nodeJSON.metadata.classes) {
// 					node.classes = nodeJSON.metadata.classes;
// 				} else {
// 					node.classes = ['classic node'];
// 				}
	
// 				if (nodeJSON.metadata.position && nodeJSON.metadata.position.x) {
// 					node.x = nodeJSON.metadata.position.x;
// 				}
	
// 				if (nodeJSON.metadata.position && nodeJSON.metadata.position.y) {
// 					node.y = nodeJSON.metadata.position.y;
// 				}
// 			}
	
// 			network.nodes[node.id] = node;
// 		});

// 	network.links = jsonObject.graph.edges.filter((link: { source: string, target: string, metadata: {[key: string]: string} }) => {
// 		if (link.source && link.target) {
// 			return true;
// 		}
// 	}).map((e: { source: string, target: string, metadata: {[key: string]: string} }) => {

// 		const source: Node = network.nodes[e.source];
// 		const target: Node = network.nodes[e.target];

// 		let classes;

// 		if (e.metadata) {
// 			if (e.metadata.classes) {
// 				classes = e.metadata.classes;
// 			} else {
// 				classes = ['classic edge'];
// 			}
// 		}
		
// 		return {
// 			...e,
// 			source: source,
// 			target: target,
// 			classes: classes,
// 			id: source.id + ' -- ' + target.id
// 		}
// 	});

// 	if (jsonObject.graph.metadata && jsonObject.graph.metadata.style) {
// 		if (jsonObject.graph.metadata.style.nodeStyles && Object.keys(jsonObject.graph.metadata.style.nodeStyles).length !== 0) {
// 			networkStyle.nodeStyles = jsonObject.graph.metadata.style.nodeStyles;
// 		}
// 		if (!(jsonObject.graph.metadata.style.nodeStyles) || Object.keys(jsonObject.graph.metadata.style.nodeStyles).length === 0) {
// 			if (!(jsonObject.graph.metadata.style.nodeStyles)) {
// 				jsonObject.graph.metadata.style['nodeStyles'] = {'classic node': {}};
// 			} else {
// 				jsonObject.graph.metadata.style.nodeStyles['classic node'] = {};
// 			}
// 		}
// 		if (jsonObject.graph.metadata.style.linkStyles && Object.keys(jsonObject.graph.metadata.style.linkStyles).length !== 0) {
// 			networkStyle.linkStyles = jsonObject.graph.metadata.style.linkStyles;
// 		}
// 		if (!(jsonObject.graph.metadata.style.linkStyles) || Object.keys(jsonObject.graph.metadata.style.linkStyles).length === 0) {
// 			if (!(jsonObject.graph.metadata.style.linkStyles)) {
// 				jsonObject.graph.metadata.style['linkStyles'] = {'classic edge': {}};
// 			} else {
// 				jsonObject.graph.metadata.style.linkStyles['classic edge'] = {};
// 			}
// 		}
// 		if (jsonObject.graph.metadata.style.curveLine) {
// 			networkStyle.curveLine = jsonObject.graph.metadata.style.curveLine;
// 		}
// 		if (jsonObject.graph.directed) {
// 			networkStyle.directed = jsonObject.graph.directed;
// 		}
// 	}
// 	console.log(network);

// 	return { network, networkStyle };

// }


// export function readJsonGraph(jsonGraph: string): { network: Network, networkStyle: GraphStyleProperties } {
// 	const preprocessJsonGraph = jsonGraph.replace(/undefined/g, 'null');
// 	const jsonObject = JSON.parse(preprocessJsonGraph);

// 	const network: Network = {
// 		id: "",
// 		nodes: {},
// 		links: []
// 	};

// 	const networkStyle: GraphStyleProperties = {
// 		nodeStyles: {}
// 	}

// 	if (!jsonObject.graph) {
// 		if (!jsonObject.sessions) {
// 			throw new Error("graph attribute lacking in json graph format")
// 		} else {
// 			readJsonMetExploreViz(preprocessJsonGraph, network, networkStyle,reversibleClassNewEdge,changeNodeStyles);

// 			return { network, networkStyle };
// 		}
// 	}

// 	if (!jsonObject.graph.nodes) {
// 		throw new Error("nodes attribute lacking in json graph format")
// 	}

// 	if (!jsonObject.graph.edges) {
// 		throw new Error("edges attribute lacking in json graph format")
// 	}

// 	if (jsonObject.graph.id) {
// 		network.id = jsonObject.graph.id;
// 	}
// 	else {
// 		network.id = uuidv4();
// 	}

// 	if (jsonObject.graph.label) {
// 		network.label = jsonObject.graph.label;
// 	}
// 	else {
// 		network.label = network.id;
// 	}


// 	for (const [id, n] of Object.entries(jsonObject.graph.nodes) as any) {

// 		const node: Node = {
// 			id: "",
// 			x: 0,
// 			y: 0
// 		};

// 		node.id = id;

// 		if (!n.label) {
// 			node.label = id;
// 		}
// 		else {
// 			node.label = n.id;//.label;
// 		}

// 		if (n.metadata && n.metadata.position && n.metadata.position.x) {
// 			node.x = n.metadata.position.x;
// 		}


// 		if (n.metadata && n.metadata.position && n.metadata.position.y) {
// 			node.y = n.metadata.position.y;
// 		}


// 		if (node.id in network.nodes) {
// 			throw new Error("Duplicated node id : " + node.id);
// 		}

// 		if (n.metadata && n.metadata.classes) {
// 			node.classes = n.metadata.classes;
// 		}else{
// 			node.classes=[];
// 		}

// 		if (n.metadata) {
// 			node.metadata = n.metadata;
// 		}else{
// 			node.metadata={};
// 		}

		

// 		network.nodes[node.id] = node;

// 	};

// 	network.links = jsonObject.graph.edges.map((e: { source: string, target: string, metadata: {[key: string]: string} }) => {
// 		const source: Node = network.nodes[e.source];
// 		const target: Node = network.nodes[e.target];
// 		let classes;

// 		if (e.metadata) {
// 			if (e.metadata.classes) {
// 				classes = e.metadata.classes;
// 			}
// 		}

// 		// modification :
// 		if ( e.metadata && e.metadata.classes &&  e.metadata.classes.includes("reversible")){
// 			if (source.classes.includes("reaction")){
// 				source.metadata["reversible"]=true;
// 				target.metadata["reversible"]=false;
// 			}
// 			else if (target.classes.includes("reaction")){
// 				target.metadata["reversible"]=true;
// 				source.metadata["reversible"]=false;
// 			}
// 		}else{
// 			if(!Object.keys(source).includes("metadata")){
// 				source.metadata={};
// 			}
// 			if(!Object.keys(target).includes("metadata")){
// 				target.metadata={};
// 			}
// 			source.metadata["reversible"]=false;
// 			target.metadata["reversible"]=false;
// 		}
		
// 		return {
// 			...e,
// 			source: source,
// 			target: target,
// 			classes: classes 
// 		}

// 	});

// 	if (jsonObject.graph.metadata && jsonObject.graph.metadata.style) {
// 		if (jsonObject.graph.metadata.style.nodeStyles) {
// 			networkStyle.nodeStyles = jsonObject.graph.metadata.style.nodeStyles;
// 		}
// 		if (jsonObject.graph.metadata.style.linkStyles) {
// 			networkStyle.linkStyles = jsonObject.graph.metadata.style.linkStyles;
// 		}
// 	}

// 	return { network, networkStyle };

// }

// /**
//  * Read MetExploreViz JSON graph and return network and styles object
//  * @param jsonGraph MetExploreViz JSON object stringify
//  * @param network Network object
//  * @param networkStyle Network style object
//  * @returns {Network, GraphStyleProperties} Return network object and graphStyleProperties object
//  */
// function readJsonMetExploreViz(jsonGraph: string, network: Network, networkStyle: GraphStyleProperties,
// 	modifyEdge: (link: {[key: string]: string}, network: Network, sourceId: string, targetId: string, edge: Link) => void = (link, network, sourceId, targetId, edge) => {},
// 	changeNodeStyles : (networkStyle:GraphStyleProperties,jsonObject:JsonStyle) => void = (networkStyle, jsonObject) => {}): { network: Network, networkStyle: GraphStyleProperties } {
// 	const jsonObject = JSON.parse(jsonGraph);
// 	const d3Nodes = jsonObject.sessions.viz.d3Data.nodes;

// 	if (jsonObject.sessions.viz.id) {
// 		network.id = jsonObject.sessions.viz.id;
// 	}
// 	else {
// 		network.id = uuidv4();
// 	}
	
// 	d3Nodes.forEach((n: {[key: string]: string | number}) => {
// 		if (n.biologicalType === "metabolite" || n.biologicalType === "reaction") {
// 			const node: Node = {
// 				id: "",
// 				x: 0,
// 				y: 0
// 			};
// 			node.id = n.dbIdentifier as string;
	
// 			if (!n.name) {
// 				node.label = n.dbIdentifier as string;
// 			}
// 			else {
// 				node.label = n.dbIdentifier as string; //.name
// 			}
	
// 			if (n.x) {
// 				node.x = n.x as number;
// 			}
	
	
// 			if (n.y) {
// 				node.y = n.y as number;
// 			}
			
// 			if (n.biologicalType) {
// 				node.classes = [n.biologicalType as string];
// 			}else{
// 				node.classes=[];
// 			}

// 			node.metadata={};
// 			if ("reactionReversibility" in n && n.reactionReversibility){
// 				node.metadata["reversible"]=true;
// 				node.classes.push("reversible");
// 			}else{
// 				node.metadata["reversible"]=false;
// 			}

	
// 			network.nodes[node.id] = node;
// 		}
// 	});

// 	jsonObject.sessions.viz.d3Data.links.forEach((link: {[key: string]: string}) => {
// 		const d3Source = d3Nodes[link.source];
// 		const d3Target = d3Nodes[link.target];

// 		const source = network.nodes[d3Source.dbIdentifier];
// 		const target = network.nodes[d3Target.dbIdentifier];

// 		if (target && source) {

// 			const edge: Link = {
// 				id: link.id,
// 				source: source,
// 				target: target
// 			}

// 			modifyEdge(link,network,source.id,target.id,edge);
// 			network.links.push(edge);
// 		}
// 	});

// 	if (jsonObject.linkStyle) {
// 		networkStyle.linkStyles = jsonObject.linkStyle;
// 	}
// 	if (jsonObject.metaboliteStyle && jsonObject.reactionStyle) {
// 		networkStyle.nodeStyles = {
// 			metabolite: {
// 				width: 20,
// 				height: 20,
// 				fill: jsonObject.metaboliteStyle.backgroundColor ? jsonObject.metaboliteStyle.backgroundColor : '#FFFFFF',
// 				strokeWidth: jsonObject.metaboliteStyle.strokeColor,
// 				shape: 'circle'
// 			},
// 			reaction: {
// 				width: 10,
// 				height: 10,
// 				fill: jsonObject.reactionStyle.backgroundColor ? jsonObject.reactionStyle.backgroundColor : '#FFFFFF',
// 				strokeWidth: jsonObject.reactionStyle.strokeColor,
// 				shape: 'rect'
// 			}
// 		}

// 		//changeNodeStyles(networkStyle);
// 	}

// 	return {network, networkStyle};
// }


// /**
//  * Take some information about a link and add classes to link
//  * @param link the d3 link with the reversible information
//  * @param network the network that need change
//  * @param source the source node from the network
//  * @param target the target node from the network
//  * @param newEdge the edge in construction that will be push in network
//  */
// function reversibleClassNewEdge(link: {[key: string]: string},network:Network,sourceID:string,targetID:string,newEdge:Link):void{

// 	// d3 link is reversible ?
// 	let isReversible :boolean;
// 	if (typeof link.reversible === "string") {
//         isReversible = link.reversible.trim() === "true";
//     } else if (typeof link.reversible === "boolean") {
//         isReversible = link.reversible;
//     }
// 	// adding reversible class to new edge and reaction node (source and/or target node)
// 	let reversible: string;
// 	if (isReversible){
// 		reversible="reversible";
// 		// // put the reaction node in "reversible"
// 		// ////// for the source :
// 		// if (network.nodes[sourceID].classes.includes("reaction") && !(network.nodes[sourceID].classes.includes("reversible"))){
// 		// 	network.nodes[sourceID].classes.push(reversible);
// 		// }
// 		// ////// for the target :
// 		// if (network.nodes[targetID].classes.includes("reaction") && !(network.nodes[targetID].classes.includes("reversible"))){
// 		// 	network.nodes[targetID].classes.push(reversible);
// 		// }
// 	} else {
// 		reversible="irreversible";
// 	}

// 	if (!newEdge.classes){
// 		newEdge.classes=[]	
// 	}
// 	// reversible class to new edge
// 	newEdge.classes.push(reversible);	
// }
	


