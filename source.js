const RAILWAY_API = 'https://backend-production-a412.up.railway.app'; // Rik's backend

const apiResponse = await Functions.makeHttpRequest({
  url: RAILWAY_API,
  method: "GET"
})

// the amount at 2% impact is the following
// calculated using regression using log
const limit_from_impact = apiResponse.data.result.limit_from_impact
console.log(`2% impact:: ${limit_from_impact}`)

const value_at_risk = apiResponse.data.result.value_at_risk
console.log(`value at risk: ${value_at_risk}`)

let result

if (value_at_risk <= limit_from_impact) {
  result = false
  return Functions.encodeString(result.toString())
} else {
  result = true
  return Functions.encodeString(result.toString())
}