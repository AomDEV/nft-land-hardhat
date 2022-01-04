import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import {Contract, Signer} from "./TestManager"

describe("Land", function () {
    const ZONE_ID = 0;
    const WIDTH = 10;
    const HEIGHT = 10;
    it("Configuration", async function () {
        const ipfs = "ipfs://bafybeibnsoufr2renqzsh347nrx54wcubt5lgkeivez63xvivplfwhtpym/metadata.json";
        const zoneMetadata = await Contract.getLand().createZone(ZONE_ID, ipfs);
        expect(zoneMetadata.hash.length).to.equal(66);
    });
    it(`Premint Land NFT (${WIDTH}x${HEIGHT})`, async function () {
        // Tile: 10x10
        const premints: Promise<ContractTransaction>[] = [];
        for(let x = 0; x <= WIDTH; x++){
            for(let y = 0; y <= HEIGHT; y++){
                premints.push(
                    Contract.getLand().premint(ZONE_ID, x, y, 0)
                )
            }
        }
        const results = await Promise.all(premints);
        for(const result of results) expect(result.hash.length).to.equal(66);
    });
    it("Verify Land", async function () {
        const land = await Contract.getLand().getLands(ZONE_ID);
        const size = (WIDTH + 1) * (HEIGHT + 1);
        const randomIndex = Math.floor( Math.random() * (land.length - 1) );
        const randomLand = land[randomIndex];
        expect(land.length).to.equal(size);
        // Land Verification
        expect(randomLand.owner).to.equal("0x0000000000000000000000000000000000000000");
        expect(randomLand.landType).to.equal(0);
        expect(randomLand.tokenId.toNumber()).to.greaterThanOrEqual(0);
        expect(randomLand.x.toNumber()).to.greaterThanOrEqual(0);
        expect(randomLand.y.toNumber()).to.greaterThanOrEqual(0);
        // Zone
        const zones = await Contract.getLand().getZoneList();
        expect(zones.length).to.equal(1);
        if(zones.length > 0) expect(zones[0].toNumber()).to.equal(0);
    });
});