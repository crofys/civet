import { MessagePipeline } from './MessageTransfer'
import JString from '../public/String'
import { ImageService } from './service/ImageService'
import { ReplyType } from './transfer'
import { IFileImpl, Message } from '../public/civet'
import storage from '../public/Kernel'
import fs from 'fs'

let isStart: boolean = false;
function updateStatus(status: any) {
  if (isStart === false) {
    window['eventBus'].$emit('status', status)
  }
}

export class ResourceService{
  constructor(pipeline: MessagePipeline) {
    this.pipeline = pipeline
    pipeline.regist('addImagesByDirectory', this.readDir)
    pipeline.regist('addImagesByPaths', this.addImagesByPaths)
    pipeline.regist('getImagesInfo', this.getImagesInfo)
    pipeline.regist('getFilesSnap', this.getFilesSnap)
    pipeline.regist('getImageInfo', this.getImageInfo)
    pipeline.regist('setTag', this.setTag)
    pipeline.regist('removeFiles', this.removeFiles)
    pipeline.regist('removeTag', this.removeTag)
    pipeline.regist('removeClasses', this.removeClasses)
    pipeline.regist('getAllTags', this.getAllTags)
    pipeline.regist('getAllCategory', this.getAllCategory)
    pipeline.regist('getAllTagsWithImages', this.getAllTagsWithImages)
    pipeline.regist('queryFiles', this.queryFiles)
    pipeline.regist('addCategory', this.addCategory)
    pipeline.regist('getCategoryDetail', this.getCategoryDetail)
    pipeline.regist('getUncategoryImages', this.getUncategoryImages)
    pipeline.regist('getUntagImages', this.getUntagImages)
    pipeline.regist('updateCategoryName', this.updateCategoryName)
    pipeline.regist('updateFileName', this.updateFileName)
    pipeline.regist('reInitDB', this.reInitDB)
  }

  addImagesByPaths(msgid: number, data: string[]) {
    for (const fullpath of data) {
      this.readImages.call(this, msgid, fullpath)
    }
  }

  getImagesInfo(msgid: number, data: any) {
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
    console.info('getImagesInfo', imgs, this)
    const images = []
    for (const img of imgs) {
      images.push(new IFileImpl(img))
    }
    return {type: ReplyType.REPLY_IMAGES_INFO, data: images}
    // reply2Renderer(ReplyType.REPLY_IMAGES_INFO, images)
  }

  getFilesSnap(msgid: number, data: any) {
    // 全部图片信息
    const imagesSnap = storage.getFilesSnap()
    return {type: ReplyType.REPLY_FILES_SNAP, data: imagesSnap}
    // reply2Renderer(ReplyType.REPLY_FILES_SNAP, imagesSnap)
  }

