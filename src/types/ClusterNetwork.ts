import { Network } from "@metabohub/viz-core/src/types/Network";
import { Cluster } from "./Cluster";
import { Ref } from "vue";

export interface ClusterNetwork {
	network: Ref<Network>;
	attributs?: AttributesViz;
	clusters: {
		[key: string]: Cluster
	}
	supernodes?:{
		[key: string]: Network
	}
}