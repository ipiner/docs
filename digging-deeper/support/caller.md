## 调用定位

`Caller` 用于从 PHP 调用栈中解析业务代码调用位置。

```php
use Pin\Support\Caller;

$caller = Caller::resolve();

// [
//     'file' => '/app/Services/UserService.php',
//     'line' => 42,
// ]
```

默认情况下，`Caller` 会从 `debug_backtrace()` 获取调用栈，并跳过 `vendor` 目录中的文件，返回第一个业务代码位置。

如果无法找到业务代码，则返回第一个可用的调用信息。

可通过 `setApplicationFileResolver()` 自定义业务文件判断规则：

```php
Caller::setApplicationFileResolver(
    fn (string $file) => str_contains($file, '/app/')
);
```
