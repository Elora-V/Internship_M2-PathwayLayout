import { expect, describe, test } from 'vitest';
import { sbml2json } from '../SBMLtoJSON';
import type { JSONGraphFormat } from "@/types/JSONGraphFormat";

describe('sbml2json.ts', () => {
    test('should return a JSON with 3 nodes', async () => {
        fetch('2_reac_1_metab.xml')
            .then(async (res) => {
                // DATA
                const sbmlString: string = await res.text();

                // FUNCTION
                const result: JSONGraphFormat = await sbml2json(sbmlString);
                const nodes = result.graph.nodes;

                // EXPECT
                expect(nodes).toEqual(3);
            })
            .catch(() => {
                console.log('could not fetch the test data !');
                return false;
            });
    });
    test('the nodes should have a position', async () => {
        fetch('2_reac_1_metab.xml')
            .then(async (res) => {
                // DATA
                const sbmlString: string = await res.text();

                // FUNCTION
                const result: JSONGraphFormat = await sbml2json(sbmlString);
                const nodes = result.graph.nodes;

                // EXPECT
                Object.values(nodes).forEach((node) => {
                    expect(node.metadata.position!.x).toBeDefined();
                    expect(node.metadata.position!.y).toBeDefined();
                });
            })
            .catch(() => {
                console.log('could not fetch the test data !');
                return false;
            });
    });
    test('there should 2 nodes for the reactions', async () => {
        fetch('2_reac_1_metab.xml')
            .then(async (res) => {
                // DATA
                const sbmlString: string = await res.text();

                // FUNCTION
                const result: JSONGraphFormat = await sbml2json(sbmlString);
                const nodes = result.graph.nodes;

                // EXPECT
                expect(nodes['erty']).toBeDefined();
                expect(nodes['erty'].metadata.classes).toContain('reaction');
                expect(nodes['r1']).toBeDefined();
                expect(nodes['r1'].metadata.classes).toContain('reaction');
            })
            .catch(() => {
                console.log('could not fetch the test data !');
                return false;
            });
    });
    test('there should 1 node for the metabolite', async () => {
        fetch('2_reac_1_metab.xml')
            .then(async (res) => {
                // DATA
                const sbmlString: string = await res.text();

                // FUNCTION
                const result: JSONGraphFormat = await sbml2json(sbmlString);
                const nodes = result.graph.nodes;

                // EXPECT
                expect(nodes['m1']).toBeDefined();
                expect(nodes['m1'].metadata.classes).toContain('metabolite');
            })
            .catch(() => {
                console.log('could not fetch the test data !');
                return false;
            });
    });
    test('should return a JSON with 1 edge', async () => {
        fetch('2_reac_1_metab.xml')
            .then(async (res) => {
                // DATA
                const sbmlString: string = await res.text();

                // FUNCTION
                const result: JSONGraphFormat = await sbml2json(sbmlString);
                const edges = result.graph.edges;

                // EXPECT
                expect(edges.length).toEqual(1);
            })
            .catch(() => {
                console.log('could not fetch the test data !');
                return false;
            });
    });
    test('the edge should be between "m1" and "r1"', async () => {
        fetch('2_reac_1_metab.xml')
            .then(async (res) => {
                // DATA
                const sbmlString: string = await res.text();

                // FUNCTION
                const result: JSONGraphFormat = await sbml2json(sbmlString);
                const edge = result.graph.edges[0];

                // EXPECT
                expect(edge.source).toEqual('m1');
                expect(edge.target).toEqual('r1');
            })
            .catch(() => {
                console.log('could not fetch the test data !');
                return false;
            });
    });
});
