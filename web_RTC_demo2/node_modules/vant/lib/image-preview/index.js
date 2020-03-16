"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _vue = _interopRequireDefault(require("vue"));

var _ImagePreview = _interopRequireDefault(require("./ImagePreview"));

var _utils = require("../utils");

var instance;

var initInstance = function initInstance() {
  instance = new (_vue.default.extend(_ImagePreview.default))({
    el: document.createElement('div')
  });
  document.body.appendChild(instance.$el);
};

var ImagePreview = function ImagePreview(images, startPosition) {
  /* istanbul ignore if */
  if (_utils.isServer) {
    return;
  }

  if (!instance) {
    initInstance();
  }

  var config = Array.isArray(images) ? {
    images: images,
    startPosition: startPosition
  } : images;
  instance.value = true;
  instance.images = config.images;
  instance.showIndex = config.showIndex || true;
  instance.startPosition = config.startPosition || 0;
  instance.$on('input', function (show) {
    instance.value = show;

    if (!show) {
      instance.$off('input');
      config.onClose && config.onClose();
    }
  });
  return instance;
};

ImagePreview.install = function () {
  _vue.default.use(_ImagePreview.default);
};

var _default = ImagePreview;
exports.default = _default;