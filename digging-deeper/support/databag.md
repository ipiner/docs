## 数据容器 {#databag}

`DataBag` 基于 Laravel 的 `Illuminate\Support\Fluent`，提供一致的数据访问方式，并默认启用严格模式。

`Context` 基于 `DataBag` 构建，两者具有相同的使用方式，但语义不同：

- `DataBag`：用于保存通用数据。
- `Context`：用于在一次请求、一次操作或一段业务流程中传递上下文数据。

### 创建

使用 `DataBag::new()` 可以将常见输入统一转换为 `DataBag` 实例：

```php
use Pin\Support\DataBag;

$empty = DataBag::new(null);

$fromArray = DataBag::new([
    'id' => 1,
]);

$same = DataBag::new($fromArray);
```

### 严格模式

默认情况下，`DataBag` 启用严格模式。

通过属性或数组访问不存在的键会抛出 `RuntimeException`。

`get()` 方法与 Laravel `Fluent` 保持一致，不受严格模式影响：

```php
$bag = new DataBag([
    'name' => 'Pin',
]);

$name = $bag->name;   // Pin
$bag->get('missing'); // null

$bag->missing;   // RuntimeException
$bag['missing']; // RuntimeException
```

创建实例时传入 `false` 可关闭严格模式：

```php
$bag = new DataBag([], false);

$bag->missing;   // null
$bag['missing']; // null
```
