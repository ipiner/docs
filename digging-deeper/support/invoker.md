## 反射访问

`Invoker` 基于 PHP Reflection，用于访问对象或类的非公开成员。

### 创建

```php
use Pin\Support\Invoker;

$invoker = new Invoker($object);

// 或者
$invoker = new Invoker(SomeClass::class);
```

### 属性访问

支持访问实例属性和静态属性：

```php
$value = $invoker->name;

$invoker->name = 'Pin';
```

静态属性：

```php
$value = $invoker->config;

$invoker->config = $config;
```

也可以通过 `get()` 和 `set()` 使用点语法访问嵌套属性：

```php
$value = $invoker->get('config.database.host');

$invoker->set('config.database.host', 'localhost');
```

### 方法调用

可以调用非公开方法：

```php
$result = $invoker->hiddenMethod($arg1, $arg2);
```

静态方法：

```php
$result = (new Invoker(SomeClass::class))->hiddenStaticMethod();
```