  getImageInfo(msgid: number, imageID: string) {
    const img = storage.getFilesInfo([imageID])
    // console.info('getImagesInfo', img)
    const image = new IFileImpl(img[0])
    // reply2Renderer(ReplyType.REPLY_IMAGE_INFO, image)
    return {type: ReplyType.REPLY_IMAGE_INFO, data: image}
  }
  setTag(msgid: number, data: any) {
    console.info(data)
    storage.setTags(data.id, data.tag)
  }
  removeFiles(msgid: number, filesID: any) {
    console.info('removeFiles:', filesID)
    storage.removeFiles(filesID)
  }
  removeTag(msgid: number, data: any) {
    console.info(data)
    storage.removeTags(data.filesID, data.tag)
  }
  removeClasses(msgid: number, mutation: any) {
    console.info('removeClasses', mutation)
    storage.removeClasses(mutation)
  }
  getAllTags(msgid: number, data: any) {
    const allTags = storage.getAllTags()
    // reply2Renderer(ReplyType.REPLY_ALL_TAGS, allTags)
    return {type: ReplyType.REPLY_ALL_TAGS, data: allTags}
  }
  getAllTagsWithImages(msgid: number, data: any) {
    const allTags = storage.getTagsOfFiles()
    console.info('allTags', allTags)
    // reply2Renderer(ReplyType.REPLY_ALL_TAGS_WITH_IMAGES, allTags)
  }
  queryFiles(msgid: number, nsql: any) {
    const allFiles = storage.query(nsql)
    console.info(nsql, 'reply: ', allFiles)
    // reply2Renderer(ReplyType.REPLY_QUERY_FILES, allFiles)
    return {type: ReplyType.REPLY_QUERY_FILES, data: allFiles}
  }
  addCategory(msgid: number, mutation: any) {
    console.info('add class', mutation)
    if (typeof mutation === 'string') {
      mutation = [mutation]
    }
    storage.addClasses(mutation)
  }
  getAllCategory(msgid: number, parent: any) {
    const category = storage.getClasses()
    // let category = await CategoryArray.loadFromDB()
    console.info('getAllCategory', category)
    // reply2Renderer(ReplyType.REPLAY_ALL_CATEGORY, category)
    return {type: ReplyType.REPLAY_ALL_CATEGORY, data: category}
  }
  getCategoryDetail(msgid: number, parent: any) {
    const category = storage.getClassDetail(parent)
    // let category = await CategoryArray.loadFromDB()
    console.info('getCategoryDetail', category)
    // reply2Renderer(ReplyType.REPLY_CLASSES_INFO, category)
    return {type: ReplyType.REPLY_CLASSES_INFO, data: category}
  }
  async getUncategoryImages(msgid: number, data: any) {
    updateStatus('reading unclassify info')
    const uncateimgs = storage.getUnClassifyFiles()
    console.info('ppopopo', data)
    // reply2Renderer(ReplyType.REPLY_UNCATEGORY_IMAGES, uncateimgs)
    console.info('unclasses', uncateimgs)
    return {type: ReplyType.REPLY_UNCATEGORY_IMAGES, data: uncateimgs}
  }
  getUntagImages() {
    updateStatus('reading untag info')
    const untagimgs = storage.getUnTagFiles()
    // reply2Renderer(ReplyType.REPLY_UNTAG_IMAGES, untagimgs)
    console.info('untag', untagimgs)
    return {type: ReplyType.REPLY_UNTAG_IMAGES, data: untagimgs}
  }
  // updateImageCategory(msgid: number, data: any) {
  //   storage.updateFileClass(data.imageID, data.category)
  // }
  updateCategoryName(msgid: number, data: any) {
    console.info('old:', data.oldName, 'new:', data.newName)
    storage.updateClassName(data.oldName, data.newName)
  }
  updateFileName(msgid: number, data: any) {
    console.info('updateFileName id:', data.id, 'new:', data.filename)
    // {id: [fileids[0]], filename: '测试'}
    storage.updateFile({ id: [data.id], filename: data.filename })
  }
  async reInitDB(msgid: number, data: any) {
    console.info('init db')
    storage.init()
    // reply2Renderer(ReplyType.REPLY_RELOAD_DB_STATUS, true)
    return {type: ReplyType.REPLY_RELOAD_DB_STATUS, data: true}
  }

  private async readImages(msgid: number, fullpath: string) {
    const info = fs.statSync(fullpath)
    if (info.isDirectory()) {
      this.readDir.call(this, msgid, fullpath)
    } else {
      // if (bakDir === undefined) {
      //   const config = cvtConfig.getConfig()
      //   console.info('--------2----------', config)
      //   initHardLinkDir(config.app.default)
      // }
      const service = new ImageService(this.pipeline)
      const file = await service.read(fullpath)
      console.info('readImages', file, this)
      let msg = new Message()
      msg.type = ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY
      msg.msg = [file.toJson()]
      msg.tick = 0
      msg.id = msgid
      this.pipeline.post(msg)
      // reply2Renderer(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, [file.toJson()])
    }
  }

  private readDir(msgid: number, path: string) {
    let self = this;
    fs.readdir(path, async function(err, menu) {
      if (err) return
      // console.info(menu)
      self.totalFiles += menu.length
      for (const item of menu) {
        await self.readImages(msgid, JString.joinPath(path, item))
      }
      // reply2Renderer(ReplyType.REPLY_FILES_LOAD_COUNT, { count: menu.length, total: totalFiles })
      self.progressLoad += menu.length
      if (self.progressLoad === self.totalFiles) {
        self.totalFiles = 0
        self.progressLoad = 0
      }
    })
  }

  private pipeline: MessagePipeline;
  private totalFiles: number = 0;
  private progressLoad: number = 0;
}