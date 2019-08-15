pragma solidity ^0.5.0;

/**
 * Math operations with safety checks
 */
contract SafeMath {
    function safeMul(uint a, uint b) internal pure returns (uint) {
        uint c = a * b;
        assertThat(a == 0 || c / a == b);
        return c;
    }

    function safeDiv(uint a, uint b) internal pure returns (uint) {
        assertThat(b > 0);
        uint c = a / b;
        assertThat(a == b * c + a % b);
        return c;
    }

    function safeSub(uint a, uint b) internal pure returns (uint) {
        assertThat(b <= a);
        return a - b;
    }

    function safeAdd(uint a, uint b) internal pure returns (uint) {
        uint c = a + b;
        assertThat(c >= a && c >= b);
        return c;
    }

    function assertThat(bool assertion) internal pure {
        if (!assertion) {
            revert();
        }
    }
}