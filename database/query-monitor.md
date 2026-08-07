---
title: SQL 监控 | 数据库
---

# SQL 监控

Pin 默认启用 SQL 监控，用于记录数据库查询、识别慢查询，并在调试响应中返回 SQL 信息。
|

## 开启 SQL 日志

满足以下任一条件时，SQL 会写入 `sql` 日志：

- `app.debug = true`
- `logging.sql_logging = true`
- SQL 为慢查询

其中：

- 普通 SQL 使用 `debug` 级别。
- 慢查询使用 `notice` 级别。

### SQL 长度限制

SQL 日志会自动限制 SQL 最大长度，默认值为 `10240`。

可以通过 `logging.sql_max_length` 调整：

```php
'logging' => [
    'sql_max_length' => 10240,
],
```

超过最大长度时，SQL 会自动截断：

```sql
select * from `large_table` where `payload` = '...(...2480)
```

## 在响应中返回 SQL {#response}

满足以下任一条件时，SQL 会包含在[响应调试](/features/response#debug)信息中：

- `app.debug = true`
- `logging.response.include_sql = true`

示例响应：

```json
{
  "code": 0,
  "message": "请求成功",
  "data": {
    "id": 1,
    "name": "Pin"
  },
  "debug": {
    "sql_count": 2,
    "sql_time": 8,
    "sqls": [
      {
        "sql": "select * from `users` where `id` = 1 limit 1",
        "time": 3
      },
      {
        "sql": "select * from `roles` where `user_id` = 1",
        "time": 5
      }
    ]
  }
}
```

## 忽略指定 SQL

可以通过 `logging.channels.sql.ignores` 忽略指定 SQL：

```php
'channels' => [
    'sql' => [
        // ...
        'ignores' => [
            'telescope_entries',
            '/^select .* from `sessions`/',
        ],
    ],
],
```

忽略规则支持以下两种形式：

| 规则形式    | 匹配方式         |
| ----------- | ---------------- |
| 普通字符串  | 按包含关系匹配   |
| 以 `/` 开头 | 按正则表达式匹配 |
