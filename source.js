const axios = require('axios');

// Define the base API URL for Prisma Monitor and the Railway API
const PRISMA_API_URL = 'https://api.prismamonitor.com/feeds-docs'; // 
const RAILWAY_API = 'https://backend-production-a412.up.railway.app'; // Rik's backend

// Function to fetch troves under a specific collateral ratio
async function fetchTrovesUnderCR(chain, crThreshold) {
    const endpoint = `${RAILWAY_API}/v1/trove/${chain}/troves?crThreshold=${crThreshold}`; // example - by using backend, Rik correct me here

    try {
        const response = await axios.get(endpoint);
        const troves = response.data.troves;
        const totalVaR = troves.reduce((sum, trove) => sum + trove.collateralUSD, 0);
        const troveCount = troves.length;

        console.log('Total Protocol VaR:', totalVaR, 'USD');
        console.log('Number of Troves under', crThreshold, '% CR:', troveCount);

        return troves;
    } catch (error) {
        console.error('Error fetching troves:', error);
        return [];
    }
}

// Function to calculate VaR (Value at Risk) for each collateral pool
async function calculatePoolVaR(chain, crThreshold, pools) {
    const troves = await fetchTrovesUnderCR(chain, crThreshold);
    const totalCollateral = troves.reduce((sum, trove) => sum + trove.collateralUSD, 0);
    const troveCount = troves.length;

    console.log('Total VaR:', totalCollateral, 'USD');
    console.log('Number of Troves under 150% CR:', troveCount);

    const poolVaRs = {};

    pools.forEach(pool => {
        const poolTroves = troves.filter(trove => trove.pool === pool);
        const poolVaR = poolTroves.reduce((sum, trove) => sum + trove.collateralUSD, 0);
        poolVaRs[pool] = poolVaR;
    });

    return poolVaRs;
}

// Function to get trade amount for a 2% price impact
async function getTradeAmountForPriceImpact(chain, collateral) {
    const endpoint = `https://api.prismamonitor.com/v1/collateral/ethereum${collateral}/impact`;

    try {
        const response = await axios.get(endpoint);
        const impacts = response.data.impact;
        const impactData = impacts.find(imp => imp.impact === 0.02);
        return impactData ? impactData.amount : 0;
    } catch (error) {
        console.error('Error fetching trade amount for price impact:', error);
        return 0;
    }
}

// Example usage
const chain = 'ethereum';
const crThreshold = 150;
const pools = ['wstETH', 'rETH', 'cbETH', 'sfrxETH'];

calculatePoolVaR(chain, crThreshold, pools).then(poolVaRs => {
    console.log('VaR for each pool:', poolVaRs);

    // Calculate trade amount for 2% price impact for each pool
    pools.forEach(pool => {
        getTradeAmountForPriceImpact(chain, pool).then(tradeAmount => {
            console.log(`Trade amount for 2% price impact in ${pool}:`, tradeAmount);
        });
    });
});
