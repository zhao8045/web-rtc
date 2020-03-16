"use strict";

exports.__esModule = true;
exports.default = void 0;
var _default = {
  id: 1,
  zIndex: 2000,
  stack: [],
  lockCount: 0,
  plusKey: function plusKey(key) {
    return this[key]++;
  },

  get top() {
    return this.stack[this.stack.length - 1];
  }

};
exports.default = _default;