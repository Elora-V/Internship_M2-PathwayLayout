import libsbml from 'libsbmljs_stable';
import { parseString } from 'xml2js';



export interface JsonGraphFormat {
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

function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function sbml2json(sbmlString: string): Promise<JsonGraphFormat> {
    return new Promise((resolve, reject) => {
        parseString(sbmlString, { explicitArray: false }, (err, result) => {
            if (err) {
                console.log("Error during the parsing of the file");
                console.log(err);
                reject(err);
            } else {
                const model = result.sbml.model;
                // graph to return
                const graph: JsonGraphFormat = {
                    graph: {
                        id: model.$.id,
                        type: 'metabolic',
                        metadata: {
                            style: {
                                nodeStyles: {
                                    metabolite: {
                                        width: 25,
                                        height: 25,
                                        strokeWidth: 1,
                                        shape: 'circle'
                                    },
                                    reaction: {
                                        width: 15,
                                        height: 15,
                                        strokeWidth: 0.5,
                                        shape: 'rect',
                                        fill: 'grey'
                                    },
                                    reversible: {
                                        fill: 'green',
                                        shape: 'inverseTriangle'
                                    },
                                    reversibleVersion: {
                                        fill: 'red',
                                        shape: 'triangle'
                                    }
                                }
                            }
                        },
                        nodes: {},
                        edges: []
                    }
                };

                // Transform species to nodes
                const speciesList = model.listOfSpecies.species;
                // add a metabolite node for each species
                speciesList.forEach((species: { $: { compartment: string; id: string; name: string; species: string } }) => {
                    graph.graph.nodes[species.$.id] = {
                        id: species.$.id,
                        metadata: {
                            classes: ['metabolite'],
                            position: {
                                x: getRandomInt(0, 100),
                                y: getRandomInt(0, 100)
                            }
                        },
                        label: species.$.name
                    };
                });

                // Transform reactions to nodes and edges
                const reactions = model.listOfReactions.reaction;
                reactions.forEach((reaction: any) => {
                    const reactionId = reaction.$.id;

                    // get the reactants and products for every reaction
                    const reactants: any[] = [];
                    if (reaction.listOfReactants.speciesReference != undefined && reaction.listOfReactants.speciesReference.length != undefined) {
                        // type : array
                        reaction.listOfReactants.speciesReference.forEach((ref: any) => {
                            reactants.push(ref.$.species);
                        });
                    } else if (reaction.listOfReactants.speciesReference != undefined) {
                        // type : object
                        reactants.push(reaction.listOfReactants.speciesReference.$.species);
                    }
                    const products: any[] = [];
                    if (reaction.listOfProducts.speciesReference != undefined && reaction.listOfProducts.speciesReference.length != undefined) {
                        // type : array
                        reaction.listOfProducts.speciesReference.forEach((ref: any) => {
                            products.push(ref.$.species);
                        });
                    } else if (reaction.listOfProducts.speciesReference != undefined) {
                        // type : object
                        products.push(reaction.listOfProducts.speciesReference.$.species);
                    }

                    // add the reaction as a node
                    graph.graph.nodes[reactionId] = {
                        id: reactionId,
                        metadata: {
                            classes: ['reaction'],
                            position: {
                                x: getRandomInt(0, 100),
                                y: getRandomInt(0, 100)
                            }
                        },
                        label: reaction.$.name
                    };

                    // add the edges for the reaction and its reactants and products
                    reactants.forEach((reactant: string) => {
                        console.log(`         ${reactant}--${reactionId}`);
                        graph.graph.edges.push({
                            id: `${reactant}--${reactionId}`,
                            source: reactant,
                            target: reactionId,
                            metadata: {
                                classes: ['irreversible']
                            }
                        });
                    });
                    products.forEach((product: string) => {
                        console.log(`         ${reactionId}--${product}`);
                        graph.graph.edges.push({
                            id: `${reactionId}--${product}`,
                            source: reactionId,
                            target: product,
                            metadata: {
                                classes: ['irreversible']
                            }
                        });
                    });
                });

                // return the graph object
                resolve(graph);
            }
        });
    });
}
