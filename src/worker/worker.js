import JString from '../public/String'
// import CV from '../public/CV'
// import { JImage } from './Image'
// import { CategoryArray } from './Category'
import ElementUI from 'element-ui'
import 'element-theme-dark'
import Vue from 'vue'
import App from './App'
import storage from '../public/Kernel'
import { ImageService } from './service/ImageService'
import { reply2Renderer, ReplyType } from './transfer'
import { IFileImpl, Message } from '../public/civet'
import { MessagePipeline } from './MessageTransfer'

const pipeline = new MessagePipeline(200, new Map())
// pipeline.regist('test', (id, data) => {
//   console.info('111')
// })

// 尽早打开主窗口
const { ipcRenderer } = require('electron')

// ready()
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.prototype.$ipcRenderer = ipcRenderer
window.eventBus = new Vue()

/* splash */
new Vue({
  components: { App },
  template: '<App/>'
}).$mount('#app')

Array.prototype.remove = function (val) {
  const index = this.indexOf(val)
  if (index > -1) {
    this.splice(index, 1)
  }
}

const isStart = false
function updateStatus(status) {
  if (isStart === false) {
    window.eventBus.$emit('status', status)
  }
}
// your background code here
const fs = require('fs')

// let bakDir
// // console.info(configPath, '............', userDir)
// // 递归创建目录 同步方法
// function mkdirsSync(dirname) {
//   if (fs.existsSync(dirname)) {
//     return true
//   } else {
//     const path = require('path')
//     if (mkdirsSync(path.dirname(dirname))) {
//       fs.mkdirSync(dirname)
//       return true
//     }
//   }
// }

// function initHardLinkDir(resourcName) {
//   const config = cvtConfig.getConfig()
//   for (let resource of config.resources) {
//     if (resourcName === resource.name) {
//       bakDir = resource.linkdir
//       if (!fs.existsSync(bakDir)) {
//         console.info('mkdir: ', bakDir)
//         mkdirsSync(bakDir)
//       }
//       break
//     }
//   }
// }

async function readImages(fullpath) {
  const info = fs.statSync(fullpath)
  if (info.isDirectory()) {
    readDir(fullpath)
  } else {
    // if (bakDir === undefined) {
    //   const config = cvtConfig.getConfig()
    //   console.info('--------2----------', config)
    //   initHardLinkDir(config.app.default)
    // }
    const service = new ImageService()
    const file = await service.read(fullpath)
    console.info('readImages', file)
    reply2Renderer(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, [file.toJson()])
  }
}

let totalFiles = 0
let progressLoad = 0
function readDir(path) {
  fs.readdir(path, async function(err, menu) {
    if (err) return
    // console.info(menu)
    totalFiles += menu.length
    for (const item of menu) {
      await readImages(JString.joinPath(path, item))
    }
    reply2Renderer(ReplyType.REPLY_FILES_LOAD_COUNT, { count: menu.length, total: totalFiles })
    progressLoad += menu.length
    if (progressLoad === totalFiles) {
      totalFiles = 0
      progressLoad = 0
    }
  })
}

