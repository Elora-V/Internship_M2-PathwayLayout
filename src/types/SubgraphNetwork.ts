import { Network } from "@metabohub/viz-core/src/types/Network";
import { Cluster } from "./Cluster";
import { Ref } from "vue";

export interface SubgraphNetwork {
	network: Ref<Network>;
	attributs?: AttributesViz;
	mainChains: {
		[key: string]: Cluster
	}
	secondaryChain?:{
		[key: string]: string[]
	}
	cycles?:{
		[key:string]:string[]
	}
}