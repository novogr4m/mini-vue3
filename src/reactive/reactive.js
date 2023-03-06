
import{ hasChanged, isObject,isArray } from '../utils'
import { track, trigger } from './effect';

const proxyMap = new WeakMap();

export function reactive(target) {
    //判断是否为对象
    if(!isObject(target)){
        return target;
    }
    
    //判断是否已经代理过
    if(isReactive(target)){
        return target;
    }
    
    //判断是否代理同一个对象
    //  let a = reactive(obj) , b = reactive(obj)
    if(proxyMap.has(target)){
        return proxyMap.get(target);
    }

    const proxy = new Proxy(target, {
        //
        get(target,key,receiver){
            if(key === '__isReactive'){
                return true;
            }
            const result = Reflect.get(target, key, receiver);
            track(target, key); //依赖收集
            return isObject(result) ? reactive(result) : result; //解决特例深层代理
        },
        
        set(target,key,value,receiver){
            let oldLength = target.length; //解决数组特例,
            const oldValue = target[key];
            const result = Reflect.set(target,key,value,receiver);
            //判断依赖对象是否有改变
            if(hasChanged(oldValue,value)){
                trigger(target,key);
                //解决数组特例
                if(isArray(target) && hasChanged(oldLength,target.length)){
                    trigger(target,'length');
                }
            }
            return result;
        }
    });

    proxyMap.set (target,proxy);
    return proxy;
}

//判断一个对象是否被代理过
export function isReactive(target){
    return !!(target && target.__isReactive);
}


//特殊处理
//reactive(reactive(obj))
//let a = reactive(obj), b = reactive(obj)
//hasChanged
//深层对象代理
//数组
//嵌套effect