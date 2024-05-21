import { Cluster, RankEnum } from "@/types/Cluster";
import { ClusterNetwork } from "@/types/ClusterNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";


/**
 * Creates a new cluster with the specified properties.
 * @param name The name of the cluster.
 * @param rank The rank of the cluster (defaults to empty rank).
 * @param nodes The array of nodes in the cluster (defaults to an empty array).
 * @param Subcluster The array of subclusters (defaults to an empty array).
 * @param classes The array of classes associated with the cluster (defaults to an empty array).
 * @returns The newly created cluster.
 */
export function createCluster(name: string, rank: RankEnum = RankEnum.EMPTY, nodes: Array<string> = [], Subcluster: Array<Cluster> = [], classes: Array<string> = []): Cluster {
    return {
        name,
        rank,
        nodes,
        Subcluster,
        classes
    };
}


/**
 * Adds a class to the cluster if it doesn't already exist.
 * @param cluster The cluster to which the class will be added.
 * @param newClass The class to be added.
 * @returns The updated cluster.
 */
export function addClassCluster(cluster: Cluster, newClass: string): Cluster {
    if (cluster.classes && !cluster.classes.includes(newClass)) {
        cluster.classes.push(newClass);
    }
    return cluster;
}

/**
 * Removes a node from the cluster.
 * @param cluster The cluster from which the node will be removed.
 * @param name The name of the node to be removed.
 * @returns The updated cluster.
 */
export function removeNodeCluster(cluster: Cluster, name: string): Cluster {
    const index = cluster.nodes.indexOf(name);
    if (index !== -1) {
        cluster.nodes.splice(index, 1);
    }
    return cluster;
}

/**
 * Removes a class from the cluster.
 * @param cluster The cluster from which the class will be removed.
 * @param className The name of the class to be removed.
 * @returns The updated cluster.
 */
export function removeClassCluster(cluster: Cluster, className: string): Cluster {
    if (cluster.classes) {
        const index = cluster.classes.indexOf(className);
        if (index !== -1) {
            cluster.classes.splice(index, 1);
        }
    }
    return cluster;
}


/**
 * Adds a node to a cluster in the cluster network, and update the metadata of the node (name of the cluster to wich it belongs)
 * 
 * @param clusterNetwork - The cluster network object.
 * @param clusterID - The ID of the cluster.
 * @param nodeID - The ID of the node to be added.
 * @returns The updated cluster network object.
 */
export function addNodeTocluster(clusterNetwork:ClusterNetwork,clusterID:string,nodeID:string):ClusterNetwork{
    const network=clusterNetwork.network.value;

    if (clusterID in clusterNetwork.clusters){
        // if node not already in cluster :
        if (!clusterNetwork.clusters[clusterID].nodes.includes(nodeID)){
            // add to cluster
            clusterNetwork.clusters[clusterID].nodes.push(nodeID);
            // update metadata of node
            updateNodeMetadataCluster(network, nodeID, clusterID);
        }
    }else{
        console.error("cluster not in clusterNetwork");
    }
    return clusterNetwork;
}

/**
 * Updates the metadata of a node in the network by adding a cluster ID to its list of clusters.
 * If the metadata does not exist, they will be created.
 * 
 * @param network - The network object.
 * @param nodeID - The ID of the node to update.
 * @param clusterID - The ID of the cluster to add.
 */
export function updateNodeMetadataCluster(network: Network, nodeID: string, clusterID: string){
  if (! ("metadata" in network.nodes[nodeID]) ){
    network.nodes[nodeID].metadata={};
  }
  if (!("clusters" in network.nodes[nodeID].metadata)){
    network.nodes[nodeID].metadata.clusters=[]
  }
  const clusters=network.nodes[nodeID].metadata.clusters as Array<string>;
  clusters.push(clusterID);
}