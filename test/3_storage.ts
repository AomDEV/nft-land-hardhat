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
        const global = Contract.getStorage()
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

    it(`Withdraw Token from Contract`, async function () {
        const deployer = Signer.getDeployer();
        const global = Signer.getGlobal();

        const beforeGlobal = await Contract.getToken().balanceOf(global.address);

        const contractBalance = await Contract.getToken().balanceOf(Contract.getStorage().address);
        const result = await Contract.getStorage().connect(deployer).withdrawToken();
        expect(result.hash.length).to.equal(66);

        const afterGlobal = await Contract.getToken().balanceOf(global.address);

        expect(afterGlobal).to.equal(
            contractBalance.add(beforeGlobal)
        );
    });

    /*
    it(`Details`, async function () {
        const buyer = Signer.getBuyer();
        const landByOwner = await Contract.getLand().getLandByOwner(buyer.address);
        const landByToken = await Contract.getLand().getLandByTokenId(TOKEN_IDS);

        const mapOwner = [];
        for(let i = 0; i < landByOwner[0].length; i++) mapOwner.push({
            found: landByOwner[0][i],
            data: {
                x: landByOwner[1][i].x,
                y: landByOwner[1][i].y,
                tokenId: landByOwner[1][i].tokenId
            }
        });
        const mapToken = [];
        for(let i = 0; i < landByToken[0].length; i++) mapToken.push({
            found: landByToken[0][i],
            zoneId: landByToken[1][i],
            data: {
                x: landByToken[2][i].x,
                y: landByToken[2][i].y,
                tokenId: landByToken[2][i].tokenId
            }
        });
        console.log(mapOwner, mapToken);
    });
    */
});