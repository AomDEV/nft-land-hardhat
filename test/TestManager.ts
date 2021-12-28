import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Land, Storage, Multiverse } from "../typechain";

const SignerClass = () => {
    let _deployer: SignerWithAddress;
    let _seller: SignerWithAddress;
    let _buyer: SignerWithAddress;
    let _global: SignerWithAddress;
    return {
        setDeployer: (address: SignerWithAddress) => _deployer = address,
        setSeller: (address: SignerWithAddress) => _seller = address,
        setBuyer: (address: SignerWithAddress) => _buyer = address,
        setGlobal: (address: SignerWithAddress) => _global = address,
        getDeployer: () => _deployer,
        getSeller: () => _seller,
        getBuyer: () => _buyer,
        getGlobal: () => _global,
        generateSigner: async () => {
            const signers = await ethers.getSigners();
            const index = Math.floor(Math.random() * (signers.length - 1));
            return signers[index];
        }
    }
}
const ContractClass = () => {
    let _token: Multiverse;
    let _land: Land;
    let _storage: Storage;
    return {
        getToken: () => _token,
        setToken: (token: Multiverse) => _token = token,
        getLand: () => _land,
        setLand: (land: Land) => _land = land,
        getStorage: () => _storage,
        setStorage: (storage: Storage) => _storage = storage,
    }
}

const Contract = ContractClass();
const Signer = SignerClass();
export {Signer, Contract};