require('dotenv').config()
const automatedFunctionsConsumerAbi = require("../artifacts/contracts/llamaRiskOracle.sol/llamaRiskOracle.json")["abi"];
const ethers = require("ethers");
const { ReturnType, decodeResult } = require("@chainlink/functions-toolkit");
require("@chainlink/env-enc").config();

const consumerAddress = "0xB5fA1913a3F6f94A75775C05e816F9b0881Bf580"; // REPLACE this with your Functions consumer address

const readLatest = async () => {
  // Initialize ethers  provider to read data from the contract
  const privateKey = process.env.PRIVATE_KEY; // fetch PRIVATE_KEY
  if (!privateKey)
    throw new Error(
      "private key not provided - check your environment variables"
    );

  const rpcUrl = process.env.RPC_URL; // fetch mumbai RPC URL

  if (!rpcUrl)
    throw new Error(`rpcUrl not provided  - check your environment variables`);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const automatedFunctionsConsumer = new ethers.Contract(
    consumerAddress,
    automatedFunctionsConsumerAbi,
    provider
  );

  const lastRequestId = await automatedFunctionsConsumer.s_lastRequestId();
  const lastResponse = await automatedFunctionsConsumer.s_lastResponse();
  const lastError = await automatedFunctionsConsumer.s_lastError();
  const isResponse = lastResponse !== "0x"; // empty bytes array is '0x'
  const isError = lastError !== "0x"; // empty bytes array is '0x'

  console.log("Last request ID is", lastRequestId);
  if (isError) {
    console.log(lastError);
    const bytes = ethers.utils.arrayify(lastError); // converts a hexadecimal string into a byte array
    const decodedString = ethers.utils.toUtf8String(bytes); // takes a byte array and converts it to a UTF-8 string
    console.log(`❌ Error : `, decodedString);
  } else if (isResponse) {
    const returnType = ReturnType.string;
    const decodedResponse = decodeResult(lastResponse, returnType);
    console.log(`✅ Decoded response to ${returnType}: `, decodedResponse);
  }
};

readLatest().catch((e) => {
  console.error(e);
  process.exit(1);
});