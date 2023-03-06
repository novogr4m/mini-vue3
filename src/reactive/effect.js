const effectStack = [];  //解决嵌套effect的问题，存储当前effect栈
let activeEffect; // 让effectFn和track联系起来

export function effect(fn ,options = {}){
    const effectFn= () => {
        try{
            activeEffect = effectFn;    //actveEffect=当前正在执行的副作用函数
            effectStack.push(activeEffect);
            return fn();
        }finally{ 
            //嵌套effect
            effectStack.pop();
            activeEffect = effectStack[effectStack.length - 1];
        }
    };
    if(!options.lazy){  //是否延迟执行effect
        effectFn(); //立即调用我们创建的effect
    }
    effectFn.scheduler = options.scheduler;
    return effectFn;
}

//为每一个响应式对象存储依赖关系
const targetMap = new WeakMap();   //targetMap是依赖管理中心，用于收集依赖和触发依赖

//依赖收集track 保存副作用函数与它的依赖的关系
export function track(target,key){
    if(!activeEffect){    //activeEffect为空，没有依赖或者不应当触发track时，直接return
        return;   
    }
    //假设我们的一个响应式对象是这样的:product{quantity:5,price:10}
    let depsMap = targetMap.get(target); //target:product
    //检查targetMap中有没有当前的target
    if(!depsMap){  
        //如果目标对象不存在targetMap，即没有被追踪，则新建一个放入targetMap
        //创建一个product
        targetMap.set(target, (depsMap = new Map()));
    }
    //quantity,price
    //要把这些dep储存起来，且方便我们以后再找到它们，我们需要创建有一个depsMap
    //，它是一张存储了每个属性其dep对象的图；
    //使用对象的属性名作为键，比如数量和价格，值就是一个dep(effects集)
    let deps = depsMap.get(key);
    //检查depsMap中是否存在触发track的key
    if(!deps){
        //如果目标key没有被追踪，添加一个
        depsMap.set(key,(deps = new Set()));
    }

    deps.add(activeEffect); //添加副作用函数
}

export function trigger(target, key){
    const depsMap = targetMap.get(target); //检查对象是否有依赖属性
    if (!depsMap) {
        //未被跟踪
        return;
    }
    const deps = depsMap.get(key); //检查属性是否有依赖关系
    if(!deps){
        return;
    }
    //某个属性有依赖关系 运行每一个effect
    deps.forEach((effectFn) => {
        if(effectFn.scheduler){
            effectFn.scheduler(effectFn);   //如果传入了调度函数，则通过 scheduler 函数去运行 effectFn
        }else{
            effectFn();
        }
    });
}