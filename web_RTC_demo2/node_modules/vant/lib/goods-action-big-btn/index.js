"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _create = _interopRequireDefault(require("../utils/create"));

var _button = _interopRequireDefault(require("../button"));

var _routerLink = _interopRequireDefault(require("../mixins/router-link"));

var _default = (0, _create.default)({
  render: function render() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c('van-button', {
      class: _vm.b(),
      attrs: {
        "tag": "a",
        "href": _vm.url,
        "type": _vm.primary ? 'primary' : 'default',
        "bottom-action": ""
      },
      on: {
        "click": _vm.onClick
      }
    }, [_vm._t("default", [_vm._v(_vm._s(_vm.text))])], 2);
  },
  name: 'goods-action-big-btn',
  mixins: [_routerLink.default],
  components: {
    VanButton: _button.default
  },
  props: {
    url: String,
    text: String,
    primary: Boolean
  },
  methods: {
    onClick: function onClick(event) {
      this.$emit('click', event);
      this.routerLink();
    }
  }
});

exports.default = _default;