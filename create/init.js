const NO_WEB3_ERR = "You need a Web3-enabled browser, like Metamask, Brave, Status, and Cipher, in order to use \"Continue with Metamask\". Don't forget, you can always transfer Ether directly to iao.betokenfund.eth to participate in the IAO!";
const LEDGER_ERR = "We're having trouble connecting to your Ledger Wallet. Please make sure:\n• You are using Chrome or Brave on a desktop computer.\n• Your Ledger is properly plugged in.\n• You have logged into your Ledger.\n• You have launched the Ethereum App on your Ledger.\n• \"Browser Support\" has been enabled in the Ethereum App's settings.\n"
const TX_ERR = "It would seem that one of the following has happened:\n• You have insufficient funds\n• You have rejected the transaction\n• Something unexpected has happened\nPlease reject all transactions you see right now."
const WRONG_NETWORK_ERR = "Please switch to the Ethereum Main network."
const PRECISION = 1e18

$(document)
.ready(() => {
    // helpers
    var setFlowStep = (stepId) => {
        var steps = ['flow_start', 'flow_metamask_confirm', 'flow_ledger_confirm', 'flow_submitted', 'flow_confirmed', 'flow_error'];
        for (var i in steps) {
            $(`#${steps[i]}`).addClass('d-none');
        }
        $(`#${stepId}`).removeClass('d-none');
    };
    var showError = (msg) => {
        $('#error_msg').text(msg);
        setFlowStep('flow_error');
    };

    // init
    $('.receipientAddress').val(window.FACTORY_ADDRESS);

    // events
    $('.continue').on('click', (e) => {
        var hasSubmitted = false;

        const tokenName = $('#tokenName')[0].value;
        const tokenTicker = $('#tokenTicker')[0].value;
        const tokenSupply = +$('#tokenSupply')[0].value;
        const tokenPrice = +$('#tokenPrice')[0].value;
        const bonus = +$('#bonus')[0].value;
        const beneficiary = $('#beneficiary')[0].value;
        const urlLogo = $('#urlLogo')[0].value;
        const icoShortDesc = $('#icoShortDesc')[0].value;

        var sendTx = () => {
            var txCallback = (txHash) => {
                $('.tx_link').attr('href', `https://etherscan.io/tx/${txHash}`);
                setFlowStep('flow_submitted');
                hasSubmitted = true;
            };
            var errCallback = (err) => {
                console.log(err);
                if (!hasSubmitted) {
                    showError(TX_ERR);
                }
            };
            var confirmCallback = (receipt) => {
                // upload interface to IPFS
                const tokenAddress = receipt.events.CreatedICO.returnValues._tokenAddress;
                const icoAddress = receipt.events.CreatedICO.returnValues._icoAddress;
                window.uploadICOInterface(tokenName, tokenTicker, tokenAddress, icoAddress, tokenPrice, bonus, tokenSupply, icoShortDesc, urlLogo, (IPFSHash) => {
                    var ipfsURL = "https://betoken.fund/getrichquick/ico/?ipfs=" + IPFSHash;
                    $('#ipfsURL').val(ipfsURL);
                    $('.share_twitter').attr('href', $('.share_twitter').attr('href') + encodeURIComponent(ipfsURL));
                    $('#icoAddress').val(icoAddress);
                    $('#tokenAddress').val(tokenAddress);

                    setFlowStep('flow_confirmed');
                });
            };

            return window.createICO(tokenName, tokenTicker, tokenSupply, tokenPrice, bonus, beneficiary, txCallback, errCallback, confirmCallback);
        }

        // load web3
        if (e.currentTarget.id === 'metamask_btn') {
            window.loadWeb3(false).then((success) => {
                if (success) {
                    web3.eth.net.getId().then((netID) => {
                        if (netID === 3) {
                            // transition to confirm page
                            setFlowStep('flow_metamask_confirm');

                            sendTx();
                        } else {
                            showError(WRONG_NETWORK_ERR);
                        }
                    })
                } else {
                    showError(NO_WEB3_ERR);
                }
            });
        } else if (e.currentTarget.id === 'ledger_btn') {
            // transition to confirm page
            setFlowStep('flow_ledger_confirm');
            window.loadWeb3(true).then((success) => {
                if (success) {
                    sendTx();
                } else {
                    showError(LEDGER_ERR);
                }
            });
        }
    });
});