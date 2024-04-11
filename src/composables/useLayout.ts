import { Network } from "@metabohub/viz-core/src/types/Network";
import dagre from 'dagrejs';
import { instance } from "@viz-js/viz";
import { NetworkToDagre, NetworkToViz } from './networkToGraph';
import { changeNetworkFromDagre, changeNetworkFromViz } from './graphToNetwork';

/** 
 * Take a network object and change the (x,y) position of the node with dagre lib
 * @param {Network}  Network object 
 * @param [callbackFunction=() => {}] function to do after the layout is done
 */
export function dagreLayout(network: Network,callbackFunction = () => {}) {

    console.log('dagre');

    let graphDagre = NetworkToDagre(network);
    dagre.layout(graphDagre);
    changeNetworkFromDagre(graphDagre, network);
    callbackFunction();
}


/** 
 * Take a network object and change the (x,y) position of the node with viz lib
 * @param {Network}  Network object
 * @param [callbackFunction=() => {}] function to do after the layout is done
 */
export function vizLayout(network: Network,callbackFunction = () => {}) {

    console.log('viz');

    instance().then(viz => {
    const graphViz=NetworkToViz(network);
    const json=viz.renderJSON(graphViz);
    changeNetworkFromViz(json,network);
    callbackFunction();
    })

}