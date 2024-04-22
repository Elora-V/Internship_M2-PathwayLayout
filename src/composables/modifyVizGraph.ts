import { Cluster } from "@/types/Cluster";
import { Graph } from "@viz-js/viz";

/**
 * Adds a cluster to a viz graph, but don't take into account subgraph inside clusters
 * @param {Graph} vizGraph The graph object to which the cluster will be added.
 * @param {string} name The name of the cluster.
 * @param {Array<NodeViz>} vizNodesList An array of viz node objects representing the nodes to be included in the cluster.
 * @returns {Graph} The updated graph object with the cluster visualization added.
 */
export function addClusterViz(vizGraph: Graph, cluster: Cluster): Graph {
  // get values from cluster and change nodes format : new cluster format (for viz)
  let { name, nodes } = cluster;
  const clusterViz: SubgraphViz = {
    name: name.startsWith("cluster_") ? name : "cluster_" + name,
    nodes: nodes?.map((name: string) => ({ name:name })) || []
  };
  // push cluster for viz
  if (!Object.keys(vizGraph).includes("subgraphs")) {
    vizGraph.subgraphs = [];
  }
  vizGraph.subgraphs.push(clusterViz);

  return vizGraph;
}
