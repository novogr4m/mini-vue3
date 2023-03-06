import { isObject } from "../utils";
import { track, trigger } from './effect';
const propMap = new WeakMap();

export function reactive(target) {
    
    if (!isObject(target)) {
        return target;
    }
    if(isReactive(target)){
        return target;
    }
    
    const proxy = new Proxy(target, {
        get(target, name, receiver) {
            if(name === '__isReactive'){
                return true;
            }
            //Reflect 参考阮一峰老师的书
            //Reflect.get(target,name,receiver)查找并返回target对象的name属性
            //如果没有该属性则返回undefined
            const result = Reflect.get(target, name, receiver);
            track(target,name);
            return result;
        },

        set(target,name,value,receiver) {
            const result = Reflect.set(target, name, value, receiver);
            trigger(target,name);
            return result;
        }
    })
    
    propMap.set(target, proxy);
    
    return proxy;

}


//判断一个对象是否被代理过
export function isReactive(target){
    return !!(target && target.__isReactive);
}


// const proxyMap = new WeakMap();

// export function reactive(target) {
//     //判断是否是对象
//     if (!isObject(target)) {
//         return target;
//     }

//     //判断是否代理过
//     if (!isReactive(target)) {
//         return target;
//     }

//     //是否代理同一个对象
//     if (proxyMap.has(target)) {
//         return proxyMap.get(target);
//     }
    
//     const proxy = new Proxy(target, {
//         //重写get方法
//         get(target, key, receiver) {
//             if (key === '__isReactive') {
//                 return true;
//             }
//             const result = Reflect.get(target, key, receiver);
//             //进行依赖收集
//             return isObject(result) ? reactive(result) : result;
//         },

//         //重写set方法
//         set(target, key, value, receiver) {
//             const oldValue = target[key];
//             const result = Reflect.set(target, key, value, receiver);
//             if (hasChanged(old, value)) {
//                 //触发
//             }

//             return result;
//         }


     
//     });
//     proxyMap.set(target, proxy);
//     return proxy;
// }