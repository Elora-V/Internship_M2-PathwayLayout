import { v4 as uuidv4 } from 'uuid';

import { Node } from "@metabohub/viz-core/src/types/Node";
import { Link } from "@metabohub/viz-core/src/types/Link";
import { Network} from '@metabohub/viz-core/src/types/Network';
import type { GraphStyleProperties } from "@metabohub/viz-core/src//types/GraphStyleProperties";


export function readJsonGraph(jsonGraph: string): { network: Network, networkStyle: GraphStyleProperties } {
	const preprocessJsonGraph = jsonGraph.replace(/undefined/g, 'null');
	const jsonObject = JSON.parse(preprocessJsonGraph);

	const network: Network = {
		id: "",
		nodes: {},
		links: []
	};

	const networkStyle: GraphStyleProperties = {
		nodeStyles: {}
	}

	if (!jsonObject.graph) {
		if (!jsonObject.sessions) {
			throw new Error("graph attribute lacking in json graph format")
		} else {
			readJsonMetExploreViz(preprocessJsonGraph, network, networkStyle);

			return { network, networkStyle };
		}
	}

	if (!jsonObject.graph.nodes) {
		throw new Error("nodes attribute lacking in json graph format")
	}

	if (!jsonObject.graph.edges) {
		throw new Error("edges attribute lacking in json graph format")
	}

	if (jsonObject.graph.id) {
		network.id = jsonObject.graph.id;
	}
	else {
		network.id = uuidv4();
	}

	if (jsonObject.graph.label) {
		network.label = jsonObject.graph.label;
	}
	else {
		network.label = network.id;
	}


	for (const [id, n] of Object.entries(jsonObject.graph.nodes) as any) {

		const node: Node = {
			id: "",
			x: 0,
			y: 0
		};

		node.id = id;

		if (!n.label) {
			node.label = id;
		}
		else {
			node.label = n.label;
		}

		if (n.metadata && n.metadata.position && n.metadata.position.x) {
			node.x = n.metadata.position.x;
		}


		if (n.metadata && n.metadata.position && n.metadata.position.y) {
			node.y = n.metadata.position.y;
		}


		if (node.id in network.nodes) {
			throw new Error("Duplicated node id : " + node.id);
		}

		if (n.metadata && n.metadata.classes) {
			node.classes = n.metadata.classes;
		}

		if (n.metadata) {
			node.metadata = n.metadata;
		}

		network.nodes[node.id] = node;

	};

	network.links = jsonObject.graph.edges.map((e: { source: string, target: string, metadata: {[key: string]: string} }) => {
		const source: Node = network.nodes[e.source];
		const target: Node = network.nodes[e.target];
		let classes;

		if (e.metadata) {
			if (e.metadata.classes) {
				classes = e.metadata.classes;
			}
		}
		
		return {
			...e,
			source: source,
			target: target,
			classes: classes
		}

	});

	if (jsonObject.graph.metadata && jsonObject.graph.metadata.style) {
		if (jsonObject.graph.metadata.style.nodeStyles) {
			networkStyle.nodeStyles = jsonObject.graph.metadata.style.nodeStyles;
		}
		if (jsonObject.graph.metadata.style.linkStyles) {
			networkStyle.linkStyles = jsonObject.graph.metadata.style.linkStyles;
		}
	}


	return { network, networkStyle };

}

/**
 * Read MetExploreViz JSON graph and return network and styles object
 * @param jsonGraph MetExploreViz JSON object stringify
 * @param network Network object
 * @param networkStyle Network style object
 * @returns {Network, GraphStyleProperties} Return network object and graphStyleProperties object
 */
function readJsonMetExploreViz(jsonGraph: string, network: Network, networkStyle: GraphStyleProperties): { network: Network, networkStyle: GraphStyleProperties } {
	const jsonObject = JSON.parse(jsonGraph);
	const d3Nodes = jsonObject.sessions.viz.d3Data.nodes;

	if (jsonObject.sessions.viz.id) {
		network.id = jsonObject.sessions.viz.id;
	}
	else {
		network.id = uuidv4();
	}
	
	d3Nodes.forEach((n: {[key: string]: string | number}) => {
		if (n.biologicalType === "metabolite" || n.biologicalType === "reaction") {
			const node: Node = {
				id: "",
				x: 0,
				y: 0
			};
	
			node.id = n.dbIdentifier as string;
	
			if (!n.name) {
				node.label = n.dbIdentifier as string;
			}
			else {
				node.label = n.name as string;
			}
	
			if (n.x) {
				node.x = n.x as number;
			}
	
	
			if (n.y) {
				node.y = n.y as number;
			}
	
			if (n.biologicalType) {
				node.classes = [n.biologicalType as string];
			}
	
			network.nodes[node.id] = node;
		}
	});

	jsonObject.sessions.viz.d3Data.links.forEach((link: {[key: string]: string}) => {	
		const d3Source = d3Nodes[link.source];
		const d3Target = d3Nodes[link.target];

		const source = network.nodes[d3Source.dbIdentifier];
		const target = network.nodes[d3Target.dbIdentifier];

		// adding reversible class to link

		let isReversible :boolean;
		if (typeof link.reversible == "string"){
			if ( link.reversible.trim() =="true"){isReversible=true;}
			else if (link.reversible.trim()=="false"){isReversible=false;}
		}else if (typeof link.reversible == "boolean"){
			isReversible=link.reversible;
		}
		let reversible: string;
		if (isReversible){
			reversible="reversible";
			// put the reaction node in "reversible"
			////// for the source :
			if (source.classes.includes("reaction")){
				network.nodes[d3Source.dbIdentifier].classes.push("reversible");
			}
			////// for the target :
			if (target.classes.includes("reaction")){
				network.nodes[d3Target.dbIdentifier].classes.push("reversible");
			}
		} else {
			reversible="irreversible";
		}
		

		if (target && source) {

			const edge: Link = {
				id: link.id,
				source: source,
				target: target,
				classes: [
					reversible
				]
                
			}

			network.links.push(edge);
		}
	});

	if (jsonObject.linkStyle) {
		networkStyle.linkStyles = jsonObject.linkStyle;
	}
	if (jsonObject.metaboliteStyle && jsonObject.reactionStyle) {
		networkStyle.nodeStyles = {
			metabolite: {
				width: 20,
				height: 20,
				fill: jsonObject.metaboliteStyle.backgroundColor ? jsonObject.metaboliteStyle.backgroundColor : '#FFFFFF',
				strokeWidth: jsonObject.metaboliteStyle.strokeColor,
				shape: 'circle'
			},
			reaction: {
				width: 15,
				height: 15,
				fill: "grey",
				//fill: jsonObject.reactionStyle.backgroundColor ? jsonObject.reactionStyle.backgroundColor : '#FFFFFF',
				strokeWidth: jsonObject.reactionStyle.strokeColor,
				shape: 'rect'
			},
			reversible : {
				fill : "green",
				shape:"inverseTriangle"
			},
			reversibleVersion:{
				fill:"red",
				shape: "triangle"
			}

		}
	}

	return {network, networkStyle};
}


