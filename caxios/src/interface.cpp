#include <node.h>
#include "civetkern.h"
#include "MessageType.h"
#include "util/util.h"
#include <iostream>

// https://stackoverflow.com/questions/36659166/nodejs-addon-calling-javascript-callback-from-inside-nan-asyncworkerexecute
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

#define EXPORT_JS_FUNCTION(name) \
  exports->Set(context, \
    String::NewFromUtf8(isolate, #name, v8::NewStringType::kNormal) \
    .ToLocalChecked(), \
    v8::FunctionTemplate::New(isolate, caxios::name, external) \
    ->GetFunction(context).ToLocalChecked()).FromJust()

namespace caxios {
  class Addon {
  public:
    Addon(Isolate* isolate, Local<Object> exports) {
      // 将次对象的实例挂到 exports 上。
      exports_.Reset(isolate, exports);
      exports_.SetWeak(this, DeleteMe, v8::WeakCallbackType::kParameter);
    }

    ~Addon() {
      if (!exports_.IsEmpty()) {
        // 重新设置引用以避免数据泄露。
        exports_.ClearWeak();
        exports_.Reset();
      }
    }

  private:
    // 导出即将被回收时调用的方法。
    static void DeleteMe(const v8::WeakCallbackInfo<Addon>& info) {
      if (m_pCaxios) {
        delete m_pCaxios;
        m_pCaxios = nullptr;
      }
      delete info.GetParameter();
    }

    // 导出对象弱句柄。该类的实例将与其若绑定的 exports 对象一起销毁。
    v8::Persistent<v8::Object> exports_;

  public:
    // 每个插件的数据
    static CAxios* m_pCaxios;
  };

  CAxios* Addon::m_pCaxios = nullptr;
  
  void init(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios == nullptr) {
      auto curContext = Nan::GetCurrentContext();
      v8::Local<v8::String> value(info[0]->ToString(curContext).FromMaybe(v8::Local<v8::String>()));
      Addon::m_pCaxios = new caxios::CAxios(ConvertToString(curContext->GetIsolate(), value));
    }
    //info.GetReturnValue().Set((CAxios*)data->m_pCaxios);
  }

  void generateFilesID(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios == nullptr) {
      Addon::m_pCaxios->GenNextFilesID();
    }
  }

  void addFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {
  }

  void addTags(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void addClasses(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  // void addAnotation(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  // void addKeyword(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void updateFile(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void updateFileTags(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void updateFileClass(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void updateClassName(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void getFilesInfo(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getFilesSnap(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getAllTags(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getUnTagFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getUnClassifyFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getAllClasses(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getTagsOfImages(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void removeFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void removeTags(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void removeClasses(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void searchFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}

}

NODE_MODULE_INIT() {
  Isolate* isolate = context->GetIsolate();

  // 为该扩展实例的AddonData创建一个新的实例
  caxios::Addon* data = new caxios::Addon(isolate, exports);
  // 在 v8::External 中包裹数据，这样我们就可以将它传递给我们暴露的方法。
  Local<v8::External> external = v8::External::New(isolate, data);

  EXPORT_JS_FUNCTION(init);
  EXPORT_JS_FUNCTION(generateFilesID);
  EXPORT_JS_FUNCTION(addFiles);
  EXPORT_JS_FUNCTION(addTags);
  EXPORT_JS_FUNCTION(addClasses);
  EXPORT_JS_FUNCTION(updateFile);
  EXPORT_JS_FUNCTION(updateFileTags);
  EXPORT_JS_FUNCTION(updateFileClass);
  EXPORT_JS_FUNCTION(updateClassName);
  EXPORT_JS_FUNCTION(getFilesInfo);
  EXPORT_JS_FUNCTION(getFilesSnap);
  EXPORT_JS_FUNCTION(getAllTags);
  EXPORT_JS_FUNCTION(getUnTagFiles);
  EXPORT_JS_FUNCTION(getUnClassifyFiles);
  EXPORT_JS_FUNCTION(getAllClasses);
  EXPORT_JS_FUNCTION(getTagsOfImages);
  EXPORT_JS_FUNCTION(removeFiles);
  EXPORT_JS_FUNCTION(removeTags);
  EXPORT_JS_FUNCTION(removeClasses);
  EXPORT_JS_FUNCTION(searchFiles);
}
