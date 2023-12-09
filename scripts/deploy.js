const { wallet, signer } = require("../connection.js");
const { abi, bytecode } = require("../artifacts/contracts/llamaRiskOracle.sol/llamaRiskOracle.json");
const { networks } = require("../network.js");
const { ContractFactory, utils } = require("ethers");

const NETWORK = "polygonMumbai";
const routerAddress = networks[NETWORK].functionsRouter;
const donIdBytes32 = utils.formatBytes32String(networks[NETWORK].donId);


const deployFunctionsConsumerContract = async () => {
  const contractFactory = new ContractFactory(abi, bytecode, wallet);

  const functionsConsumerContract = await contractFactory
    .connect(signer)
    .deploy(routerAddress);

  await functionsConsumerContract.deployed();
  console.log(`\nDeployed consumer at address ${functionsConsumerContract.address}`)
  return functionsConsumerContract.address
};

deployFunctionsConsumerContract().catch(err => {
    console.log("Error deploying the Consumer Contract ", err);
});