# libraries
Web3 = require "web3"
BigNumber = require "bignumber.js"
IPFS = require "ipfs"
fs = require "fs"

# smart contract ABI
factoryABI = require "./factory_abi.json"

# smart contract addresses
FACTORY_ADDRESS = "0xb8a4fe08d055653480899dc57c69a643e704c576" # ropsten, change for mainnet

InsaneGas = 1e18

IsUsingLedger = false

#
# HELPERS
#

# loads web3 as a global variable
# returns success
loadWeb3 = (useLedger) ->
    IsUsingLedger = useLedger
    if useLedger
        # Use ledger-wallet-provider to load web3
        try
            ProviderEngine = require "web3-provider-engine"
            RpcSubprovider = require "web3-provider-engine/subproviders/rpc"
            LedgerWalletSubproviderFactory = (require "ledger-wallet-provider").default

            engine = new ProviderEngine
            window.web3 = new Web3 engine

            networkId = 3
            ledgerWalletSubProvider = await LedgerWalletSubproviderFactory(
                () -> networkId,
                "44'/60'/0'/0"
            )
            if !ledgerWalletSubProvider.isSupported
                return false
            engine.addProvider ledgerWalletSubProvider
            engine.addProvider new RpcSubprovider {
                rpcUrl: "https://mainnet.infura.io/v3/7a7dd3472294438eab040845d03c215c"
            }
            engine.start()
        catch e
            return false
    else
        # Use Metamask/other dApp browsers to load web3
        # Modern dapp browsers...
        if window.ethereum
            window.web3 = new Web3 ethereum
            try
                # Request account access if needed
                await ethereum.enable()
                # Acccounts now exposed
            catch error
                # User denied account access...

        # Legacy dapp browsers...
        else if window.web3
            window.web3 = new Web3 web3.currentProvider
            # Acccounts always exposed
        
        # Non-dapp browsers...
        else
            return false
    
    # set default account
    web3.eth.defaultAccount = (await web3.eth.getAccounts())[0]

    return true


# returns the IAO contract object
FactoryContract = () ->
    if !web3?
        return
    return new web3.eth.Contract factoryABI, FACTORY_ADDRESS


# call the factory contract to create
createICO = (_name, _symbol, _hardCap, _tokensPerDAI, _referralBonus, _beneficiary,
                txCallback, errCallback, confirmCallback) ->
    factory = FactoryContract()
    if factory?
        await factory.methods.createICO(
            _name, _symbol, BigNumber(_hardCap).integerValue(), BigNumber(_tokensPerDAI).integerValue(), BigNumber(_referralBonus).integerValue(), _beneficiary)
            .estimateGas({
                from: web3.eth.defaultAccount
                gas: InsaneGas
            }).then((estimatedGas) ->
                if estimatedGas == InsaneGas || !(estimatedGas?)
                    errCallback()
                    return
                
                factory.methods.createICO(
                    _name, _symbol, BigNumber(_hardCap).integerValue(), BigNumber(_tokensPerDAI).integerValue(), BigNumber(_referralBonus).integerValue(), _beneficiary)
                .send({
                    from: web3.eth.defaultAccount
                    gas: Math.ceil(estimatedGas * 1.5)
                    gasPrice: "#{1e10}"
                }).on("transactionHash", (txHash) ->
                    txCallback(txHash)
                    if IsUsingLedger
                        addresses = await factory.methods.createICO(
                            _name, _symbol, BigNumber(_hardCap).integerValue(), BigNumber(_tokensPerDAI).integerValue(), BigNumber(_referralBonus).integerValue(), _beneficiary)
                        .call({
                            from: web3.eth.defaultAccount
                            gas: Math.ceil(estimatedGas * 1.5)
                            gasPrice: "#{1e10}"
                        })
                        confirmCallback({
                            events: {
                                CreatedICO: {
                                    returnValues: {
                                        _tokenAddress: addresses._token
                                        _icoAddress: addresses._ico
                                    }
                                }
                            }
                        })
                ).on('receipt', confirmCallback)
            ).catch(errCallback)


# upload generated ICO interface to IPFS
uploadICOInterface = (token_name, token_symbol, token_address, ico_address,
                        token_price, referral_bonus, hard_cap, ico_description, logoURL, callback) ->
    ipfs = new IPFS()
    ipfs.once("ready", () ->
        content = {
            "texts": ["token_name", "token_symbol", "token_address", "ico_address", "token_price", "referral_bonus", "hard_cap", "ico_description"]
            "imgs": ["logo"]
            "token_name": token_name
            "token_symbol": token_symbol
            "token_address": token_address
            "ico_address": ico_address
            "token_price": token_price
            "referral_bonus": referral_bonus
            "hard_cap": hard_cap
            "logo": logoURL
            "ico_description": ico_description
        }
        results = await ipfs.files.add(Buffer.from(JSON.stringify(content)))
        callback(results[0].hash)
    )

window.loadWeb3 = loadWeb3
window.createICO = createICO
window.uploadICOInterface = uploadICOInterface
window.FACTORY_ADDRESS = FACTORY_ADDRESS