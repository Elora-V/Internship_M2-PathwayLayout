import { describe, expect, test } from "vitest";
import { countIsolatedNodes } from "../countIsolatedNodes";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { Node } from "@metabohub/viz-core/src/types/Node";

describe("countIsolatedNodes.ts", () => {
    test("should return 0 when all the nodes have >= 1 link", () => {
        // DATA
        const nodes: { [key: string]: Node } = {
            "a": {
                id: "a",
                x: 0,
                y: 0
            },
            "b": {
                id: "b",
                x: 0,
                y: 0
            }
        };
        const network: Network = {
            id: "test",
            nodes: nodes,
            links: [
                {   
                    id: "a_b",
                    source: nodes.a,
                    target: nodes.b
                }
            ]
        };

        // FUNCTION
        const result = countIsolatedNodes(network);

        // EXPECT
        expect(result).toEqual(0);
    });
    test("should return 1 when there is an isolated node", () => {
        // DATA
        const nodes: { [key: string]: Node } = {
            "a": {
                id: "a",
                x: 0,
                y: 0
            },
            "b": {
                id: "b",
                x: 0,
                y: 0
            },
            "c": {
                id: "c",
                x: 0,
                y: 0
            }
        };
        const network: Network = {
            id: "test",
            nodes: nodes,
            links: [
                {   
                    id: "a_b",
                    source: nodes.a,
                    target: nodes.b
                }
            ]
        };

        // FUNCTION
        const result = countIsolatedNodes(network);

        // EXPECT
        expect(result).toEqual(1);
    });
});