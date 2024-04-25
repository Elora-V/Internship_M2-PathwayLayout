export interface JSONGraphFormat {
    graph: {
        id: any;
        type: string;
        metadata: {
            style: {
                nodeStyles: {
                    /*
                    metabolite: {};
                    reaction: {};
                    reversible: {};
                    reversibleVersion: {};
                    */
                };
            };
        };
        nodes: {
            [x: string]: {
                id: string;
                metadata: {
                    classes?: string[];
                    position?: {
                        x: number;
                        y: number;
                    
                    };
                };
                label: string;
            };
        };
        edges: {
            id: string;
            source: string;
            target: string;
            metadata: {
                classes?: string[];
            };
        }[];
    };
}

export interface XMLSpecies {
    $: { 
        compartment: string; 
        id: string; 
        name: string; 
        species: string 
    }
}

export interface XMLReactions {
    $: {
        id: string;
        name: string;
    },
    listOfReactants: {
        speciesReference: any[]|{} 
    },
    listOfProducts: {
        speciesReference: Partial<XMLSpecies>[]|Partial<XMLSpecies> 
    }
}


