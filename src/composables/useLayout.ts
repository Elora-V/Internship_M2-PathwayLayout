import { Network } from "@metabohub/viz-core/src/types/Network";
import dagre from 'dagrejs';
import { instance } from "@viz-js/viz";
import { NetworkToDagre, NetworkToViz } from './networkToGraph';
import { changeNetworkFromDagre, changeNetworkFromViz } from './graphToNetwork';

/** 
 * Take a network object and change the (x,y) position of the node with dagre lib
 * @param {Network}  Network object 
 */
export function dagreLayout(network: Network) {

    let graphDagre = NetworkToDagre(network);
    dagre.layout(graphDagre);
    changeNetworkFromDagre(graphDagre, network);

}


/** 
 * Take a network object and change the (x,y) position of the node with viz lib
 * @param {Network}  Network object 
 */
export function vizLayout(network: Network) {

    instance().then(viz => {
    const graphViz=NetworkToViz(network);
    const json=viz.renderJSON(graphViz);
    changeNetworkFromViz(json,network)
    })

}