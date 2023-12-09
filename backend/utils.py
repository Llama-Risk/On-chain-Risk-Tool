# proof of concept
import requests
from web3 import Web3
from web3.middleware import geth_poa_middleware
import pandas as pd
import numpy as np
from scipy.optimize import curve_fit
from dotenv import load_dotenv
import os

# section 1
# stability pool size

def get_stability_pool_size():
    '''
        returns: stability pool size in dollar
    '''
    try:
        url = "https://api.prismamonitor.com/v1/mkusd/ethereum/holders"
        response = requests.get(url)
        data = response.json()
        for holder in data["holders"]:
            if holder["label"] == "Stability Pool":
                return holder["value"]
        return None
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to retrieve stability pool value: {e}")

def get_mkUSD_circulating_supply_web3():
    abi = [
        {
            "constant": True,
            "inputs": [],
            "name": "circulatingSupply",
            "outputs": [{"name": "", "type": "uint256"}],
            "payable": False,
            "stateMutability": "view",
            "type": "function",
        },
        {
            "constant": True,
            "inputs": [],
            "name": "decimals",
            "outputs": [{"name": "", "type": "uint8"}],
            "payable": False,
            "stateMutability": "view",
            "type": "function",
        },
    ]

    w3 =  Web3(Web3.HTTPProvider('https://eth.llamarpc.com'))
    mkusd = w3.eth.contract(address='0x4591DBfF62656E7859Afe5e45f6f47D3669fBB28', abi=abi)
    circulating_supply = mkusd.functions.circulatingSupply().call()
    decimals = mkusd.functions.decimals().call()
    circulating_supply = circulating_supply / (10 ** decimals)

    return circulating_supply

def get_mkUSD_circulating_supply():
    url = "https://api.prismamonitor.com/v1/mkusd/ethereum/general"
    try:
        response = requests.get(url)
        data = response.json()
        return data["info"]["supply"]
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error fetching supply data: {e}")

def get_stability_pool_size_share():
    return get_stability_pool_size()/get_mkUSD_circulating_supply()

def get_limit_from_impact():
    # Make the API call to get the impact data
    response = requests.get('https://api.prismamonitor.com/v1/collateral/ethereum/0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0/impact')
    data = response.json()["impact"]
    # Extract features and target
    features = np.array([entry["impact"] for entry in data])
    target = np.array([entry["amount"] for entry in data])

    # Define the logarithmic function
    def log_function(x, a, b):
        return a * np.log(b * x + 1)

    # Fit the logarithmic function to the data using curve_fit
    params, covariance = curve_fit(log_function, features, target)
    return log_function(2.0, *params)

from datetime import datetime

def get_daily_ohlc():
    # Coingecko API URL
    api_url = "https://api.coingecko.com/api/v3/coins/wrapped-steth/ohlc"

    # Parameters for the API request
    params = {
        'vs_currency': 'usd',
        'days': '30'
    }

    # Make the API request
    response = requests.get(api_url, params=params)

    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        # Parse the JSON response
        ohlc_data = response.json()

        # Find the index of the first data point starting from 00:00
        start_index = next((i for i, ohlc in enumerate(ohlc_data) if datetime.utcfromtimestamp(ohlc[0] / 1000.0).strftime('%H:%M') == '00:00'), None)

        if start_index is not None:
            # Group and process the OHLC data starting from the found index
            grouped_ohlc = []
            for i in range(start_index, len(ohlc_data), 6):
                daily_data = ohlc_data[i:i+6]
                timestamp = datetime.utcfromtimestamp(daily_data[0][0] / 1000.0).strftime('%Y-%m-%d')
                open_price = daily_data[0][1]
                high_price = max(ohlc[2] for ohlc in daily_data)
                low_price = min(ohlc[3] for ohlc in daily_data)
                close_price = daily_data[-1][4]

                grouped_ohlc.append({
                    'timestamp': timestamp,
                    'open': open_price,
                    'high': high_price,
                    'low': low_price,
                    'close': close_price
                })

            # Display the grouped OHLC data
            # for data_point in grouped_ohlc:
            #     print(f"{data_point['timestamp']} - Open: {data_point['open']}, High: {data_point['high']}, Low: {data_point['low']}, Close: {data_point['close']}")
            # print(len(grouped_ohlc))
            return grouped_ohlc

        else:
            print("No data starting from 00:00 found.")

    else:
        # Print an error message if the request was not successful
        print(f"Error: {response.status_code}, {response.text}")

def calculate_ema(data, window=30):
    df = pd.DataFrame(data)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df.set_index('timestamp', inplace=True)

    # Calculate EMA
    ema = df['close'].ewm(span=window, adjust=False).mean()
    last_date_ema = ema.iloc[-1]


    return ema, last_date_ema

