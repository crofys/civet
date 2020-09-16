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

namespace caxios {
  class Addon {
  public:
    Addon(Isolate* isolate, Local<Object> exports) {
      // ���ζ����ʵ���ҵ� exports �ϡ�
      exports_.Reset(isolate, exports);
      exports_.SetWeak(this, DeleteMe, v8::WeakCallbackType::kParameter);
    }

    ~Addon() {
      if (!exports_.IsEmpty()) {
        // �������������Ա�������й¶��
        exports_.ClearWeak();
        exports_.Reset();
      }
    }

  private:
    // ��������������ʱ���õķ�����
    static void DeleteMe(const v8::WeakCallbackInfo<Addon>& info) {
      if (m_pCaxios) {
        delete m_pCaxios;
        m_pCaxios = nullptr;
      }
      delete info.GetParameter();
    }

    // ��������������������ʵ�����������󶨵� exports ����һ�����١�
    v8::Persistent<v8::Object> exports_;

  public:
    // ÿ�����������
    static CAxios* m_pCaxios;
  };

  CAxios* Addon::m_pCaxios = nullptr;
  
  static void Init(const v8::FunctionCallbackInfo<v8::Value>& info) {
    // �ָ�ÿ�����ʵ�������ݡ�
    Addon* data =
      reinterpret_cast<Addon*>(info.Data().As<v8::External>()->Value());
    if (Addon::m_pCaxios == nullptr) {
      auto curContext = Nan::GetCurrentContext();
      v8::Local<v8::String> value(info[0]->ToString(curContext).FromMaybe(v8::Local<v8::String>()));
      Addon::m_pCaxios = new caxios::CAxios(ConvertToString(curContext->GetIsolate(), value));
    }
    //info.GetReturnValue().Set((CAxios*)data->m_pCaxios);
  }
}

NODE_MODULE_INIT() {
  Isolate* isolate = context->GetIsolate();

  // Ϊ����չʵ����AddonData����һ���µ�ʵ��
  caxios::Addon* data = new caxios::Addon(isolate, exports);
  // �� v8::External �а������ݣ��������ǾͿ��Խ������ݸ����Ǳ�¶�ķ�����
  Local<v8::External> external = v8::External::New(isolate, data);

  // �� "Method" ������¶�� JavaScript����ȷ�����������ͨ���� `external` ��Ϊ FunctionTemplate ���캯������������ʱ������ÿ�����ʵ�������ݡ�
  exports->Set(context,
    String::NewFromUtf8(isolate, "instance", v8::NewStringType::kNormal)
    .ToLocalChecked(),
    v8::FunctionTemplate::New(isolate, caxios::Init, external)
    ->GetFunction(context).ToLocalChecked()).FromJust();
}
