import { Cluster, RankEnum } from "@/types/Cluster";


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
 * Adds a node to the cluster if it doesn't already exist.
 * @param cluster The cluster to which the node will be added.
 * @param node The node to be added.
 * @returns The updated cluster.
 */
export function addNodeCluster(cluster: Cluster, node: string): Cluster {
    if (!cluster.nodes.includes(node)) {
        cluster.nodes.push(node);
    }
    return cluster;
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
