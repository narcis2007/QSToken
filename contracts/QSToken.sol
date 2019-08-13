pragma solidity ^0.5.0;

import "./SafeMath.sol";
import "./Ownable.sol";
import "./IERC20.sol";
import "./ERC20Token.sol";
import "./MintableToken.sol";
import "./BurnableToken.sol";





contract Meta {

    mapping(address => uint) metaNonce;
    mapping(address => uint) relayerFee;

    function setRelayerFee(uint fee) public {
        relayerFee[msg.sender] = fee;
    }

    function getRelayerFee(address who) public view returns (uint) {
        return relayerFee[who];
    }

    function getAddressFromSignature(uint8 v, bytes32 r, bytes32 s, bytes memory argsEncoded) public pure returns (address) {

        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (281): 0 < s < secp256k1n ÷ 2 + 1, and for v in (282): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert();
        }

        if (v != 27 && v != 28) {
            revert();
        }

        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(argsEncoded)));

        return ecrecover(hash, v, r, s);
    }

}

contract MetaRPToken is ERC20Token, Meta {// Receiver pays relayer fee


    function transferWithProof(address _to, uint256 _value, uint8 v, bytes32 r, bytes32 s, address _metaSender) public returns (bool ok) {

        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked(_to, _value, relayerFee[msg.sender], metaNonce[_metaSender]));

        require(metaSender != address(0x0));
        require(metaSender == _metaSender);

    }

    //    function transferFromWithProof(address _from, address _to, uint _value, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }
    //
    //    function approveWithProof(address _spender, uint _value, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }
    //
    //    function increaseApprovalWithProof(address _spender, uint _addedValue, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }
    //
    //    function decreaseApprovalWithProof(address _spender, uint _subtractedValue, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }

}

contract MetaSPToken is ERC20Token, Meta {// Sender pays relayer fee


    //TODO: split the contract in meta, meta token receiver pays/meta token sender pays/ subscription meta token
    function transferWithProof(address _to, uint256 _value, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {

    }

    //    function transferFromWithProof(address _from, address _to, uint _value, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }
    //
    //    function approveWithProof(address _spender, uint _value, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }
    //
    //    function increaseApprovalWithProof(address _spender, uint _addedValue, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }
    //
    //    function decreaseApprovalWithProof(address _spender, uint _subtractedValue, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }

}

contract MetaRSPToken is ERC20Token, Meta {//Receiver pays relayer fee through subscription

}

contract QSToken is MintableToken, BurnableToken, MetaRPToken, MetaSPToken { // TODO: add documentation for contracts/functions

    constructor() public {
        symbol = "QS";
        name = "QS";
        decimals = 8;
    }


}
