import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import {Contract, Signer} from "./TestManager"

describe("Environment", function () {
    const MAX_SPENDER = ethers.utils.parseEther(BigNumber.from(Number.MAX_SAFE_INTEGER - 1).toString());
    const TOKEN_AMOUNT = 100;
    it("Grant Roles", async function () {
        const market = Contract.getStorage();
        const deployer = Signer.getDeployer();
        const contractRole = await Contract.getLand().CONTRACT_ROLE();
        const grantRole = await Contract.getLand().connect(deployer).grantRole(
            contractRole,
            market.address
        );
        expect(grantRole.hash.length).to.equal(66);
    });

    it("Contract Approvement", async function () {
        const deployer = Signer.getDeployer();
        const buyer = Signer.getBuyer();
        const global = Signer.getGlobal();
        const storage = Contract.getStorage();
        const tokenApprove = await Contract.getToken().connect(buyer).approve(
            storage.address,
            MAX_SPENDER
        );
        const globalApprove = await Contract.getToken().connect(global).approve(
            storage.address,
            MAX_SPENDER
        );
        const selfApprove = await Contract.getToken().connect(buyer).approve(
            buyer.address,
            MAX_SPENDER
        );
        const tokenAllowance = await Contract.getToken().connect(buyer).allowance(
            buyer.address,
            storage.address
        );
        const allowanceGlobal = await Contract.getToken().connect(global).allowance(
            global.address,
            storage.address
        );
        const allowanceSelf = await Contract.getToken().connect(buyer).allowance(
            buyer.address,
            buyer.address
        );
        const landApprove = await Contract.getLand().connect(deployer).setApprovalForAll(
            Contract.getStorage().address,
            true
        );

        expect(globalApprove.hash.length).to.equal(66);
        expect(tokenApprove.hash.length).to.equal(66);
        expect(landApprove.hash.length).to.equal(66);
        expect(selfApprove.hash.length).to.equal(66);
        expect(allowanceSelf).to.equal(MAX_SPENDER);
        expect(tokenAllowance).to.equal(MAX_SPENDER);
        expect(allowanceGlobal).to.equal(MAX_SPENDER);
    });

    it("Set Storage Address", async function () {
        const deployer = Signer.getDeployer();
        const storage = Contract.getStorage();
        const result = await Contract.getLand().connect(deployer).setLandStorage(storage.address);
        
        expect(result.hash.length).to.equal(66);

        const getStorage = await Contract.getLand().connect(deployer)._landStorage();
        expect(storage.address.length).to.equal(42);
        expect(getStorage).to.equal(storage.address);
    });

    it("Set Global Wallet", async function () {
        const deployer = Signer.getDeployer();
        const globalWallet = Signer.getGlobal();
        const setGlobalWallet = await Contract.getStorage().connect(deployer).setWallet([globalWallet.address]);

        expect(setGlobalWallet.hash.length).to.equal(66);

        const getWallet = await Contract.getStorage().connect(deployer)._wallets(0);
        expect(getWallet).to.equal(globalWallet.address);
    });

    it(`Mint ${TOKEN_AMOUNT} token to Tester`, async function () {
        const ether = ethers.utils.parseEther(TOKEN_AMOUNT.toString());
        const deployer = Signer.getDeployer();
        const buyer = Signer.getBuyer();
        const seller = Signer.getSeller();
        const mintToDeployer = await Contract.getToken().connect(deployer).mint(deployer.address, ether);
        const mintToBuyer = await Contract.getToken().connect(deployer).mint(buyer.address, ether);
        const mintToSeller = await Contract.getToken().connect(deployer).mint(seller.address, ether);

        expect(mintToDeployer.hash.length).to.equal(66);
        expect(mintToBuyer.hash.length).to.equal(66);
        expect(mintToSeller.hash.length).to.equal(66);

        const deployerBalance = await Contract.getToken().balanceOf(deployer.address);
        const buyerBalance = await Contract.getToken().balanceOf(buyer.address);
        const sellerBalance = await Contract.getToken().balanceOf(seller.address);

        expect(deployerBalance).to.equal(ether);
        expect(buyerBalance).to.equal(ether);
        expect(sellerBalance).to.equal(ether);
    });
});