import { Network } from "@metabohub/viz-core/src/types/Network";
import dagre from 'dagrejs';
import { Graph, instance } from "@viz-js/viz";
import { networkToCytoscape, NetworkToDagre, NetworkToDot, NetworkToViz } from './networkToGraph';
import { changeNetworkFromCytoscape, changeNetworkFromDagre, changeNetworkFromViz, dagreToNetwork } from './graphToNetwork';
import { JsonViz } from "@/types/JsonViz";
import { Subgraph } from "@/types/Subgraph";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { getSepAttributesInches, shiftAllToGetTopLeftCoord } from "./calculateSize";
import * as d3 from 'd3';
import { reactive } from "vue";
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";
import { getMeanNodesSizePixel } from "./calculateSize";

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
    //console.log('Viz');
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


  /**
   * Take a network and apply a d3 force layout algorithm on WITHOUT simulation
   * @param network Network object
   * @returns {Network} Network object with d3 force layout apply on
   */
  export async function forceLayout3(network: Network, autoRescale: Boolean = false): Promise<Network> {
    const seuil = 0.04;
    const maxiter = 1000;
    const minMovement = 0.01; 
    const listNodesID=Object.keys(network.nodes);
    let svgHeight = screen.height;
    let svgWidth = screen.width;

    const simulation = d3.forceSimulation(Object.values(network.nodes))
        .force('link', d3.forceLink()
            .id((d: any) => d.id)
            .links(network.links)
        )
        .force('charge', d3.forceManyBody())
        .velocityDecay(0.1)
        .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2))
        .stop();

    await sendTick();

    async function sendTick() {
        let iter=0;
        let lastPositions = new Map(Object.values(network.nodes).map(node => [node.id, { x: node.x, y: node.y }]));
        while (iter < maxiter) {
            iter++;
            simulation.tick();

            let maxMovement = 0;
            for (let nodeID of listNodesID) {
                const node=network.nodes[nodeID];
                const lastPos = lastPositions.get(nodeID);
                const dx = node.x - lastPos.x;
                const dy = node.y - lastPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > maxMovement) {
                    maxMovement = distance;
                }

                lastPositions.set(node.id, { x: node.x, y: node.y });
            }

            if (maxMovement < minMovement) {
                console.log('Force layout converged after ' + iter + ' iterations');
                break;
            }else{
                console.log(iter);
            }
        }
    }

    return network;
}

  
export async function forceLayout2(network: Network, autoRescale: Boolean = false): Promise<Network> {
    let svgHeight = screen.height;
    let svgWidth = screen.width;
  
    const simulation = d3.forceSimulation(Object.values(network.nodes))
      .force('link', d3.forceLink()
        .id((d: any) => {
          return d.id;
        })
        .links(network.links)
      )
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2))
      .alphaMin(0.4)
      .stop();
  
    await sendTick();
  
    async function sendTick() {
      for (let i = simulation.alpha(); i > 0.4; i = simulation.alpha()) {
        simulation.tick();
      }
    }
  
    return network;
  
  }


export async function forceLayout(network: Network, networkStyle:GraphStyleProperties, shiftCoord: boolean = false): Promise<Network> {

    cytoscape.use(fcose);

    const size=getMeanNodesSizePixel(Object.values(network.nodes), networkStyle,false);
    const edgeFactor=3;
    const edgeLength = Math.max(size.height, size.width) * edgeFactor;

    const layout = {
        name: 'fcose',
        animate: false,
        randomize: false,
        //quality:"proof",  // ?? if randomize is set to false, then quality option must be "proof"
        idealEdgeLength: edge => edgeLength,
        //edgeElasticity: edge => 0.1,
        //nodeRepulsion: node => 3000,
        gravity: 0.005,
    };

    let cyto = networkToCytoscape(network);

    await new Promise<void>((resolve) => {
        cyto.ready(function () {
            setTimeout(function () {
                cyto.elements().layout(layout).run();
                resolve();
            }, 5000);
        });
    });

    if (shiftCoord) {
        shiftAllToGetTopLeftCoord(network, networkStyle);
    }

    const json = cyto.json();
    changeNetworkFromCytoscape(json, network);

    return network;
}
  
  