def calculate_parkinson_volatility(data):
    # Extract high and low prices from the OHLC data
    highs = np.array([d['high'] for d in data])
    lows = np.array([d['low'] for d in data])

    # Calculate logarithm of the ratio of high to low prices
    log_ratio = np.log(highs / lows)

    # Calculate Parkinson volatility
    parkinson_volatility = np.sqrt((1 / (4 * np.log(2))) * np.square(log_ratio))

    # Calculate the average Parkinson volatility
    average_volatility = np.mean(parkinson_volatility)

    return parkinson_volatility, average_volatility

def get_value_at_risk():
    api_url = "https://api.prismamonitor.com/v1/trove/ethereum/0xbf6883a03fd2fcfa1b9fc588ad6193b3c3178f8f/troves?items=10000&page=1&order_by=last_update&desc=true"

    try:
        response = requests.get(api_url)
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx and 5xx status codes)
        
        data = response.json()
        open_troves = [trove for trove in data['troves'] if trove['status'] == 'Open' and trove['collateral_ratio'] < 1.5]
        sum_collateral_usd = sum(trove['collateral_usd'] for trove in open_troves)
        return sum_collateral_usd, len(open_troves)
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error during API request: {e}")

def result():
    result_dict = {}
    # section 1
    result_dict["stability_pool_share"] = get_stability_pool_size_share()
    # section 2
    #result_dict["average_impact_percent"] = get_average_impact()
    trove_data = get_value_at_risk()
    result_dict["value_at_risk"] = trove_data[0]
    result_dict["troves_at_risk"] = trove_data[1]

    result_dict["limit_from_impact"] = get_limit_from_impact()
    
    # section 3
    thirty_days_daily_ohlc = get_daily_ohlc()
    result_dict["volatility"] = {}
    result_dict["volatility"]["latest_ema"] = calculate_ema(thirty_days_daily_ohlc)[1]
    result_dict["volatility"]["average_parkinson"] = calculate_parkinson_volatility(thirty_days_daily_ohlc)[1]

    return result_dict

def get_risk_oracle_data():
    # just to be careful
    load_dotenv()

    w3 = Web3(Web3.HTTPProvider(os.getenv("RPC_URL")))

    risk_oracle_abi = [
        {
            "constant": True,
            "inputs": [],
            "name": "s_lastResponse",
            "outputs": [{"name": "", "type": "bytes"}],
            "payable": False,
            "stateMutability": "view",
            "type": "function",
        }
    ]

    risk_oracle_address = os.getenv("RISK_ORACLE_ADDRESS")
    # Create a contract object
    contract = w3.eth.contract(address=risk_oracle_address, abi=risk_oracle_abi)

    # Read the value of the public variable
    s_lastResponse_value = contract.functions.s_lastResponse().call().decode()
    return s_lastResponse_value == "true"

def update_paused_status(new_paused_status):
    load_dotenv()
    # Retrieve contract address and RPC URL from environment variables
    contract_address = os.getenv("TROVE_MANAGER_ADDRESS")
    rpc_url = os.getenv("RPC_URL")

    # Connect to the Ethereum node
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)

    # Enable PoA middleware (if using a Proof of Authority network like Rinkeby)
    # w3.middleware_stack.inject(geth_poa_middleware, layer=0)

    # Set the default account using the private key
    private_key = os.getenv("PRIVATE_KEY")  # Replace with your actual private key
    account = w3.eth.account.from_key(private_key)

    # Replace with the contract ABI
    contract_abi = [
        {
            "constant": True,
            "inputs": [],
            "name": "paused",
            "outputs": [{"name": "", "type": "bool"}],
            "payable": False,
            "stateMutability": "view",
            "type": "function",
        },
        {
            "constant": False,
            "inputs": [{"name": "_paused", "type": "bool"}],
            "name": "setPaused",
            "outputs": [],
            "payable": False,
            "stateMutability": "nonpayable",
            "type": "function",
        },
    ]  # Replace with the actual ABI

    # Create a contract object
    contract = w3.eth.contract(address=contract_address, abi=contract_abi)

    # Get the current paused status
    current_paused = contract.functions.paused().call()

    if current_paused != new_paused_status:
        nonce = w3.eth.get_transaction_count(account.address)
        # If the new paused status is different, call setPaused
        transaction_data = contract.functions.setPaused(new_paused_status).build_transaction({
            "nonce": nonce
        })

        # Sign the transaction
        signed_transaction = w3.eth.account.sign_transaction(transaction_data, private_key)

        # Send the signed transaction
        transaction_hash = w3.eth.send_raw_transaction(signed_transaction.rawTransaction)

        print(f"Transaction Hash: {transaction_hash}")
    else:
        print("No update needed, the contract is already in the desired state.")

def bot():
    print("Bot iteration has begun")
    update_paused_status(get_risk_oracle_data())
    print("Bot iteration has ended")