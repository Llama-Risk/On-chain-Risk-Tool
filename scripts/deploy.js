const { wallet, signer } = require("../connection.js");
const { abi, bytecode } = require("../artifacts/contracts/llamaRiskAutomatedConsumerContract.sol/llamaRiskAutomatedConsumerContract.json");
const troveManagerJSON = require("../artifacts/contracts/TroveManager.sol/TroveManager.json")
const { networks } = require("../network.js");
const { ContractFactory, utils } = require("ethers");

const NETWORK = "polygonMumbai";
const routerAddress = networks[NETWORK].functionsRouter;
const donIdBytes32 = utils.formatBytes32String(networks[NETWORK].donId);

const deployTroveManager = async () => {
  const contractFactory = new ContractFactory(troveManagerJSON.abi, troveManagerJSON.bytecode, wallet);

  const functionsConsumerContract = await contractFactory
    .connect(signer)
    .deploy();

  await functionsConsumerContract.deployed();
  console.log(`\nDeployed troveManager at address ${functionsConsumerContract.address}`)
  return functionsConsumerContract.address
};


const deployFunctionsConsumerContract = async (troveManagerAddress) => {
  console.log(`troveManager address is ${troveManagerAddress}`)
  const contractFactory = new ContractFactory(abi, bytecode, wallet);

  const functionsConsumerContract = await contractFactory
    .connect(signer)
    .deploy(routerAddress, troveManagerAddress);

  await functionsConsumerContract.deployed();
  console.log(`\nDeployed consumer at address ${functionsConsumerContract.address}`)
  return functionsConsumerContract.address
};

deployTroveManager().then(
    (troveManagerAddress) => {
        deployFunctionsConsumerContract(troveManagerAddress).catch(err => {
            console.log("Error deploying the Consumer Contract ", err);
        });
    }
)
