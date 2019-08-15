pragma solidity ^0.5.0;

contract Meta {

    mapping(address => uint) metaNonce;
    mapping(address => uint) relayerFee; //TODO: each receiver to have a list of whitelisted relayers to avoid stealing through fees; think of a fee limit scheme too(max fee set by the receiver)


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
