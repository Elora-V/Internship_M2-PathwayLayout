import { Network } from "@metabohub/viz-core/src/types/Network";
import { Subgraph } from "./Subgraph";
import { Ref } from "vue";

export interface SubgraphNetwork {
	network: Ref<Network>;
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
}