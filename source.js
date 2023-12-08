console.log("script beginning")
const PRISMA_API_URL = 'https://api.prismamonitor.com'; // 
const RAILWAY_API = 'https://backend-production-a412.up.railway.app'; // Rik's backend

const apiResponse = await Functions.makeHttpRequest({
  url: RAILWAY_API,
  method: "GET"
})

// the amount at 2% impact is the following
// calculated using regression using log
const limit_from_impact = apiResponse.data.result.limit_from_impact
console.log(`2% impact:: ${limit_from_impact}`)

// volatility
const average_parkinson = apiResponse.data.result.volatility.average_parkinson
const latest_ema = apiResponse.data.result.volatility.latest_ema


async function getStabilityPoolSize() {
  try {
    const url = `${PRISMA_API_URL}/v1/mkusd/ethereum/holders`;
    const response = await Functions.makeHttpRequest({
        url: url,
        method: "GET"
    })
    const data = response.data;

    for (const holder of data.holders) {
      if (holder.label === 'Stability Pool') {
        return holder.value;
      }
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to retrieve stability pool value: ${error.message}`);
  }
}

const stabilityPoolSize = await getStabilityPoolSize()
console.log(`stabilityPoolSize:: ${stabilityPoolSize}`)

async function getMKUSDCirculatingSupply() {
  const url = `${PRISMA_API_URL}/v1/mkusd/ethereum/general`;
  try {
    const response = await Functions.makeHttpRequest({
        url: url,
        method: "GET"
    })
    const data = response.data;
    return data.info.supply;
  } catch (error) {
    throw new Error(`Error fetching supply data: ${error.message}`);
  }
}

const MKUSDCirculatingSupply = await getMKUSDCirculatingSupply()
console.log(`MKUSDCirculatingSupply ${MKUSDCirculatingSupply}`)

async function getStabilityPoolSizeShare() {
  try {
    const stabilityPoolSize = await getStabilityPoolSize();
    const circulatingSupply = await getMKUSDCirculatingSupply();

    if (circulatingSupply === 0) {
      throw new Error('Circulating supply is zero. Cannot divide by zero.');
    }

    const stabilityPoolSizeShare = stabilityPoolSize / circulatingSupply;
    return stabilityPoolSizeShare;
  } catch (error) {
    // throw new Error(`Error calculating stability pool size share: ${error.message}`);
    return apiResponse.data.result.stability_pool_share
  }
}

const stabilityPoolSizeShare = await getStabilityPoolSizeShare()
console.log(`stabilityPoolSizeShare :: ${stabilityPoolSizeShare}`)

async function getValueAtRiskAndRiskyTroves(ratio=1.5) {
  const url = `${PRISMA_API_URL}/v1/trove/ethereum/0xbf6883a03fd2fcfa1b9fc588ad6193b3c3178f8f/troves?items=10000&page=1&order_by=last_update&desc=true`;

  try {
    const response = await Functions.makeHttpRequest({
        url: url,
        method: "GET"
    })
    response.data; // Accessing response.data instead of response.json()

    const openTroves = response.data.troves.filter(trove => trove.status === 'Open' && trove.collateral_ratio < ratio);
    const sumCollateralUSD = openTroves.reduce((sum, trove) => sum + trove.collateral_usd, 0);

    return {
      "valueAtRisk": sumCollateralUSD,
      "openTrovesLength": openTroves.length,
    };
  } catch (error) {
    // throw new Error(`Error during API request: ${error.message}`);
    return {
      "valueAtRisk": apiResponse.data.result.value_at_risk,
      "openTrovesLength": apiResponse.data.result.troves_at_risk
    }
  }
}

const valueAtRiskAndRiskyTroves = await getValueAtRiskAndRiskyTroves()
console.log(`valueAtRisk:: ${valueAtRiskAndRiskyTroves.valueAtRisk}`)
console.log(`troves at risk:: ${valueAtRiskAndRiskyTroves.openTrovesLength}`)
