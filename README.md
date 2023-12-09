# The DeFi Collateral Risk Circuit Breaker
## Chainlink Hackathon Project
![Untitled design(1)](https://github.com/Llama-Risk/On-chain-Risk-Tool/assets/51072084/78dadc65-cf3a-4475-a712-b8446ba3c813)

This project was built as part of the Chainlink Constellation Hackathon and showcases Chainlink Functions in combination with Chainlink Automation.

For demonstration purposes, this risk simulation tool is designed to work with Prisma Finance, a DeFi stablecoin protocol that is overcollateralized by ETH liquid staking derivatives. It acts as a circuit breaker to automatically trigger a pause on the protocol when a combination of collateral market conditions and protocol health is deemed to be unsafe. Our demo monitors the wstETH collateral and defines the trigger condition as:
- **Value at Risk (VaR)**: Total collateral value of troves with <150% collateral ratio
- **Price Impact**: wstETH swap quantity required to produce a 2% price impact
- If Price Impact > VaR AND the contract is not paused, setPaused(True)
- If Price Impact < VaR AND the contract is paused, setPaused(False)

The source code that will be executed by Chainlink Functions is in `./source.js`. This is the code that gets sent on-chain and then onto the Chainlink Decentralized Oracle Network for decentralized execution.
