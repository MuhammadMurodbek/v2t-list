"use strict";
exports.__esModule = true;
var getQueryStringValue = (function () {
    function getQueryStringValue() {
    }
    getQueryStringValue.prototype.decodeToken = function (key) {
        return decodeURIComponent(window.location.href.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[.+*]/g, '\\$&') + "(?:\\=([^&]*))?)?.*$", 'i'), '$1'));
    };
    ;
    return getQueryStringValue;
}());
exports["default"] = getQueryStringValue;
;
//# sourceMappingURL=getQueryStringValue.js.map