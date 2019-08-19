pragma solidity ^0.5.0;

import "../ERC20Token/ERC20Token.sol";

contract MetaToken is ERC20Token {

    mapping(address => uint) metaNonce; // TODO: decide if we want the transactions to be more "asynchronous" by having a mapping of uit=>bool instead of uint

    function approveWithProof(address _spender, uint _value, uint8 v, bytes32 r, bytes32 s, uint _relayerFee, address _metaSender) public returns (bool) {
        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked("approveWithProof", _spender, _value, _relayerFee, metaNonce[_metaSender]));
        require(metaSender == _metaSender);

        // To change the approve amount you first have to reduce the addresses`
        //  allowance to zero by calling `approve(_spender, 0)` if it is not
        //  already 0 to mitigate the race condition described here:
        //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        if ((_value != 0) && (allowed[metaSender][_spender] != 0)) revert();

        allowed[metaSender][_spender] = _value;
        emit Approval(metaSender, _spender, _value);

        _transfer(metaSender, msg.sender, _relayerFee);

        metaNonce[metaSender]++;
        return true;
    }

    function increaseApprovalWithProof(address _spender, uint _addedValue, uint8 v, bytes32 r, bytes32 s, uint _relayerFee, address _metaSender) public returns (bool) {
        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked("increaseApprovalWithProof", _spender, _addedValue, _relayerFee, metaNonce[_metaSender]));
        require(metaSender == _metaSender);

        allowed[metaSender][_spender] = safeAdd(allowed[metaSender][_spender], _addedValue);
        emit Approval(metaSender, _spender, allowed[metaSender][_spender]);

        _transfer(metaSender, msg.sender, _relayerFee);

        metaNonce[metaSender]++;
        return true;
    }

    function decreaseApprovalWithProof(address _spender, uint _subtractedValue, uint8 v, bytes32 r, bytes32 s, uint _relayerFee, address _metaSender) public returns (bool) {
        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked("decreaseApprovalWithProof", _spender, _subtractedValue, _relayerFee, metaNonce[_metaSender]));
        require(metaSender == _metaSender);

        uint oldValue = allowed[metaSender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[metaSender][_spender] = 0;
        } else {
            allowed[metaSender][_spender] = safeSub(oldValue, _subtractedValue);
        }
        emit Approval(metaSender, _spender, allowed[metaSender][_spender]);

        _transfer(metaSender, msg.sender, _relayerFee);

        metaNonce[metaSender]++;
        return true;
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

        address signatureAddress = ecrecover(hash, v, r, s);
        require(signatureAddress != address(0x0));

        return signatureAddress;
    }

    function getMetaNonce(address who) public returns (uint) {
        return metaNonce[who];
    }

}
