import { Network } from "@metabohub/viz-core/src/types/Network";

export function method_to_try(network: Network) {
    network["nodes"]["M_HC00080_c"]["x"]=0;
    
    for (const link in network["links"]) {
        
        if( network["links"][link]["target"]["id"]=="M_HC00080_c"){
            //network["links"][link]["target"]["x"]==0;
            network["links"][link]["target"]=network["nodes"]["M_HC00080_c"]
            console.log(link);
        }
        else if( network["links"][link]["source"]["id"]=="M_HC00080_c"){
            //network["links"][link]["source"]["x"]==0;
            network["links"][link]["source"]=network["nodes"]["M_HC00080_c"]
            console.log(link);
        }
        
        
    } 
    console.log(network);
} 