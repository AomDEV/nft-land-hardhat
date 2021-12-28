import { expect } from "chai";
import { ethers } from "hardhat";
import {Contract, Signer} from "./TestManager"

describe("Deployment", function () {
    it("Generate Address", async function () {
        const deployer = await Signer.generateSigner();
        const buyer = await Signer.generateSigner();
        const seller = await Signer.generateSigner();
        const global = await Signer.generateSigner();

        Signer.setDeployer(deployer);
        Signer.setBuyer(buyer);
        Signer.setSeller(seller);
        Signer.setGlobal(global);

        expect(Signer.getDeployer().address).to.not.equal(Signer.getBuyer().address);
        expect(Signer.getDeployer().address).to.not.equal(Signer.getSeller().address);
        expect(Signer.getBuyer().address).to.not.equal(Signer.getSeller().address);
        expect(Signer.getDeployer().address).to.not.equal(Signer.getGlobal().address);

        expect(Signer.getDeployer().address.length).to.equal(42);
        expect(Signer.getBuyer().address.length).to.equal(42);
        expect(Signer.getSeller().address.length).to.equal(42);
        expect(Signer.getGlobal().address.length).to.equal(42);
    });

    it("ERC20 Token", async function () {
        const Token = await ethers.getContractFactory("Multiverse");
        const token = await Token.connect(Signer.getDeployer()).deploy();
        await token.deployed();

        expect(token.address.length).to.equal(42);
        Contract.setToken(token);
    });

    it("ERC721 Contract", async function () {
        const Land = await ethers.getContractFactory("Land");
        const land = await Land.connect(Signer.getDeployer()).deploy();
        await land.deployed();

        expect(land.address.length).to.equal(42);
        Contract.setLand(land);
    });

    it("Storage Contract", async function () {
        const Storage = await ethers.getContractFactory("Storage");
        const storage = await Storage.connect(Signer.getDeployer()).deploy(
            Contract.getLand().address,
            Contract.getToken().address
        );
        await storage.deployed();

        expect(storage.address.length).to.equal(42);
        Contract.setStorage(storage);
    });
});
