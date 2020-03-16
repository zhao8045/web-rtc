var _components;

import Info from '../info';
import create from '../utils/create';
export default create({
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
  components: (_components = {}, _components[Info.name] = Info, _components),
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