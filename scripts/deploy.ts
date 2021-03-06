// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import dotenv from "dotenv";
import { BigNumber, Contract } from "ethers";
import { Land, Storage, Multiverse } from "../typechain";

dotenv.config();

type VerifyArgs = {
  name: string,
  address: string,
  args: string[]
}

type AutoDeploy = {
  title: string,
  contract: string,
  constructor: string[],
  class?: Contract,
  address?: string,
}

async function main() {
  const MAX_SPENDER = ethers.utils.parseEther(BigNumber.from(Number.MAX_SAFE_INTEGER - 1).toString());
  const SEPARATOR = ("==============================================");
  const MINI_SEPARATOR = "----------------------------------------------";

  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled

  const verifyTasks: VerifyArgs[] = [];
  /*const autoDeploys: AutoDeploy[] = [
    {title: "Token", contract: "Multiverse", constructor: []},
    {title: "Land", contract: "Land", constructor: []},
    {title: "Storage", contract: "Storage", constructor: [
      "%Land%",
      "%Multiverse%"
    ]}
  ];*/
  const autoDeploys: AutoDeploy[] = [
    {title: "Land", contract: "Land", constructor: []},
    {title: "Storage", contract: "Storage", constructor: [
      "%Land%",
      "0x0B52539f093a0f5564F889A45d17b1ab576D15DC"
    ]}
  ]

  let startTime = Date.now();

  function getContractAddress(contract: string): string { 
    const address = autoDeploys.find(x=>x.contract === contract)?.address;
    if(typeof address === "undefined") return "";
    return address;
  }

  function getContract(contract: string): Contract | null {
    const find = autoDeploys.find(x=>x.contract === contract);
    if(typeof find === "undefined") return null;
    return find.class || null;
  }

  // We get the contract to deploy
  console.log(SEPARATOR);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const regex = /^\%([a-zA-Z0-9]*)\%$/i;
  for(let i = 0; i < autoDeploys.length; i++){
    try{
      const autoDeploy = autoDeploys[i];
      const contract = await ethers.getContractFactory(autoDeploy.contract);
      const constructor = autoDeploy.constructor.map(x => {
        if(regex.test(x)) return getContractAddress(x.replace(/\%/g, ""))
        return x;
      });
      const deployed = await contract.connect(deployer).deploy(
        ...constructor
      );

      await deployed.deployed();
      verifyTasks.push({name: "Token",address:deployed.address,args:constructor});
      autoDeploys[i].address = deployed.address;
      autoDeploys[i].class = deployed;
      
      console.log(`${autoDeploy.title} deployed to:`, deployed.address);
    } catch (ex) {
      console.log(`Deploy failed.`);
      return;
    }
  }

  console.log(SEPARATOR);

  // Environment
  const land = getContract("Land") as Land;
  const storage = getContract("Storage") as Storage;
  const token = getContract("Multiverse") as Multiverse;
  const contractRole = await land?.CONTRACT_ROLE();

  if(land && storage){
    const grantRole = await land?.grantRole(contractRole, storage?.address);
    console.log(`[Land][grantRole] Transaction Hash :`, grantRole.hash);

    const setLandStorage = await land?.setLandStorage(storage?.address);
    console.log(`[Land][setLandStorage] Transaction Hash :`, setLandStorage.hash);

    const landApprove = await land?.setApprovalForAll(storage?.address, true);
    console.log(`[Land][setApprovalForAll] Transaction Hash :`, landApprove.hash);
  }
  if(token && storage){
    const tokenApprove = await token?.approve(storage?.address, MAX_SPENDER);
    console.log(`[Token][approve] Transaction Hash :`, tokenApprove.hash);
  }
  if(storage){
    const setWallet = await storage?.setWallet([deployer.address]);
    console.log(`[Storage][setWallet] Transaction Hash :`, setWallet.hash);
  }

  // Batch grant role
  const addresses = ["0x782beb424B3B39a73f48738c19CAE82Ff9F17549","0x7E1494B8EcF5d853829aD0e0D710340aFd217C98"];
  const role = [
    {
      function: land?.grantRole, 
      roles: [
        await land?.DEFAULT_ADMIN_ROLE(), 
        await land?.DEV_ROLE(),
        await land?.MINTER_ROLE(),
        await land?.MANAGER_ROLE()
      ]
    },
    {
      function: storage?.grantRole,
      roles: [
        await storage?.DEFAULT_ADMIN_ROLE(),
        await storage?.DEV_ROLE(),
        await storage?.MANAGER_ROLE()
      ]
    }
  ];
  for(let a = 0; a < addresses.length; a++){
    let rolesCount = 0;
    for(let f = 0; f < role.length; f++){
      for(let r = 0; r < role[f].roles.length; r++){
        await role[f].function(role[f].roles[r], addresses[a]);
        rolesCount++;
      }
    }
    console.log(`Granted ${rolesCount} roles to : ${addresses[a]}`);
  }

  console.log(SEPARATOR);

  for(const args of verifyTasks){
    try{
      await hre.run("verify:verify", {
        address: args.address,
        constructorArguments: args.args
      });
      console.log(`Contract: ${args.name} verified`);
    } catch (ex) {
      console.log(`Contract: ${args.name} failure`);
    }
    console.log(MINI_SEPARATOR);
  }

  let elapseTime = Date.now() - startTime;
  console.log(`Done. (${elapseTime.toLocaleString()}ms)`);
  console.log(SEPARATOR);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
