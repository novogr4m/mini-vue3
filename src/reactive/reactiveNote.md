## reactive 笔记

### 	1、 vue2 和vue3 实现响应式数据的原理区别

​			vue2中是利用原生js 下的Object.defineProperty()进行数据劫持
​           再通过里面的getter和setter方法进行数据的查看和修改，通过发布、订阅者模式进行数据与视图的响应式。


####    vue2响应式的缺点：
    1、不能监听对象的新增属性和删除属性
    2、无法正确监听数组的方法       


#### vue3响应式数据的原理：

```
1、对于基本的数据类型：
	依然是靠Object.defineProperty() 的get和set来完成
2、对于对象类型的数据：
	通过Proxy代理：拦截对象中任意属性的变化，包括属性值的读写、添加、删除等操作
	通过Reflect反射函数进行操作
```

#### Proxy特点

```
1、代理的对象是不等于原始数据对象
2、原始对象里头的数据和被Proxy包装的对象之间是有关联的。即当原始对象里头数据发生改变时，会影响代理对象；代理对象里头的数据发生变化对应的原始数据也会发生变化。
```

#### 使用反射和代理去添加属性有什么好处

```
当我们使用代理的时候，所谓的响应式转换会变成懒加载；
在Vue2中，当我们进行转换的时候，我们必须尽快完成转换，因为当你将对象传递给Vue2的响应式，我们必须遍历所有的键并当场转换。以后当他们被访问时，它们已经被转换了；
但是对于Vue3，当你调用reactive时，对于一个对象，我们所做的就是返回一个代理对象，仅在需要转换时嵌套对象(当你需要访问它的时候)，这就类似于懒加载；
这样，如果你的app有一个庞大的对象列表，但是对于分页，你只是渲染页面的前面10个，也就是只有前面10个必须经过响应式转换，可以为启动应用程序来说节省许多的时间；
```

### reactive函数：

```js
//reative函数：
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
            let oldLength = target.length; //解决数组特例
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

```

#### 	解决数组特例（待补充）：

​	只通过判断长度的变化

### 实现vue3的响应式原理

#### effect（副作用函数）：

​	effect全称叫side effect，副作用。

什么是副作用呢，一个函数运行后产生了可以影响其外部或可以看到的效果，就叫副作用。

基本上可以简化的理解为副作用就是执行某种操作，无副作用就是执行某种计算。

我们来看一个例子：

![image-20230306204859378](C:\Users\93554\AppData\Roaming\Typora\typora-user-images\image-20230306204859378.png)

effect 的大概逻辑：每一个effect在执行过程中如果遇到设置了响应式的值那么就会执行依赖收集，那么此时如果打一个标记，并根据此标记将存在依赖的effect放到某个队列中，当依赖改变后从队列中挑选判断并执行即可

#### track：

![](C:\Users\93554\AppData\Roaming\Typora\typora-user-images\image-20230306194319499.png)

```
targetMap用于存储副作用，并建立副作用和依赖的对应关系。
通俗理解就是将响应式对象和依赖其的函数联系起来

一个副作用可能依赖多个响应式对象，一个响应式对象里可能依赖多个属性
而同一个属性又可能被多个副作用依赖。
```

所以，targetMap的结构设计如下：

```
{
	[target]:{	key是reactiveObject value是一个Map
		[key]:[]	key是reactiveObject的键值，value是一个Set
	}
}
```

```js
//比如我们的data长这样：
const product:reactive({
	quantity:5,
	price:10,
	...
})

//那targetMap的结构如下：
{
	[product]:{
		[quantity]:[....],
    	[price]:[....],
	}
}
```

据此，写出我们的track函数：

![image-20230306200959500](C:\Users\93554\AppData\Roaming\Typora\typora-user-images\image-20230306200959500.png)

#### trigger：

```
触发函数，会遍历我们储存的每一个effect，然后执行它们
```

​	了解了我们储存依赖的`targetMap`后，`trigger`函数的实现就很简单了。

​	如果`targetMap`为空，说明这个对象没有被跟踪，我们直接return

```js
export function trigger(target,key){
    let depsMap = targetMap.get(target);
	if(!depsMap){
		return;
	}
    
}
```

​	不为空，检查属性是否有依赖关系，没有直接return

```js
export function trigger(target,key){
    let depsMap = targetMap.get(target);
	if(!depsMap){
		return;
	}
    
    let deps = depsMap.get(key);
    if(!deps){
		return; 
    }
}
```

​	若检查到某个属性有依赖关系，运行effect

```js
export function trigger(target,key){
    let depsMap = targetMap.get(target);
	if(!depsMap){
		return;
	}
    
    let deps = depsMap.get(key);
    if(!deps){
		return; 
    }
}

	deps.forEach((effect)=>{
		effectFn();
    })
```

后面我们会设计一个调度函数（暂时不需理解），所以应该写成：

```js
  deps.forEach((effectFn) => {
        if(effectFn.scheduler){
            effectFn.scheduler(effectFn);   //如果传入了调度函数，则通过 scheduler 函数去运行 effectFn
        }else{
            effectFn();
        }
    });
```

源码中的trigger接收的参数：

```js
export function trigger(
  target: object,
  type: TriggerOpTypes,			//
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // never been tracked
    return
  }
  ...
}

  export const enum TriggerOpTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  CLEAR = 'clear'
}
  
  //tip:源码中的trigger复杂多了，会对key收集的依赖进行分组，对触发type类型的不同进行effect的处理，有computedRuners，重新收集依赖effect.....
```





