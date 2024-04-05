import { Network } from "@metabohub/viz-core/src/types/Network";
import dagre from 'dagrejs';
import { instance } from "@viz-js/viz";
import { object } from "prop-types";
import { NetworkToDagre, NetworkToViz } from './networkToGraph';
import { changeNetworkFromDagre, changeNetworkFromViz } from './graphToNetwork';


export function method_to_try(network: Network) {

  // dagre
  let graphDagre = NetworkToDagre(network);
  dagre.layout(graphDagre);
  changeNetworkFromDagre(graphDagre, network);


  // viz
  instance().then(viz => {
  const graphViz=NetworkToViz(network);
  const json=viz.renderJSON(graphViz);
  changeNetworkFromViz(json,network)
  })


} 


