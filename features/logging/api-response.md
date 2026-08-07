## API 响应日志

Pin 提供 API 响应日志，用于记录请求结果、异常响应和慢请求信息。

API 响应日志由 `Pin\Http\Middleware\LogApiResponse` 中间件负责，默认已开启。

### 配置

API 响应日志配置位于：

```php
config/logging.php


'response' => [
    //
],
```

#### 慢请求

`logging.response.slow_threshold` 支持秒和毫秒：

| 配置  | 阈值   |
| ----- | ------ |
| `2`   | 2000ms |
| `0.5` | 500ms  |
| `500` | 500ms  |

规则：

- `<=10` 按秒解析；
- `>10` 按毫秒解析。

默认值为 `2`，即 `2000ms`。

### 记录规则

API 响应日志仅记录符合标准响应结构且未被排除的请求。

记录逻辑如下：

| 条件                            | 是否记录 |
| ------------------------------- | -------- |
| 非标准 JSON 响应                | 否       |
| 命中排除路由                    | 否       |
| 调试模式开启                    | 记录     |
| `logging.response.enabled=true` | 记录     |
| 业务失败                        | 记录     |
| 慢请求                          | 记录     |
| 普通成功请求                    | 不记录   |

::: info
当调试模式或 `logging.response.enabled` 开启时，会记录所有符合条件的 API 响应。

默认情况下，仅记录业务失败和慢请求。
:::

### 日志内容

API 响应日志写入 `api` channel。

### 日志级别

| 条件       | 级别     |
| ---------- | -------- |
| HTTP `5xx` | `error`  |
| 业务失败   | `info`   |
| 慢请求     | `notice` |
| 普通请求   | `debug`  |

### 请求数据

请求数据默认不会记录。

以下情况会记录请求数据：

- 调试模式；
- 业务失败；
- 开启 `include_request_payload`。

::: warning
生产环境开启请求数据记录时，应注意过滤密码、Token 等敏感信息。
:::

### 响应数据

响应数据默认会写入日志。

可以通过 `logging.response.ignore_response_data` 配置不记录响应数据的路由。

当响应数据超过 `logging.response.max_length` 时会自动截断。

响应数据写入日志前会经过[敏感字段脱敏](/digging-deeper/support#arr-mask-sensitive)。
