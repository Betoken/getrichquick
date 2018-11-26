// Generated by CoffeeScript 2.3.0
(function() {
  // libraries
  var BigNumber, FACTORY_ADDRESS, FactoryContract, IPFS, InsaneGas, Web3, createICO, factoryABI, fs, loadWeb3, uploadICOInterface;

  Web3 = require("web3");

  BigNumber = require("bignumber.js");

  IPFS = require("ipfs");

  fs = require("fs");

  // smart contract ABI
  factoryABI = require("./factory_abi.json");

  // smart contract addresses
  FACTORY_ADDRESS = "0x353c7dc9297a8885e02bc24ace9e56338e6ee6b2"; // ropsten, change for mainnet

  InsaneGas = 1e18;

  
  // HELPERS

  // loads web3 as a global variable
  // returns success
  loadWeb3 = async function(useLedger, icoAddress) {
    var IAO_ADDRESS, LedgerWalletSubproviderFactory, ProviderEngine, RpcSubprovider, e, engine, error, ledgerWalletSubProvider, networkId;
    IAO_ADDRESS = icoAddress;
    if (useLedger) {
      try {
        // Use ledger-wallet-provider to load web3
        ProviderEngine = require("web3-provider-engine");
        RpcSubprovider = require("web3-provider-engine/subproviders/rpc");
        LedgerWalletSubproviderFactory = (require("ledger-wallet-provider")).default;
        engine = new ProviderEngine;
        window.web3 = new Web3(engine);
        networkId = 1;
        ledgerWalletSubProvider = (await LedgerWalletSubproviderFactory(function() {
          return networkId;
        }, "44'/60'/0'/0"));
        if (!ledgerWalletSubProvider.isSupported) {
          return false;
        }
        engine.addProvider(ledgerWalletSubProvider);
        engine.addProvider(new RpcSubprovider({
          rpcUrl: "https://ropsten.infura.io/v3/7a7dd3472294438eab040845d03c215c"
        }));
        engine.start();
      } catch (error1) {
        e = error1;
        return false;
      }
    } else {
      // Use Metamask/other dApp browsers to load web3
      // Modern dapp browsers...
      if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        try {
          // Request account access if needed
          await ethereum.enable();
        } catch (error1) {
          // Acccounts now exposed
          error = error1;
        }
      // User denied account access...

      // Legacy dapp browsers...
      } else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider);
      } else {
        // Acccounts always exposed

        // Non-dapp browsers...
        return false;
      }
    }
    
    // set default account
    web3.eth.defaultAccount = ((await web3.eth.getAccounts()))[0];
    return true;
  };

  // returns the IAO contract object
  FactoryContract = function() {
    if (typeof web3 === "undefined" || web3 === null) {
      return;
    }
    return new web3.eth.Contract(factoryABI, FACTORY_ADDRESS);
  };

  // call the factory contract to create
  createICO = async function(_name, _symbol, _hardCap, _tokensPerDAI, _referralBonus, _beneficiary, txCallback, errCallback, confirmCallback) {
    var factory;
    factory = FactoryContract();
    if (factory != null) {
      return (await factory.methods.createICO(_name, _symbol, _hardCap, _tokensPerDAI, _referralBonus, _beneficiary).estimateGas({
        from: web3.eth.defaultAccount,
        gas: InsaneGas
      }).then(function(estimatedGas) {
        if (estimatedGas === InsaneGas || !(estimatedGas != null)) {
          errCallback();
          return;
        }
        return factory.methods.createICO(_name, _symbol, _hardCap, _tokensPerDAI, _referralBonus, _beneficiary).send({
          from: web3.eth.defaultAccount,
          gas: Math.ceil(estimatedGas * 1.5),
          gasPrice: `${1e10}`
        }).on("transactionHash", txCallback).on('receipt', confirmCallback);
      }).catch(errCallback));
    }
  };

  // upload generated ICO interface to IPFS
  uploadICOInterface = function(token_name, token_symbol, token_address, ico_address, token_price, referral_bonus, hard_cap, ico_description, logo) {
    var file;
    file = fs.readFileSync("./ico_interface/index.html");
    return console.log(file);
  };

  uploadICOInterface();

}).call(this);
