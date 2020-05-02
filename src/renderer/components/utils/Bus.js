import Vue from 'vue'

const bus = new Vue()

export default {
  emit: (msgType, msg) => {
    console.info(msgType, msg)
    bus.$emit(msgType, msg)
  },
  on: (msgType, callback) => {
    bus.$on(msgType, callback)
  },
  EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY: 'updateImportDirectory',
  EVENT_UPDATE_DISPLAY_IMAGE: 'updateDisplayImage',
  WORKER_UPDATE_IMAGE_DIRECTORY: 'updateImageList',
  EVENT_SELECT_IMAGE: 'selectImage'
}
