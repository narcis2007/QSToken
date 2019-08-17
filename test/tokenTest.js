'use strict';

const expectThrow = require('./expectThrow.js')
const timeTravel = require('./timeTravel');
const BigNumber = require('bignumber.js')
var QSToken = artifacts.require("QSToken");
var EthUtil = require('ethereumjs-util');
const Web3 = require("web3")

const myWeb3 = new Web3(web3.currentProvider) //Use the latest web3 version not the old one which is injected by default

const NAME = "QS";
const SYMBOL = "QS";
var DECIMALS = 8;
const SUPPLY = 100000000;


contract('QSToken', async (accounts) => {

    async function deployTokenContract() {
        let token = await QSToken.new();
        await token.setMintAgent(accounts[0], true);
        await token.mint(accounts[0], SUPPLY);

        return token;
    }

    describe('token', function () {

        it('should return the correct total supply after construction', async () => {
            let token = await deployTokenContract();
            let totalSupply = await token.totalSupply()
            assert.equal(totalSupply.toString(), SUPPLY)
        });

        it('should have the name', async function () {
            let token = await deployTokenContract();
            let name = await token.name()
            assert.equal(name, NAME, "wrong name")
        });

        it('should have the symbol', async function () {
            let token = await deployTokenContract();
            let symbol = await token.symbol()
            assert.equal(symbol, SYMBOL, "wrong symbol")
        });

        it('should have the right decimals', async function () {
            let token = await deployTokenContract();
            let decimals = await token.decimals()
            assert.equal(decimals, DECIMALS, "wrong decimals")
        });
    });

    describe('transfers', function () {

        it('should allow transfer() 100 units from accounts[0] to accounts[1]', async function () {
            let token = await deployTokenContract();

            let amount = 100

            // initial account[0] and account[1] balance
            let account0StartingBalance = await token.balanceOf(accounts[0])
            let account1StartingBalance = await token.balanceOf(accounts[1])

            // transfer amount from account[0] to account[1]
            await token.transfer(accounts[1], amount, {from: accounts[0]})

            // final account[0] and account[1] balance
            let account0EndingBalance = await token.balanceOf(accounts[0])
            let account1EndingBalance = await token.balanceOf(accounts[1])

            assert.equal(account0EndingBalance.toString(), new BigNumber(account0StartingBalance.toString()).sub(amount), "Balance of account 0 incorrect")
            assert.equal(account1EndingBalance.toString(), new BigNumber(account1StartingBalance.toString()).plus(amount), "Balance of account 1 incorrect")
        });

        it('should throw an error when trying to transfer more than a balance', async function () {
            let token = await deployTokenContract();

            let accountStartingBalance = await token.balanceOf(accounts[0]);
            let amount = accountStartingBalance + 1;
            await expectThrow(token.transfer(accounts[2], amount, {from: accounts[0]}));
        });

    });

    describe('allowance', function () {

        it('should return the correct allowance amount after approval', async function () {
            let token = await deployTokenContract();

            let amount = 100;

            //owner(account[0]) approves to account[1] to spend the amount
            await token.approve(accounts[1], amount);

            //checking the amount that an owner allowed to
            let allowance = await token.allowance(accounts[0], accounts[1]);
            assert.equal(allowance, amount, "The amount allowed is not equal!")

            //checking the amount to a not allowed account
            let non_allowance = await token.allowance(accounts[0], accounts[2]);
            assert.equal(non_allowance, 0, "The amount allowed is not equal!")
        });

        it('should allow transfer from allowed account', async function () {
            let token = await deployTokenContract();

            let amount = 100;

            let account0StartingBalance = await token.balanceOf(accounts[0]);
            let account1StartingBalance = await token.balanceOf(accounts[1]);
            let account2StartingBalance = await token.balanceOf(accounts[2]);
            assert.equal(account1StartingBalance, 0);
            assert.equal(account2StartingBalance, 0);

            //owner(account[0]) approves to account[1] to spend the amount
            await token.approve(accounts[1], amount);

            //account[1] orders a transfer from owner(account[0]) to account[1]
            await token.transferFrom(accounts[0], accounts[2], amount, {from: accounts[1]});
            let account0AfterTransferBalance = await token.balanceOf(accounts[0]);
            let account1AfterTransferBalance = await token.balanceOf(accounts[1]);
            let account2AfterTransferBalance = await token.balanceOf(accounts[2]);

            assert.equal(account0StartingBalance - amount, account0AfterTransferBalance);
            assert.equal(account1AfterTransferBalance, 0);
            assert.equal(amount, account2AfterTransferBalance)
        });

        it('should throw an error when trying to transfer more than allowed', async function () {
            let token = await deployTokenContract();
            let amount = 100;

            //owner(account[0]) approves to account[1] to spend the amount
            await token.approve(accounts[1], amount);

            let overflowed_amount = amount + 1;
            await expectThrow(token.transferFrom(accounts[0], accounts[2], overflowed_amount, {from: accounts[1]}));
        })

        it('should throw an error when trying to transfer from a not allowed account', async function () {
            let token = await deployTokenContract();
            let amount = 100;
            await expectThrow(token.transferFrom(accounts[0], accounts[2], amount, {from: accounts[1]}))
        })

        it('should be able to modify allowance', async function () {
            let token = await deployTokenContract();

            let amount = 100;

            //owner(account[0]) approves to account[1] to spend the amount
            await token.approve(accounts[1], amount);

            assert.equal(amount, await token.allowance(accounts[0], accounts[1]));

            await token.increaseApproval(accounts[1], 10);
            assert.equal(amount + 10, await token.allowance(accounts[0], accounts[1]));

            await token.decreaseApproval(accounts[1], 55);
            assert.equal(amount - 45, await token.allowance(accounts[0], accounts[1]));
            await token.decreaseApproval(accounts[1], 555);
            assert.equal(0, await token.allowance(accounts[0], accounts[1]));
        });

        it('should not approve twice', async function () {
            let token = await deployTokenContract();

            let amount = 100;

            //owner(account[0]) approves to account[1] to spend the amount
            await token.approve(accounts[1], amount);

            assert.equal(amount, await token.allowance(accounts[0], accounts[1]));

            await expectThrow(token.approve(accounts[1], amount + 1));
        });
    });

    describe('minting', function () {

        it('should throw an error when a non-minting agent is trying to mint', async function () {
            let token = await deployTokenContract();

            await expectThrow(token.mint(accounts[1], 1, {from: accounts[1]}));
            assert.equal(await token.totalSupply(), SUPPLY, "totalSupply is wrong")
        });
    });

    describe('burnable', function () {

        it('owner should be able to burn tokens', async function () {
            let token = await deployTokenContract();
            let balance = await token.balanceOf(accounts[0]);
            let totalSupply = await token.totalSupply();
            let burnedAmount = 100;
            let expectedTotalSupply = totalSupply - burnedAmount;
            let expectedBalance = balance - burnedAmount

            const {logs} = await token.burn(burnedAmount);
            let final_supply = await token.totalSupply();
            let final_balance = await token.balanceOf(accounts[0]);
            assert.equal(expectedTotalSupply, final_supply, "Supply after burn do not fit.");
            assert.equal(expectedBalance, final_balance, "Supply after burn do not fit.");

            const event = logs.find(e => e.event === 'Transfer');
            assert.notEqual(event, undefined, "Event Transfer not fired!")
        });

        it('Can not burn more tokens than your balance', async function () {
            let token = await deployTokenContract();
            let totalSupply = await token.totalSupply();
            let luckys_burnable_amount = totalSupply + 1;
            await expectThrow(token.burn(luckys_burnable_amount));
        });
    });


    describe('ownable', function () {

        it('should be able to change the owner', async function () {
            let token = await deployTokenContract();

            assert.equal(accounts[0], await token.owner());

            await token.transferOwnership(accounts[1]);

            assert.equal(accounts[1], await token.owner());

        });
    });

    describe('meta - transferWithProof - sender pays', function () {

        it(' should be able to relay multiple transfers', async function () {
            let token = await deployTokenContract();

            const metaSenderAddress = '0xBd2e9CaF03B81e96eE27AD354c579E1310415F39';
            const metaSenderPrivateKey = '43f2ee33c522046e80b67e96ceb84a05b60b9434b0ee2e3ae4b1311b9f5dcc46';
            const metaSenderBalance = SUPPLY / 2;
            await token.transfer(metaSenderAddress, metaSenderBalance, {from: accounts[0]});
            const amountSent = 100;
            const relayerFee = 10;
            var metaNonce = 0;

            var messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                    t: 'string',
                    v: 'transferWithProof'
                },
                {
                    t: 'address',
                    v: accounts[1]
                }, {t: 'uint', v: amountSent}, {t: 'uint', v: relayerFee}, {
                    t: 'uint',
                    v: metaNonce
                }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await token.transferWithProof(accounts[1], amountSent, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, metaSenderAddress, {from: accounts[3]});

            assert.equal(await token.balanceOf(accounts[3]), relayerFee);
            assert.equal(await token.balanceOf(accounts[1]), amountSent);
            assert.equal(await token.balanceOf(metaSenderAddress), metaSenderBalance - (amountSent + relayerFee));

            //-------------------------------------------------------------

            metaNonce++;

            messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                t: 'string',
                v: 'transferWithProof'
            }, {
                t: 'address',
                v: accounts[1]
            }, {t: 'uint', v: amountSent}, {t: 'uint', v: relayerFee}, {
                t: 'uint',
                v: metaNonce
            }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await token.transferWithProof(accounts[1], amountSent, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, metaSenderAddress, {from: accounts[3]});

            assert.equal(await token.balanceOf(accounts[3]), relayerFee * 2);
            assert.equal(await token.balanceOf(accounts[1]), amountSent * 2);
            assert.equal(await token.balanceOf(metaSenderAddress), metaSenderBalance - 2 * (amountSent + relayerFee));


        });


        it('should not be able to relay the same signature twice', async function () {
            let token = await deployTokenContract();

            const metaSenderAddress = '0xBd2e9CaF03B81e96eE27AD354c579E1310415F39';
            const metaSenderPrivateKey = '43f2ee33c522046e80b67e96ceb84a05b60b9434b0ee2e3ae4b1311b9f5dcc46';
            const metaSenderBalance = SUPPLY / 2;
            await token.transfer(metaSenderAddress, metaSenderBalance, {from: accounts[0]});
            const amountSent = 100;
            const relayerFee = 10;
            var metaNonce = 0;

            var messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                t: 'string',
                v: 'transferWithProof'
            }, {
                t: 'address',
                v: accounts[1]
            }, {t: 'uint', v: amountSent}, {t: 'uint', v: relayerFee}, {
                t: 'uint',
                v: metaNonce
            }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await token.transferWithProof(accounts[1], amountSent, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, metaSenderAddress, {from: accounts[3]});

            assert.equal(await token.balanceOf(accounts[3]), relayerFee);
            assert.equal(await token.balanceOf(accounts[1]), amountSent);
            assert.equal(await token.balanceOf(metaSenderAddress), metaSenderBalance - (amountSent + relayerFee));

            await expectThrow(token.transferWithProof(accounts[1], amountSent, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, metaSenderAddress, {from: accounts[3]}));

        });

        it('should not be able to relay a bad signature and perform a transfer', async function () {
            let token = await deployTokenContract();

            const metaSenderAddress = '0xBd2e9CaF03B81e96eE27AD354c579E1310415F39';
            const metaSenderPrivateKey = '43f2ee33c522046e80b67e96ceb84a05b60b9434b0ee2e3ae4b1311b9f5dcc46';
            const metaSenderBalance = SUPPLY / 2;
            await token.transfer(metaSenderAddress, metaSenderBalance, {from: accounts[0]});
            const amountSent = 100;
            const relayerFee = 10;
            var metaNonce = 0;

            var messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                t: 'string',
                v: 'transferWithProof'
            }, {
                t: 'address',
                v: accounts[1]
            }, {t: 'uint', v: amountSent}, {t: 'uint', v: relayerFee}, {
                t: 'uint',
                v: metaNonce
            }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await expectThrow(token.transferWithProof(accounts[1], amountSent, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex').replace("5", "4"), relayerFee, metaSenderAddress, {from: accounts[3]}));

        });

        it('should not be able to meta transfer more than a balance', async function () {
            let token = await deployTokenContract();

            const metaSenderAddress = '0xBd2e9CaF03B81e96eE27AD354c579E1310415F39';
            const metaSenderPrivateKey = '43f2ee33c522046e80b67e96ceb84a05b60b9434b0ee2e3ae4b1311b9f5dcc46';
            const metaSenderBalance = SUPPLY / 2;
            await token.transfer(metaSenderAddress, metaSenderBalance, {from: accounts[0]});
            const amountSent = 100;
            const relayerFee = 10;
            var metaNonce = 0;

            var messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                t: 'string',
                v: 'transferWithProof'
            }, {
                t: 'address',
                v: accounts[1]
            }, {t: 'uint', v: metaSenderBalance + 1}, {t: 'uint', v: relayerFee}, {
                t: 'uint',
                v: metaNonce
            }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await expectThrow(token.transferWithProof(accounts[1], metaSenderBalance + 1, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex').replace("5", "4"), relayerFee, metaSenderAddress, {from: accounts[3]}));

        });

    });

    //TODO: check with a bad meta sender address

    describe('meta - transferFromWithProof - sender pays', function () {

        it(' should be able to relay multiple transfers in limit', async function () {
            let token = await deployTokenContract();

            const metaSenderAddress = '0xBd2e9CaF03B81e96eE27AD354c579E1310415F39';
            const metaSenderPrivateKey = '43f2ee33c522046e80b67e96ceb84a05b60b9434b0ee2e3ae4b1311b9f5dcc46';
            const metaSenderBalance = SUPPLY / 2;
            await token.transfer(metaSenderAddress, metaSenderBalance, {from: accounts[0]});
            const initialAcc0Balance = metaSenderBalance;
            const amountApproved = 100;
            const relayerFee = 10;
            const amountSent = 50;
            var metaNonce = 0;

            await token.approve(metaSenderAddress, amountApproved, {from: accounts[0]});


            var messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                    t: 'string',
                    v: 'transferFromWithProof'
                }, {
                    t: 'address',
                    v: accounts[0]
                },
                {
                    t: 'address',
                    v: accounts[1]
                }, {t: 'uint', v: amountSent}, {t: 'uint', v: relayerFee}, {
                    t: 'uint',
                    v: metaNonce
                }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await token.transferFromWithProof(accounts[0], accounts[1], amountSent, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, metaSenderAddress, {from: accounts[3]});

            assert.equal(await token.balanceOf(accounts[3]), relayerFee);
            assert.equal(await token.balanceOf(accounts[1]), amountSent);
            assert.equal(await token.balanceOf(accounts[0]), initialAcc0Balance - amountSent);
            assert.equal(await token.balanceOf(metaSenderAddress), metaSenderBalance - relayerFee);

            //-------------------------------------------------------------

            metaNonce++;

            var messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                    t: 'string',
                    v: 'transferFromWithProof'
                }, {
                    t: 'address',
                    v: accounts[0]
                },
                {
                    t: 'address',
                    v: accounts[1]
                }, {t: 'uint', v: amountSent}, {t: 'uint', v: relayerFee}, {
                    t: 'uint',
                    v: metaNonce
                }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await token.transferFromWithProof(accounts[0], accounts[1], amountSent, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, metaSenderAddress, {from: accounts[3]});

            assert.equal(await token.balanceOf(accounts[3]), 2 * relayerFee);
            assert.equal(await token.balanceOf(accounts[1]), 2 * amountSent);
            assert.equal(await token.balanceOf(accounts[0]), initialAcc0Balance - 2 * amountSent);
            assert.equal(await token.balanceOf(metaSenderAddress), metaSenderBalance - 2 * relayerFee);

            metaNonce++;

            var messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                    t: 'string',
                    v: 'transferFromWithProof'
                }, {
                    t: 'address',
                    v: accounts[0]
                },
                {
                    t: 'address',
                    v: accounts[1]
                }, {t: 'uint', v: 1}, {t: 'uint', v: 1}, {
                    t: 'uint',
                    v: metaNonce
                }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await expectThrow(token.transferFromWithProof(accounts[0], accounts[1], amountSent, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, metaSenderAddress, {from: accounts[3]}));


        });

    });

    describe('meta - approveWithProof - sender pays', function () {

        it(' should be able to relay approvals', async function () {
            let token = await deployTokenContract();

            const metaSenderAddress = '0xBd2e9CaF03B81e96eE27AD354c579E1310415F39';
            const metaSenderPrivateKey = '43f2ee33c522046e80b67e96ceb84a05b60b9434b0ee2e3ae4b1311b9f5dcc46';

            const amountApproved = 50;
            const relayerFee = 10;
            var metaNonce = 0;

            const metaSenderBalance = SUPPLY / 2;
            await token.transfer(metaSenderAddress, metaSenderBalance, {from: accounts[0]});

            var messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                t: 'string',
                v: 'approveWithProof'
            }, {
                t: 'address',
                v: accounts[1]
            }, {t: 'uint', v: amountApproved}, {t: 'uint', v: relayerFee}, {
                t: 'uint',
                v: metaNonce
            }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await token.approveWithProof(accounts[1], amountApproved, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, metaSenderAddress, {from: accounts[3]});

            assert.equal(await token.balanceOf(accounts[3]), relayerFee);
            assert.equal(await token.balanceOf(metaSenderAddress), metaSenderBalance - relayerFee);
            assert.equal((await token.allowance(metaSenderAddress, accounts[1])).toNumber(), amountApproved);

        });

        it(' should not allow a different metaSender to be passed as parameter', async function () {
            let token = await deployTokenContract();

            const metaSenderAddress = '0xBd2e9CaF03B81e96eE27AD354c579E1310415F39';
            const metaSenderPrivateKey = '43f2ee33c522046e80b67e96ceb84a05b60b9434b0ee2e3ae4b1311b9f5dcc46';

            const amountApproved = 50;
            const relayerFee = 10;
            var metaNonce = 0;

            const metaSenderBalance = SUPPLY / 2;
            await token.transfer(metaSenderAddress, metaSenderBalance, {from: accounts[0]});

            var messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                t: 'string',
                v: 'approveWithProof'
            }, {
                t: 'address',
                v: accounts[1]
            }, {t: 'uint', v: amountApproved}, {t: 'uint', v: relayerFee}, {
                t: 'uint',
                v: metaNonce
            }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await expectThrow(token.approveWithProof(accounts[1], amountApproved, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, accounts[4], {from: accounts[3]}));
        });

    });

    describe('meta - increase/decreaseApprovalWithProof - sender pays', function () {

        it(' should be able to relay increse/decrease approvals', async function () {
            let token = await deployTokenContract();

            const metaSenderAddress = '0xBd2e9CaF03B81e96eE27AD354c579E1310415F39';
            const metaSenderPrivateKey = '43f2ee33c522046e80b67e96ceb84a05b60b9434b0ee2e3ae4b1311b9f5dcc46';

            const amountApproved = 50;
            const relayerFee = 10;
            var metaNonce = 0;

            const metaSenderBalance = SUPPLY / 2;
            await token.transfer(metaSenderAddress, metaSenderBalance, {from: accounts[0]});

            var messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                t: 'string',
                v: 'increaseApprovalWithProof'
            }, {
                t: 'address',
                v: accounts[1]
            }, {t: 'uint', v: amountApproved}, {t: 'uint', v: relayerFee}, {
                t: 'uint',
                v: metaNonce
            }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await token.increaseApprovalWithProof(accounts[1], amountApproved, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, metaSenderAddress, {from: accounts[3]});

            assert.equal(await token.balanceOf(accounts[3]), relayerFee);
            assert.equal(await token.balanceOf(metaSenderAddress), metaSenderBalance - relayerFee);
            assert.equal((await token.allowance(metaSenderAddress, accounts[1])).toNumber(), amountApproved);

            //--------------------------
            metaNonce++;
            const amountDecreased = 30;

            messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                t: 'string',
                v: 'decreaseApprovalWithProof'
            }, {
                t: 'address',
                v: accounts[1]
            }, {t: 'uint', v: amountDecreased}, {t: 'uint', v: relayerFee}, {
                t: 'uint',
                v: metaNonce
            }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await token.decreaseApprovalWithProof(accounts[1], amountDecreased, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, metaSenderAddress, {from: accounts[3]});

            assert.equal(await token.balanceOf(accounts[3]), 2 * relayerFee);
            assert.equal(await token.balanceOf(metaSenderAddress), metaSenderBalance - 2 * relayerFee);
            assert.equal((await token.allowance(metaSenderAddress, accounts[1])).toNumber(), amountApproved - amountDecreased);

            //--------------------------
            metaNonce++;

            messageToSign = EthUtil.toBuffer(myWeb3.utils.soliditySha3({
                t: 'string',
                v: 'decreaseApprovalWithProof'
            }, {
                t: 'address',
                v: accounts[1]
            }, {t: 'uint', v: amountDecreased}, {t: 'uint', v: relayerFee}, {
                t: 'uint',
                v: metaNonce
            }));

            var msgHash = EthUtil.hashPersonalMessage(new Buffer(messageToSign));
            var signature = EthUtil.ecsign(msgHash, new Buffer(metaSenderPrivateKey, 'hex'));

            await token.decreaseApprovalWithProof(accounts[1], amountDecreased, signature.v.toString(), '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex'), relayerFee, metaSenderAddress, {from: accounts[3]});

            assert.equal(await token.balanceOf(accounts[3]), 3 * relayerFee);
            assert.equal(await token.balanceOf(metaSenderAddress), metaSenderBalance - 3 * relayerFee);
            assert.equal((await token.allowance(metaSenderAddress, accounts[1])).toNumber(), 0);

        });
    });
})