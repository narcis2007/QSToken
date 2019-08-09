'use strict';

const expectThrow = require('./expectThrow.js')
const timeTravel = require('./timeTravel');
const BigNumber = require('bignumber.js')
var QSToken = artifacts.require("QSToken");

const NAME = "";
const SYMBOL = "";
var DECIMALS = 8;
const SUPPLY = 1000000000;
const TOTAL_SUPPLY_WITH_DECIMALS = new BigNumber(SUPPLY).mul(new BigNumber('10').pow(DECIMALS));

async function deployTokenContract() {
    return await QSToken.new()
}

contract('QSToken', async (accounts) => {


    describe('token', function () {

        it('should return the correct total supply after construction', async () => {
            let token = await deployTokenContract();
            let totalSupply = await token.totalSupply()
            assert.equal(totalSupply.toString(), TOTAL_SUPPLY_WITH_DECIMALS.toString())
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

    describe('pausable', function () {

        it('should not be able to transfer tokens when paused', async function () {
            let token = await deployTokenContract();
            let amount = 100;

            //owner(account[0]) approves to account[1] to spend the amount
            await token.approve(accounts[1], amount);

            await token.pause();

            await expectThrow(token.transfer(accounts[2], amount, {from: accounts[0]}));

            await expectThrow(token.transferFrom(accounts[0], accounts[2], amount, {from: accounts[1]}))

            await token.unpause();

            await token.transfer(accounts[2], amount, {from: accounts[0]});

            await token.transferFrom(accounts[0], accounts[2], amount, {from: accounts[1]}); //acc1 transfers from acc0 to acc2

        });

        it('should be able to transfer tokens when paused and whitelisted', async function () {
            let token = await deployTokenContract();
            let amount = 10;

            //owner(account[0]) approves to account[1] to spend the amount
            await token.approve(accounts[1], amount);

            await token.whitelistForTransfer(accounts[0], true);

            await token.pause();

            await token.transfer(accounts[2], amount / 2, {from: accounts[0]});

            await expectThrow(token.transfer(accounts[1], amount / 2, {from: accounts[2]}));

            await token.unpause();

            await token.transfer(accounts[2], amount, {from: accounts[0]});

            await token.transferFrom(accounts[0], accounts[2], amount, {from: accounts[1]}); //acc1 transfers from acc0 to acc2


        });
    });

    describe('ownable', function () {

        it('should be able to change the owner', async function () {
            let token = await deployTokenContract();

            assert.equal(accounts[0], await token.owner());

            await token.transferOwnership(accounts[1]);

            assert.equal(accounts[1], await token.owner());

            await expectThrow(token.pause({from: accounts[0]}));

        });
    });

});