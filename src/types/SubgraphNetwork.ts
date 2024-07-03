import { Network } from "@metabohub/viz-core/src/types/Network";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { Subgraph } from "./Subgraph";
import { Ref } from "vue";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";

export interface SubgraphNetwork {
	network: Ref<Network>;
	networkStyle: Ref<GraphStyleProperties>;
	stats:{[key:string]:number}
	attributs?: AttributesViz;
	mainChains: {
		[key: string]: Subgraph
	}
	secondaryChains?:{
		[key: string]: Subgraph
	}
	cycles?:{
		[key:string]:Subgraph
	}
	// The cycle metanode :
	cyclesGroup?:{
		[key:string]:Subgraph
	}

	sideCompounds?:{
		[key:string]:{reactants:Array<Node>,products:Array<Node>}
	}
}