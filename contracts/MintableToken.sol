pragma solidity ^0.5.0;

import "./ERC20Token.sol";
import "./Ownable.sol";


/**
 * A token that can increase its supply by another contract.
 *
 * Only mint agents, contracts whitelisted by owner, can mint new tokens.
 *
 */
contract MintableToken is ERC20Token, Ownable {

    /** List of agents that are allowed to create new tokens */
    mapping(address => bool) public mintAgents;

    event MintingAgentChanged(address addr, bool state);


    /**
     * Create new tokens and allocate them to an address..
     *
     * Only callably by a crowdsale contract (mint agent).
     */
    function mint(address receiver, uint amount) onlyMintAgent public {
        totalSupply = totalSupply + amount;
        balances[receiver] = balances[receiver] + amount;

        // This will make the mint transaction apper in EtherScan.io
        emit Transfer(address(0x0), receiver, amount);
    }


    /**
     * Owner can allow a crowdsale contract to mint new tokens.
     */
    function setMintAgent(address addr, bool state) onlyOwner public {
        mintAgents[addr] = state;
        emit MintingAgentChanged(addr, state);
    }

    modifier onlyMintAgent() {
        // Only crowdsale contracts are allowed to mint new tokens
        if (!mintAgents[msg.sender]) {
            revert();
        }
        _;
    }

}
