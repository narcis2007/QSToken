pragma solidity ^0.5.0;

import "./ERC20Token.sol";

contract BurnableToken is ERC20Token {

    /**
     * Burn extra tokens from a balance.
     *
     */
    function burn(uint burnAmount) public {
        address burner = msg.sender;
        balances[burner] = balances[burner] - burnAmount;
        totalSupply = totalSupply - burnAmount;
        emit Transfer(burner, address(0), burnAmount);
    }
}
