pragma solidity ^0.5.0;
import "../ERC20Token.sol";


contract BurnableToken is ERC20Token {

    /**
     * Burn extra tokens from a balance.
     *
     */
    function burn(uint burnAmount) public {
        balances[msg.sender] = safeSub(balances[msg.sender], burnAmount);
        totalSupply = safeSub(totalSupply, burnAmount);
        emit Transfer(msg.sender, address(0), burnAmount);
    }
}