const messageProcessor = {
  addImagesByDirectory: readDir,
  addImagesByPaths: (data) => {
    for (const fullpath of data) {
      readImages(fullpath)
    }
  },
  getImagesInfo: (data) => {
    updateStatus('reading files')
    let imagesIndex = []
    if (data === undefined) {
      // 全部图片信息
      const imagesSnap = storage.getFilesSnap()
      for (const imgID in imagesSnap) {
        imagesIndex.push(imgID)
      }
    } else {
      imagesIndex = data
    }
    const imgs = storage.getFilesInfo(imagesIndex)
    console.info('getImagesInfo', imgs)
    const images = []
    for (const img of imgs) {
      images.push(new IFileImpl(img))
    }
    const msg = new Message()
    console.info('---++++0---', data)
    console.info('008899:', msg)
    return {type: ReplyType.REPLY_IMAGES_INFO, data: images}
    // reply2Renderer(ReplyType.REPLY_IMAGES_INFO, images)
  },
  getFilesSnap: (data) => {
    // 全部图片信息
    const imagesSnap = storage.getFilesSnap()
    return {type: ReplyType.REPLY_FILES_SNAP, data: imagesSnap}
    // reply2Renderer(ReplyType.REPLY_FILES_SNAP, imagesSnap)
  },
  getImageInfo: (imageID) => {
    const img = storage.getFilesInfo([imageID])
    // console.info('getImagesInfo', img)
    const image = new IFileImpl(img[0])
    // reply2Renderer(ReplyType.REPLY_IMAGE_INFO, image)
    return {type: ReplyType.REPLY_IMAGE_INFO, data: image}
  },
  setTag: (data) => {
    console.info(data)
    storage.setTags(data.id, data.tag)
  },
  removeFiles: (filesID) => {
    console.info('removeFiles:', filesID)
    storage.removeFiles(filesID)
  },
  removeTag: (data) => {
    console.info(data)
    storage.removeTags(data.filesID, data.tag)
  },
  removeClasses: (mutation) => {
    console.info('removeClasses', mutation)
    storage.removeClasses(mutation)
  },
  getAllTags: (data) => {
    const allTags = storage.getAllTags()
    // reply2Renderer(ReplyType.REPLY_ALL_TAGS, allTags)
    return {type: ReplyType.REPLY_ALL_TAGS, data: allTags}
  },
  getAllTagsWithImages: (data) => {
    const allTags = storage.getTagsOfFiles()
    console.info('allTags', allTags)
    // reply2Renderer(ReplyType.REPLY_ALL_TAGS_WITH_IMAGES, allTags)
  },
  queryFiles: (nsql) => {
    const allFiles = storage.query(nsql)
    console.info(nsql, 'reply: ', allFiles)
    // reply2Renderer(ReplyType.REPLY_QUERY_FILES, allFiles)
    return {type: ReplyType.REPLY_QUERY_FILES, data: allFiles}
  },
  addCategory: (mutation) => {
    console.info('add class', mutation)
    storage.addClasses(mutation)
  },
  getAllCategory: (parent) => {
    const category = storage.getClasses()
    // let category = await CategoryArray.loadFromDB()
    console.info('getAllCategory', category)
    // reply2Renderer(ReplyType.REPLAY_ALL_CATEGORY, category)
    return {type: ReplyType.REPLAY_ALL_CATEGORY, data: category}
  },
  getCategoryDetail: (parent) => {
    const category = storage.getClassDetail(parent)
    // let category = await CategoryArray.loadFromDB()
    console.info('getCategoryDetail', category)
    // reply2Renderer(ReplyType.REPLY_CLASSES_INFO, category)
    return {type: ReplyType.REPLY_CLASSES_INFO, data: category}
  },
  getUncategoryImages: async (data) => {
    updateStatus('reading unclassify info')
    const uncateimgs = storage.getUnClassifyFiles()
    console.info('ppopopo', data)
    // reply2Renderer(ReplyType.REPLY_UNCATEGORY_IMAGES, uncateimgs)
    console.info('unclasses', uncateimgs)
    return {type: ReplyType.REPLY_UNCATEGORY_IMAGES, data: uncateimgs}
  },
  getUntagImages: () => {
    updateStatus('reading untag info')
    const untagimgs = storage.getUnTagFiles()
    // reply2Renderer(ReplyType.REPLY_UNTAG_IMAGES, untagimgs)
    console.info('untag', untagimgs)
    return {type: ReplyType.REPLY_UNTAG_IMAGES, data: untagimgs}
  },
  updateImageCategory: (data) => {
    storage.updateFileClass(data.imageID, data.category)
  },
  updateCategoryName: (data) => {
    console.info('old:', data.oldName, 'new:', data.newName)
    storage.updateClassName(data.oldName, data.newName)
  },
  updateFileName: (data) => {
    console.info('updateFileName id:', data.id, 'new:', data.filename)
    // {id: [fileids[0]], filename: '测试'}
    storage.updateFile({ id: [data.id], filename: data.filename })
  },
  reInitDB: async (data) => {
    console.info('init db')
    storage.init()
    // reply2Renderer(ReplyType.REPLY_RELOAD_DB_STATUS, true)
    return {type: ReplyType.REPLY_RELOAD_DB_STATUS, data: true}
  }
}

pipeline.regist('addImagesByDirectory', readDir)
pipeline.regist('addImagesByPaths', messageProcessor.addImagesByPaths)
pipeline.regist('getImagesInfo', messageProcessor.getImagesInfo)
pipeline.regist('getFilesSnap', messageProcessor.getFilesSnap)
pipeline.regist('getImageInfo', messageProcessor.getImageInfo)
pipeline.regist('setTag', messageProcessor.setTag)
pipeline.regist('removeFiles', messageProcessor.removeFiles)
pipeline.regist('removeTag', messageProcessor.removeTag)
pipeline.regist('removeClasses', messageProcessor.removeClasses)
pipeline.regist('getAllTags', messageProcessor.getAllTags)
pipeline.regist('getAllCategory', messageProcessor.getAllCategory)
pipeline.regist('getAllTagsWithImages', messageProcessor.getAllTagsWithImages)
pipeline.regist('queryFiles', messageProcessor.queryFiles)
pipeline.regist('addCategory', messageProcessor.addCategory)
pipeline.regist('getCategoryDetail', messageProcessor.getCategoryDetail)
pipeline.regist('getUncategoryImages', messageProcessor.getUncategoryImages)
pipeline.regist('getUntagImages', messageProcessor.getUntagImages)
pipeline.regist('updateImageCategory', messageProcessor.updateImageCategory)
pipeline.regist('updateCategoryName', messageProcessor.updateCategoryName)
pipeline.regist('updateFileName', messageProcessor.updateFileName)
pipeline.regist('reInitDB', messageProcessor.reInitDB)

// if message is received, pass it back to the renderer via the main thread
// ipcRenderer.on('message-from-main', (event, arg) => {
//   console.info('==================')
//   console.info('arg', arg)
//   console.info('==================')
//   messageProcessor[arg.type](arg.data)
// })

ipcRenderer.on('checking-for-update', (event, arg) => {
  console.info('checking-for-update, event:', event, arg)
})

ipcRenderer.on('update-available', (event, arg) => {
  console.info('update-available, event:', event, arg)
})

ipcRenderer.on('update-not-available', (event, arg) => {
  console.info('update-not-available, event:', event, arg)
})

ipcRenderer.on('error', (event, arg) => {
  console.info('error, event:', event, arg)
})

ipcRenderer.on('download-progress', (event, arg) => {
  console.info('download-progress, event:', event, arg)
})

ipcRenderer.on('update-downloaded', (event, arg) => {
  console.info('update-downloaded, event:', event, arg)
})
