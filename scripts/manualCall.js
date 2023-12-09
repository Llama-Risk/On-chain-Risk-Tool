const { wallet, signer } = require("../connection.js");
const { abi, bytecode } = require("../artifacts/contracts/llamaRiskOracle.sol/llamaRiskOracle.json");
const { networks } = require("../network.js");
const { ContractFactory, utils } = require("ethers");
const ethers = require("ethers");

const NETWORK = "polygonMumbai";
const routerAddress = networks[NETWORK].functionsRouter;
const donIdBytes32 = utils.formatBytes32String(networks[NETWORK].donId);


const manualCall = async () => {
  const consumerAddress = "0xB5fA1913a3F6f94A75775C05e816F9b0881Bf580"
  const automatedFunctionsConsumer = new ethers.Contract(
    consumerAddress,
    abi,
    signer
  );
  const transaction = await automatedFunctionsConsumer.sendRequestCBOR()
  console.log(transaction)


};

manualCall().catch(err => {
    console.log("Error deploying the Consumer Contract ", err);
});