const instance = require('../build/Release/civetkern')

let cfg = {
  app: {
      first: true,
      default: 'ͼ���'
  },
  resources:[
      {
      name: 'ͼ���',
      db: {
          path: '���ݿ�'
      },
      meta: [
          {name: 'color', value: '��ɫ', type: 'color', db: true},
          {name: 'datetime', value: '��������', type: 'date', db: true},
          {name: 'size', value: '��С', type: 'int', db: true},
          {name: 'filename', value: '�ļ���', type: 'str', db: false}
      ]
      }
  ]
}

instance.init(cfg, 1)
instance.query('{keyword: "test"}')
instance.release()
