import { Network } from "@metabohub/viz-core/src/types/Network";
import dagre from 'dagrejs';
import { Graph, instance } from "@viz-js/viz";
import { NetworkToDagre, NetworkToDot, NetworkToViz } from './networkToGraph';
import { changeNetworkFromDagre, changeNetworkFromViz, dagreToNetwork } from './graphToNetwork';
import { JsonViz } from "@/types/JsonViz";
import { Subgraph } from "@/types/Subgraph";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { getSepAttributesInches } from "./calculateSize";

/** 
 * Take a network object and change the (x,y) position of the node with dagre lib
 * @param {Network}  Network object 
 * @param  graphAttributes for dagre layout (see https://github.com/dagrejs/dagre/wiki)
 * @param [callbackFunction=() => {}] function to do after the layout is done
 */
export function dagreLayout(network: Network,graphAttributes={},callbackFunction = () => {}):void {

    console.log('Dagre');

    setTimeout(async function() {
        let graphDagre = NetworkToDagre(network,graphAttributes);
        dagre.layout(graphDagre);
        changeNetworkFromDagre(graphDagre, network).then(() => {
            callbackFunction();
        });
    }, 1);
        
}


/** 
 * Take a network object and change the (x,y) position of the node with viz lib
 * @param {Network}  Network object
 * @param mainChains clusters for viz (type version for quick search)
 * @param graphAttributes for viz dot layout (see https://graphviz.org/docs/layouts/dot/)
 * @param assignRank indicates if rank and order need to be infered after layout is applied
 * @param [callbackFunction=() => {}] function to do after the layout is done
 */
export async function vizLayout(subgraphNetwork:SubgraphNetwork,assignRank:boolean=false, cycle:boolean=true,addNodes:boolean=true,
    groupOrCluster:"group"|"cluster"="cluster",orderChange:boolean=false,printDot:boolean=false,dpi:number=72,factorLenghtEdge:number=3,callbackFunction = () => {}): Promise<SubgraphNetwork> {
    console.log('Viz');
    await instance().then( async viz => {
        // attributes for viz
        const sep =getSepAttributesInches(subgraphNetwork.network.value,subgraphNetwork.networkStyle.value,factorLenghtEdge);
        subgraphNetwork.attributs={rankdir: "BT" , newrank:true, compound:true,splines:false,ranksep:sep.rankSep,nodesep:sep.nodeSep,dpi:dpi};
        const graphViz=NetworkToViz(subgraphNetwork,cycle,addNodes,groupOrCluster,orderChange);
        const dot =NetworkToDot(graphViz,true);
        if(printDot) console.log(dot);
        const json=viz.renderJSON(dot) as JsonViz;
        subgraphNetwork= await changeNetworkFromViz(json,subgraphNetwork,assignRank);
        callbackFunction();
    });
    return subgraphNetwork;
}