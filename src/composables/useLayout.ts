import { Network } from "@metabohub/viz-core/src/types/Network";
import dagre from 'dagrejs';
import { Graph, instance } from "@viz-js/viz";
import { NetworkToDagre, NetworkToDot, NetworkToViz } from './networkToGraph';
import { changeNetworkFromDagre, changeNetworkFromViz, dagreToNetwork } from './graphToNetwork';
import { JsonViz } from "@/types/JsonViz";
import { Subgraph } from "@/types/Subgraph";

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
export async function vizLayout(network: Network,mainChains:{[key:string]:Subgraph}={}, graphAttributes={},assignRank:boolean=false, callbackFunction = () => {}): Promise<void> {
    console.log('Viz');
    await instance().then(viz => {
        const graphViz=NetworkToViz(network,mainChains,graphAttributes);
        const json=viz.renderJSON(graphViz) as JsonViz;
        changeNetworkFromViz(json,network,assignRank).then(() => {
            callbackFunction();
        });
    });
}