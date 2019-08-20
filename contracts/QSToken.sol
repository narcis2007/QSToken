pragma solidity ^0.5.0;

import "./ERC20Token/ERC20Token.sol";
import "./ERC20Token/Flavours/MintableToken.sol";
import "./ERC20Token/Flavours/BurnableToken.sol";
import "./MetaToken/SenderPaysMetaToken.sol";
import "./MetaToken/ReceiverPaysMetaToken.sol";

contract QSToken is MintableToken, BurnableToken, SenderPaysMetaToken, ReceiverPaysMetaToken { // TODO: add documentation for contracts/functions

    constructor() public {
        symbol = "QS";
        name = "QS";
        decimals = 8;
    }


}
