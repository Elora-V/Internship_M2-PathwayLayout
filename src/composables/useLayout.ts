import { Network } from "@metabohub/viz-core/src/types/Network";
import dagre from 'dagrejs';
import { Graph, instance } from "@viz-js/viz";
import { NetworkToDagre, NetworkToViz } from './networkToGraph';
import { changeNetworkFromDagre, changeNetworkFromViz, dagreToNetwork } from './graphToNetwork';
import { JsonViz } from "@/types/JsonViz";

/** 
 * Take a network object and change the (x,y) position of the node with dagre lib
 * @param {Network}  Network object 
 * @param  graphAttributes for dagre layout (see https://github.com/dagrejs/dagre/wiki)
 * @param [callbackFunction=() => {}] function to do after the layout is done
 */
export function dagreLayout(network: Network,graphAttributes={},callbackFunction = () => {}) {

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
 * @param clusters clusters for viz (type version for quick search)
 * @param graphAttributes for viz dot layout (see https://graphviz.org/docs/layouts/dot/)
 * @param [callbackFunction=() => {}] function to do after the layout is done
 */
export function vizLayout(network: Network,clusters:Array<SubgraphObject>=[], graphAttributes={}, callbackFunction = () => {}) {
    console.log('Viz');
    setTimeout(async function() {
        instance().then(viz => {
        const graphViz=NetworkToViz(network,clusters,graphAttributes,true);
        const json=viz.renderJSON(graphViz) as JsonViz;
        changeNetworkFromViz(json,network).then(() => {
            callbackFunction();
        });
        });
    }, 1);
    

}