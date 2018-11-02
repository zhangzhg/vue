/* not type checking this file because flow doesn't play well with Proxy
 {
    get: '咋获取',
    set: '咋设置',
    deleteProperty: '咋删除',
    enumerate: '咋枚举',
    ownKeys: '咋获取所有该对象的属性键 ',
    has: '问你有没有, 比如 "xxx" in target',
    defineProperty: '如何defineProperty， 这个我们也是可以代理的',
    getOwnPropertyDescriptor: '获取属性描述的代理',
    getPrototypeOf: '找原型时候的代理',
    setPrototypeOf: '设置对象原型的时候的代理',
    isExtensible: '判断对象是否可扩展的时候的代理',
    preventExtensions: '设置阻止对象扩展的时候的代理',
    apply: '执行调用操作的时候的代理',
    construct: '执行实例化的时候的代理'
}
拦截，预警，上报，扩展功能，统计，强化对象...能想得到的都能沾到点边，这里Vue的代码主要将代理运用于拦截。

* */

import config from 'core/config'
import { warn, makeMap, isNative } from '../util/index'

let initProxy

if (process.env.NODE_ENV !== 'production') {
  const allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  )

  const warnNonPresent = (target, key) => {
    warn(
      `Property or method "${key}" is not defined on the instance but ` +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    )
  }

  const hasProxy =
    typeof Proxy !== 'undefined' && isNative(Proxy)

  if (hasProxy) {
    const isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact')
    config.keyCodes = new Proxy(config.keyCodes, {
      set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(`Avoid overwriting built-in modifier in config.keyCodes: .${key}`)
          return false
        } else {
          target[key] = value
          return true
        }
      }
    })
  }

  const hasHandler = {
    has (target, key) {
      const has = key in target
      const isAllowed = allowedGlobals(key) || (typeof key === 'string' && key.charAt(0) === '_')
      if (!has && !isAllowed) {
        warnNonPresent(target, key)
      }
      return has || !isAllowed
    }
  }

  const getHandler = {
    get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        warnNonPresent(target, key)
      }
      return target[key]
    }
  }

  initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      const options = vm.$options
      const handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler
      vm._renderProxy = new Proxy(vm, handlers)
    } else {
      vm._renderProxy = vm
    }
  }
}

export { initProxy }
