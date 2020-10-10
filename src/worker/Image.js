import FileBase from '../public/FileBase'
import Storage from '../public/Kernel'
import NLP from '../public/NLP'
import ExifReader from 'exifreader'
import JString from '../public/String'
// import CV from '../public/CV'
import fs from 'fs'
// import WorkerPool from './WorkerPool'

export class ImageParser {
  constructor(hardLinkDir) {
    this.hardLinkDir = hardLinkDir
  }

  parse(fullpath, stat, stepFinishCB) {
    const path = require('path')
    const f = path.parse(fullpath)
    console.info(f.dir, f.base, this.hardLinkDir)
    const bakFilepath = this.hardLinkDir + '/' + f.base
    fs.linkSync(fullpath, bakFilepath)
    const fid = Storage.generateFilesID(1)
    let fileInfo = {
      fileid: fid[0],
      meta: [
        { name: 'path', value: bakFilepath, type: 'str' },
        { name: 'filename', value: f.base, type: 'str' },
        { name: 'size', value: stat.size, type: 'value' },
        { name: 'datetime', value: stat.atime.toString(), type: 'value' }
      ]
    }
    return parseChain(fileInfo, stepFinishCB)
  }
}

const parseChain = (fileInfo, stepFinishCB) => {
  let image = new JImage(fileInfo)
  image.stepCallback = stepFinishCB
  const meta = new ImageMetaParser()
  const text = new ImageTextParser()
  const color = new ImageColorParser()
  meta.nextParser(text)
  text.nextParser(color)
  meta.parse(image)
  return image
}

export class JImage extends FileBase {
  toJson() {
    return JSON.parse(JSON.stringify(this))
  }
}

class ImageParseBase {
  constructor() {
    this.maxStep = 2
  }

  nextParser(parser) {
    this.next = parser
  }
}

class ImageMetaParser extends ImageParseBase {
  constructor() {
    super()
    this.step = 0
  }

  async parse(image) {
    const fullpath = image.path + '/' + image.filename
    const meta = ExifReader.load(fs.readFileSync(fullpath))
    delete meta['MakerNote']
    let type = meta['format']
    if (type === undefined) {
      type = JString.getFormatType(image.filename)
    } else {
      type = JString.getFormatType(meta['format'].description)
    }
    if (meta['DateTime'] !== undefined && meta['DateTime'].value) {
      // image.datetime = meta['DateTime'].value[0]
      image.addMeta('datetime', meta['DateTime'].value[0])
    }
    image.addMeta('type', this.getImageFormat(type))
    image.addMeta('width', this.getImageWidth(meta))
    image.addMeta('height', this.getImageHeight(meta))
    if (image.size > 5 * 1024 * 1024) {
      image.addMeta('thumbnail', this.getImageThumbnail(meta))
      // image.thumbnail = this.getImageThumbnail(meta)
    }
    try {
      Storage.addFiles([image])
    } catch (err) {
      console.info('parse metadata error', err)
    }
    console.info('1', image)
    // image.stepCallback(undefined, image)

    // if (this.next !== undefined) {
    //   this.next.parse(image)
    // }
  }

  getImageWidth(meta) {
    if (meta['Image Width']) return meta['Image Width'].value
    if (meta['ImageWidth']) return meta['ImageWidth'].value
    console.info('width error', meta)
  }

  getImageHeight(meta) {
    if (meta['Image Height']) return meta['Image Width'].value
    if (meta['ImageLength']) return meta['ImageLength'].value
  }

  getImageTime(meta) {
    if (meta['DateTime'] !== undefined) {
      return meta['DateTime'].value[0]
    }
    console.info('image time error', meta)
  }

  getImageThumbnail(meta) {
    if (meta['Thumbnail']) return meta['Thumbnail'].base64
    console.info('thumbnail', meta)
    return undefined
  }

  getImageFormat(str) {
    console.info('format', str)
    switch (str) {
      case 'jpg':
      case 'jpeg':
        return 'jpeg'
      case 'tif':
      case 'tiff':
        return 'tiff'
      case 'bmp':
        return 'bmp'
      case 'gif':
        return 'gif'
      case 'png':
        return 'png'
      default:
        return 'unknow'
    }
  }
}

class ImageTextParser extends ImageParseBase {
  constructor() {
    super()
    this.step = 1
  }

  async parse(image) {
    const fullpath = image.path + '/' + image.filename
    image.tag = NLP.getNouns(fullpath)
    image.keyword = image.tag
    // await localStorage.updateImage(image.id, 'keyword', image.keyword, this.step)
    try {
      await Storage.updateFileTags(image.id, image.tag)
      // await localStorage.updateImageTags(image.id, image.tag)
      // await localStorage.nextStep(image.id)
    } catch (err) {
      console.info('parse text error', err)
    }
    console.info('2', image)
    image.stepCallback(undefined, image)

    if (this.next !== undefined) {
      this.next.parse(image)
    }
  }
}

class ImageColorParser extends ImageParseBase {
  constructor() {
    super()
    this.step = 2
  }

  async parse(image) {
    // image.stepFinishCB(image)

    if (this.next !== undefined) {
      this.next.parse(image)
    }
  }
}
