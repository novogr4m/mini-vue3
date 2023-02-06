let activeEffect = undefined; //让effectFn和track联系起来

export function effect(fn) {
    const effectFn = () => {
        try {
            //当前再执行的副作用函数
            activeEffect = effectFn;
            return fn();
        } finally {
            activeEffect = undefined;
        }
    }
   
    effectFn();
    return effectFn;

    
}

const targetMap = new WeakMap();
//依赖收集track 保存副作用函数与它的依赖的关系
export function track(target,name) {
    if (!activeEffect) {
        return;
    }    

    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }

    let deps = depsMap.get(name);
    if (!deps) {
        depsMap.set(name, (deps = new Set()));
    }

    deps.add(activeEffect);
}

export function trigger(target,name) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    const deps = depsMap.get(name);
    if (!deps) {
        return;
    }
    deps.forEach((effectFn) => {
        effectFn(); 
    })
}