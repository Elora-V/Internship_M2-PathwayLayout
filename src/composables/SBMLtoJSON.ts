import { parseString } from 'xml2js';
import type { JSONGraphFormat, XMLSpecies, XMLReactions } from '@/types/JSONGraphFormat';

/**
 * Return a number between min (inclusive) and max (inclusive)
 * @param min 
 * @param max 
 * @returns a number
 */
function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Convert an xml graph into a JSON graph format
 * @param sbmlString the xml file as a string
 * @returns the graph as a Promise 
 */
export async function sbml2json(sbmlString: string): Promise<JSONGraphFormat> {
    return new Promise((resolve, reject) => {
        parseString(sbmlString, { explicitArray: false }, (err, result) => {
            if (err) {
                console.log("Error during the parsing of the file");
                console.log(err);
                reject(err);
            } else {
                const model = result.sbml.model;
                // graph to return
                const graph: JSONGraphFormat = {
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
                speciesList.forEach((species: XMLSpecies) => {
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
                reactions.forEach((reaction: XMLReactions) => {
                    const reactionId = reaction.$.id;
                    
                    let classReversible :string;
                    const isReversible=reaction.$.reversible;
                    if (isReversible==="true"){
                        classReversible = "reversible";
                    }else{
                        classReversible = "irreversible";
                    }

                    // get the reactants and products for every reaction
                    const reactants: string[] = [];
                    if (reaction.listOfReactants.speciesReference != undefined && (reaction.listOfReactants.speciesReference as Partial<XMLSpecies>[]).length != undefined) {
                        // type : array
                        (reaction.listOfReactants.speciesReference as Partial<XMLSpecies>[]).forEach((ref: Partial<XMLSpecies>) => {
                            reactants.push(ref.$.species);
                        });
                    } else if (reaction.listOfReactants.speciesReference != undefined) {
                        // type : object
                        reactants.push((reaction.listOfReactants.speciesReference as Partial<XMLSpecies>).$.species);
                    }
                    const products: string[] = [];
                    if (reaction.listOfProducts.speciesReference != undefined && (reaction.listOfProducts.speciesReference as Partial<XMLSpecies>[]).length != undefined) {
                        // type : array
                        (reaction.listOfProducts.speciesReference as Partial<XMLSpecies>[]).forEach((ref: Partial<XMLSpecies>) => {
                            products.push(ref.$.species);
                        });
                    } else if (reaction.listOfProducts.speciesReference != undefined) {
                        // type : object
                        products.push((reaction.listOfProducts.speciesReference as Partial<XMLSpecies>).$.species);
                    }

                    // add the reaction as a node
                    graph.graph.nodes[reactionId] = {
                        id: reactionId,
                        metadata: {
                            classes: ['reaction',classReversible],
                            position: {
                                x: getRandomInt(0, 100),
                                y: getRandomInt(0, 100)
                            }
                        },
                        label: reaction.$.name
                    };

                    // add the edges for the reaction and its reactants and products
                    reactants.forEach((reactant: string) => {
                        graph.graph.edges.push({
                            id: `${reactant}--${reactionId}`,
                            source: reactant,
                            target: reactionId,
                            metadata: {
                                classes: [classReversible]
                            }
                        });
                    });
                    products.forEach((product: string) => {
                        graph.graph.edges.push({
                            id: `${reactionId}--${product}`,
                            source: reactionId,
                            target: product,
                            metadata: {
                                classes: [classReversible]
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
