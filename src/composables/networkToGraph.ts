import { Network } from '@metabohub/viz-core/src/types/Network';
import { GraphViz } from '../types/graphLibType';
import  dagre  from 'dagrejs/dist/dagre.js';
import { instance } from "@viz-js/viz";

/** 
 * Take an network object and return a dagre.graphlib.Graph object containing the same nodes and edge 
 * @param {Network}  Network object 
 * @returns {dagre.graphlib.Graph} Return dagre.graphlib.Graph object 
 */
export function NetworkToDagre(network: Network): dagre.graphlib.Graph{

    // initialisation dagre graph
    var g = new dagre.graphlib.Graph();
    //g.setGraph({});
    g.setDefaultEdgeLabel(function() { return {}; });

    // insert nodes into graph
    for (const node in network["nodes"]){
        const labelNode=network["nodes"][node]["label"];

        // get position (x,y) if one
        let xNode:number;
        if ( Object.keys(network["nodes"][node]).includes('x') ){
            xNode= network["nodes"][node]["x"];
        }else{
            xNode= NaN;
        }
        let yNode:number;
        if ( Object.keys(network["nodes"][node]).includes('y') ){
            yNode= network["nodes"][node]["y"];
        }else{
            yNode= NaN;
        }
        g.setNode(node,    { label: labelNode,  width: 100, height: 100, x: xNode, y:yNode });
    }

    // insert edges into graph
    for (const link in network["links"]){
        const fromNode=network["links"][link]["source"]["id"];
        const toNode=network["links"][link]["target"]["id"];
        g.setEdge(fromNode,   toNode);
    }

    return g;

}


/**
 * Take an network object and return a graph object for viz containing the same nodes and edge 
 * @param {Network}  Network object 
 * @returns {GraphViz} Return graph object for viz
 */
export function NetworkToViz(network: Network): GraphViz{

    // initialisation dagre graph
    const g ={
        graphAttributes: {
            rankdir: "BT", // why bottom-top to have a top-bottom ??
            
        },
        directed: true,
        edges: []
    }

    // insert edges into graph
    for (const link in network["links"]){
        const fromNode=network["links"][link]["source"]["id"];
        const toNode=network["links"][link]["target"]["id"];
        g.edges.push({tail:fromNode, head:toNode});
    }

    return g;

}