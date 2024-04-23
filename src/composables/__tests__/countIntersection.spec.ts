import { describe, expect, test } from "vitest";
import { countIntersection } from "../countIntersections";
import { Network } from "@metabohub/viz-core/src/types/Network";
import * as fs from 'fs';
import { readJsonGraph } from "../readJson";

function getNetworkFromUrl(url: string): Network {
    return (readJsonGraph(fs.readFileSync(url, { encoding: 'utf8', flag: 'r' }))).network;
}

describe("countIntersections.ts", () => {
    test("should return 1 when given a network with one crossing", async () => {
        // DATA
        const network: Network = getNetworkFromUrl('public/test_intersect/network_one_crossing.json');
        
        // TEST
        const result = countIntersection(network);

        // EXPECT
        expect(result).toEqual(1);
    });

    test("should return 2 when given a network with 2 crossings", () => {
        // DATA
        const network: Network = getNetworkFromUrl('public/test_intersect/network_two_crossings.json');

        // TEST
        const result = countIntersection(network);

        // EXPECT
        expect(result).toEqual(2);
    });
});
