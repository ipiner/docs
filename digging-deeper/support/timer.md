## 计时与耗时

`Timer` 用于记录时间点和计算耗时，`Duration` 用于表示耗时结果。

### 请求耗时

```php
use Pin\Support\Timer;

$duration = Timer::durationSinceStartOfRequest();

$seconds = $duration->seconds();
$milliseconds = $duration->milliseconds();
```

默认使用 `REQUEST_TIME_FLOAT` 作为请求开始时间，也可以手动指定开始时间：

```php
$duration = Timer::durationSinceStartOfRequest(microtime(true) - 1);
```

### 局部计时

可以使用 `Timer` 对指定代码片段进行计时：

```php
$timer = new Timer();

$timer->start('query');

// do something

$duration = $timer->stop('query'); // Duration
```

### Duration

`Duration` 用于表示一段时间范围的耗时，并提供耗时和内存变化统计。

```php
$duration->seconds();        // 秒，默认保留 4 位小数
$duration->milliseconds();   // 毫秒
$duration->memoryUsage();    // 内存变化（字节）
```

`seconds()` 可以指定保留的小数位数：

```php
$duration->seconds(2); // 保留 2 位小数
```
