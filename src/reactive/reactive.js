import { isObject } from "../utils";
import {track,trigger} from './effect'
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
    
    return proxy;

}


//判断一个对象是否被代理过
export function isReactive(target){
    return !!(target && target.__isReactive);
}