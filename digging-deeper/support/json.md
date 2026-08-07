## JSON

`Pin\Support\Json` 提供统一的 JSON 编解码方法。

### 编码

默认情况下，`encode()` 会启用 `JSON_UNESCAPED_UNICODE｜JSON_THROW_ON_ERROR`。

```php
use Pin\Support\Json;

$json = Json::encode(['hello' => '你好']);
// '{"hello":"你好"}'
```

自定义编码选项：

```php
$json = Json::encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
```

### 解码

默认情况下，`decode()` 会返回数组。

```php
$data = Json::decode('{"hello":"你好"}');
// ['hello' => '你好']
```

返回 `stdClass`：

```php
$data = Json::decode($json, false);
```

### 异常处理

JSON 编解码失败时，`Json` 会抛出 `Pin\Exceptions\Exception`，并通过上下文保存原始数据：

```php
try {
    Json::decode($invalidJson);
} catch (\Pin\Exceptions\Exception $e) {
    $context = $e->getContext();
    // ['data' => $invalidJson]
}
```
