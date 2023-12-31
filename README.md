# The DeFi Collateral Risk Circuit Breaker
## Chainlink Hackathon Project
![Untitled design(1)](https://github.com/Llama-Risk/On-chain-Risk-Tool/assets/51072084/78dadc65-cf3a-4475-a712-b8446ba3c813)

This project was built as part of the Chainlink Constellation Hackathon and showcases Chainlink Functions in combination with Chainlink Automation.

For demonstration purposes, this risk simulation tool is designed to work with Prisma Finance, a DeFi stablecoin protocol that is overcollateralized by ETH liquid staking derivatives. It acts as a circuit breaker to automatically trigger a pause on the protocol when a combination of collateral market conditions and protocol health is deemed to be unsafe. Our demo monitors the wstETH collateral and defines the trigger condition as:
- **Value at Risk (VaR)**: Total collateral value of troves with <150% collateral ratio
- **Price Impact**: wstETH swap quantity required to produce a 2% price impact
- If Price Impact > VaR AND the contract is not paused, setPaused(True)
- If Price Impact < VaR AND the contract is paused, setPaused(False)

The source code that will be executed by Chainlink Functions is in `./source.js`. This is the code that gets sent on-chain and then onto the Chainlink Decentralized Oracle Network for decentralized execution. It queries data from our [Railway API endpoint](https://backend-production-a412.up.railway.app), which filters and processes data from the [PrismaMonitor API](https://api.prismamonitor.com/feeds-docs#/) to produce the required VaR and Price Impact values. `Source.js` includes logic to determine if the trigger condition has been met.

The consumer contract that will send requests to Chainlink Functions is in `./contract/llamaRiskConsumerContract.sol`. This contract receives a bool that is stored on chain. We have a bot monitoring in the background for state change that triggers the TroveManager when an update has been made.

### Deployment Addresses (Polygon Mumbai)
- RISK_ORACLE_ADDRESS=[0xB5fA1913a3F6f94A75775C05e816F9b0881Bf580](https://mumbai.polygonscan.com/address/0xB5fA1913a3F6f94A75775C05e816F9b0881Bf580)
- TROVE_MANAGER_ADDRESS= [0x47B89C219ea37b8add3d9f3973cF6feD8319BC88](https://mumbai.polygonscan.com/address/0x47B89C219ea37b8add3d9f3973cF6feD8319BC88)

### Mock API
Try providing mock values and check the TroveManager [paused](https://mumbai.polygonscan.com/address/0x47B89C219ea37b8add3d9f3973cF6feD8319BC88#readContract#F1) state to see Chainlink Functions trigger state change
- Mock API: https://backend-production-a412.up.railway.app/mocking 
