import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import {Contract, Signer} from "./TestManager"

describe("Storage", function () {
    const ZONE_ID = 0;
    const MAX_BUY = Math.floor(Math.random() * 10);
    const BEFORE_BALANCE = ethers.utils.parseEther("100");
    const TOKEN_IDS: BigNumber[] = [];
    it(`Randomly buy land`, async function () {
        const buyer = Signer.getBuyer();
        const global = Signer.getGlobal();
        const getLandDetail = await Contract.getLand().getLands(ZONE_ID);
        const randomIndex = Math.floor( Math.random() * (getLandDetail.length - 1) ) - MAX_BUY;
        for(let i = 0; i < MAX_BUY; i++) {
            expect(getLandDetail.length).to.greaterThanOrEqual(randomIndex + i + 1);
            if(getLandDetail.length < randomIndex + i + 1) break;
            expect(typeof getLandDetail[randomIndex+i].tokenId).not.equal("undefined");
            if(typeof getLandDetail[randomIndex + i].tokenId === "undefined") break;
            TOKEN_IDS.push(
                getLandDetail[randomIndex + i].tokenId
            );
        }
        const beforeGlobal = await Contract.getToken().balanceOf(global.address);

        const buy = await Contract.getStorage().connect(buyer).batchPurchase(TOKEN_IDS);
        expect(buy.hash.length).to.equal(66);

        const rawPrice = await Contract.getStorage()._pricePerBlock();
        const totalPrice = rawPrice.mul(TOKEN_IDS.length);
        const balanceOf = await Contract.getToken().balanceOf(buyer.address);
        expect(BEFORE_BALANCE.sub( totalPrice )).to.equal(balanceOf);
        const afterGlobal = await Contract.getToken().balanceOf(global.address);
        expect(beforeGlobal.add(totalPrice)).to.equal(afterGlobal);
    });

    it(`Ownership`, async function () {
        const buyer = Signer.getBuyer();
        for(const tokenId of TOKEN_IDS) {
            const owner = await Contract.getLand().connect(buyer.address).ownerOf(tokenId);
            expect(owner).to.equal(buyer.address, "ความเป็นเจ้าของไม่ถูกต้อง");
        }
    });
});