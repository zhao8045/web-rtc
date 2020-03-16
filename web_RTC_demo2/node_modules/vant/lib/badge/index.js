"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _info = _interopRequireDefault(require("../info"));

var _create = _interopRequireDefault(require("../utils/create"));

var _components;

var _default = (0, _create.default)({
  render: function render() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c('a', {
      class: [_vm.b({
        select: _vm.select
      }), 'van-hairline'],
      attrs: {
        "href": _vm.url
      },
      on: {
        "click": _vm.onClick
      }
    }, [_c('van-info', {
      class: _vm.b('info'),
      attrs: {
        "info": _vm.info
      }
    }), _vm._v("\n  " + _vm._s(_vm.title) + "\n")], 1);
  },
  name: 'badge',
  components: (_components = {}, _components[_info.default.name] = _info.default, _components),
  props: {
    url: String,
    info: [String, Number],
    title: String
  },
  beforeCreate: function beforeCreate() {
    this.$parent.badges.push(this);
  },
  computed: {
    select: function select() {
      return this.$parent.badges.indexOf(this) === this.$parent.activeKey;
    }
  },
  methods: {
    onClick: function onClick() {
      this.$emit('click', this.$parent.badges.indexOf(this));
    }
  }
});

exports.default = _default;