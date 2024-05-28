import { Subgraph, TypeSubgraph } from "@/types/Subgraph";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { Graph } from "@viz-js/viz";

/**
 * 
 */
export function addMainChainClusterViz(vizGraph: Graph, nameMainChain: string, subgraphNetwork:SubgraphNetwork): Graph {
  // get values from cluster and change nodes format : new cluster format (for viz)
  let { name, nodes ,associatedSubgraphs} = subgraphNetwork.mainChains[nameMainChain];
  const clusterViz: SubgraphViz = {
    name: name.startsWith("cluster_") ? name : "cluster_" + name,
    nodes: nodes?.map((name: string) => ({ name:name })) || []
  };
  //add node of children subgraph           !!!!!BEWARE : only one level of children!!!!
    if (associatedSubgraphs){
        associatedSubgraphs.forEach(subgraph => {
            let nodeToAdd =subgraphNetwork[subgraph.type][subgraph.name].nodes.map((name: string) => ({ name:name }));
            clusterViz.nodes.push(...nodeToAdd);       
        });
    }
  // push cluster for viz
  if (!Object.keys(vizGraph).includes("subgraphs")) {
    vizGraph.subgraphs = [];
  }
  vizGraph.subgraphs.push(clusterViz);

  return vizGraph;
}


// export function addNoConstraint(subgraphNetwork:SubgraphNetwork):SubgraphNetwork{
//   let network=subgraphNetwork.network.value;
//   network.links.forEach(link=>{
//       let clusterSource: string[] = [];
//       let clusterTarget: string[] = [];
//       if ( Object.keys(link.source).includes("metadata") && Object.keys(link.source.metadata).includes("clusters")){
//           clusterSource= link.source.metadata?.clusters ? link.source.metadata.clusters as string[] : [];
//       }

//       if ( Object.keys(link.target).includes("metadata") && Object.keys(link.target.metadata).includes("clusters")){
//           clusterTarget= link.target.metadata?.clusters ? link.target.metadata.clusters as string[] : [];
//       }        
//       let sameClusters=true;
//       // if same number of cluster : let's check if there are the same
//       if (clusterTarget.length===clusterSource.length){
//           clusterTarget.sort;
//           clusterSource.sort;
//           for (let i = 0; i < clusterTarget.length; ++i) {
//               if (clusterTarget[i] !== clusterSource[i]){
//                   sameClusters=false;
//               }
//           }
//       }else{
//           // if not the same number of cluster : the two nodes can't be in the exact same clusters
//           sameClusters=false;
//       }

//       if (!sameClusters){
//           if(!link.metadata){
//               link.metadata={};
//           }
//           link.metadata["constraint"]=false;
//       }
//   });

//   return subgraphNetwork;
// }

export function addBoldLinkMainChain(subgraphNetwork:SubgraphNetwork):SubgraphNetwork{
    let network=subgraphNetwork.network.value;
    network.links.forEach(link=>{
        let mainChainSource: string[] = [];
        let mainChainTarget: string[] = [];
        if ( Object.keys(link.source).includes("metadata") && Object.keys(link.source.metadata).includes(TypeSubgraph.MAIN_CHAIN)){
            mainChainSource= link.source.metadata?.mainChains ? link.source.metadata.mainChains as string[] : [];
        }
  
        if ( Object.keys(link.target).includes("metadata") && Object.keys(link.target.metadata).includes(TypeSubgraph.MAIN_CHAIN)){
            mainChainTarget= link.target.metadata?.mainChains ? link.target.metadata.mainChains as string[] : [];
        }        
        // let sameClusters=true;
        // // if same number of cluster, and in a cluster: let's check if there are the same
        // if (clusterTarget.length===clusterSource.length && clusterSource.length!==0){
        //     clusterTarget.sort;
        //     clusterSource.sort;
        //     for (let i = 0; i < clusterTarget.length; ++i) {
        //         if (clusterTarget[i] !== clusterSource[i]){
        //             sameClusters=false;
        //         }
        //     }
        // }else{
        //     // if not the same number of cluster : the two nodes can't be in the exact same clusters
        //     sameClusters=false;
        // }

        // Check if there is at least one common cluster
        let commonMainChain = mainChainSource.some(mainchain => mainChainTarget.includes(mainchain));

        if (commonMainChain){ 
            if(!link.classes){
                link.classes=[];
            }
            if (!(link.classes.includes(TypeSubgraph.MAIN_CHAIN))){
                link.classes.push(TypeSubgraph.MAIN_CHAIN);
            }
        }else{
            if(link.classes){
                link.classes = link.classes.filter((c) => c !== TypeSubgraph.MAIN_CHAIN);
            }
        }
    });
  
    return subgraphNetwork;
  }
  