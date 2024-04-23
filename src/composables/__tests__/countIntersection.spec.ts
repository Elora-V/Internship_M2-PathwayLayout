import { describe, expect, test } from "vitest";
import { countIntersection } from "../countIntersections";
import { importNetworkFromURL } from "../importNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";
import { ref } from "vue";
import * as fs from 'fs';
import { readJsonGraph } from "../readJson";

describe("countIntersections.ts", () => {
    test("should return 1 when given a network with one crossing", async () => {
        // DATA
        const data = readJsonGraph(fs.readFileSync('public/test_intersect/network_one_crossing.json', { encoding: 'utf8', flag: 'r' }));
        const network: Network = data.network;
        
        // TEST
        const result = countIntersection(network);

        // EXPECT
        expect(result).toEqual(1);
    });
});
