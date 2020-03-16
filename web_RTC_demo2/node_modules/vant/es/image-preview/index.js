import Vue from 'vue';
import VueImagePreview from './ImagePreview';
import { isServer } from '../utils';
var instance;

var initInstance = function initInstance() {
  instance = new (Vue.extend(VueImagePreview))({
    el: document.createElement('div')
  });
  document.body.appendChild(instance.$el);
};

var ImagePreview = function ImagePreview(images, startPosition) {
  /* istanbul ignore if */
  if (isServer) {
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
  Vue.use(VueImagePreview);
};

export default ImagePreview;