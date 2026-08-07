## 日志通道

Pin 默认提供结构化 JSON 单文件日志通道。

| 通道  | 说明                               |
| ----- | ---------------------------------- |
| `app` | 应用日志、异常日志以及框架运行日志 |
| `api` | API 请求日志                       |
| `sql` | SQL 执行日志                       |

### 通道配置

Pin 提供 `Pin\Log\Config` 用于创建日志通道配置。

#### 单文件通道

`Config::single()` 创建单文件日志通道：

```php
use Pin\Log\Config;

'app' => Config::single('app'),
```

默认根据通道名称生成日志文件：

```text
storage/logs/{name}.log
```

例如：

```php
Config::single('app')
```

对应：

```text
storage/logs/app.log
```

#### 按天滚动通道

`Config::daily()` 创建按天滚动日志通道：

```php
Config::daily('app')
```

默认保留最近 14 天日志：

```php
[
    'driver' => 'daily',
    'days' => 14,
]
```

可以通过参数覆盖默认配置：

```php
Config::daily('app', [
    'days' => 30,
]);
```

#### 环境隔离

`testing` 环境使用独立日志目录，避免测试日志与其他环境日志混合：

```text
storage/testing-logs/{name}.log
```

#### 日志级别

日志级别默认为 `debug`，可通过环境变量配置：

```ini
LOG_{NAME}_LEVEL
```

例如：

```ini
LOG_APP_LEVEL=warning
```

对应：

```php
Config::single('app')
```

仅记录 `warning` 及以上级别日志。

#### 日志格式

Pin 默认使用 JSON 格式输出日志，主要包含以下字段：

| 字段         | 说明                 |
| ------------ | -------------------- |
| `datetime`   | 日志时间             |
| `message`    | 日志消息             |
| `context`    | 日志上下文数据       |
| `level`      | 日志级别             |
| `level_code` | 日志级别编号         |
| `channel`    | 日志通道名称         |
| `extra`      | 请求上下文等附加信息 |

示例：

```json
{
  "datetime": "2026-06-27 10:00:00",
  "message": "请求成功",
  "context": {
    "category": "api",
    "status": 200,
    "time": 32
  },
  "level": "DEBUG",
  "level_code": 100,
  "channel": "api",
  "extra": {
    "request_id": "16cb517-918e-48cf-9ddb-1879a4d22fbc",
    "route": "users"
  }
}
```

异常日志会额外包含异常信息：

```json
{
  "context": {
    "exception": {
      "class": "App\\Exceptions\\ExampleException",
      "message": "发生异常",
      "code": 10001,
      "file": "/app/Example.php",
      "line": 10
    }
  }
}
```

异常堆栈记录规则参见[异常堆栈](#stack-trace)。

##### 日志格式化器

可通过 `formatter` 配置自定义日志格式化器：

```php
'app' => Config::single('app', [
    'formatter' => App\Log\CustomFormatter::class,,
])
```

Laravel 默认日志格式：

```php
'app' => Config::single('app', [
    'formatter' => null,
])
```

更多日志通道配置请参考 [Laravel 日志文档](https://laravel.com/docs/13.x/logging)
