import { Graph } from "@viz-js/viz";


/**
 * Adds a cluster to a viz graph.
 * @param {Graph} vizGraph The graph object to which the cluster will be added.
 * @param {string} name The name of the cluster.
 * @param {Array<NodeViz>} vizNodesList An array of viz node objects representing the nodes to be included in the cluster.
 * @returns {Graph} The updated graph object with the cluster visualization added.
 */
export function addClusterViz(vizGraph:Graph,cluster:SubgraphObject):Graph{
    // get values from cluster and change nodes format : new cluster format (for viz)
    let { 
        name, 
        graphAttributes, 
        nodeAttributes, 
        edgeAttributes, 
        nodes, 
        edges, 
        subgraphs 
    } = cluster;
    if (!name.startsWith("cluster_")) {
        name = "cluster_" + name;
    }
    const clusterViz:SubgraphViz={
        name,
        graphAttributes,
        nodeAttributes,
        edgeAttributes,
        nodes:nodes === undefined ? [] : Object.values(nodes),
        edges,
        subgraphs: subgraphs
    };

    // push cluster for viz
    if (!Object.keys(vizGraph).includes("subgraphs")){
        vizGraph.subgraphs=[];
    }
    vizGraph.subgraphs.push(clusterViz);

    return vizGraph;
}

export function addAttributClusterViz(cluster:SubgraphViz,nameAttribut:string,valueAttribut:string | number | boolean ):SubgraphViz{
    if (!Object.keys(cluster).includes("graphAttributes")){
        cluster.graphAttributes={};
    }
    cluster.graphAttributes[nameAttribut]=valueAttribut;
    return cluster;
}

