---
title: 日志模块 | 扩展包
---

# 日志模块

[ipiner/modules-log](https://github.com/ipiner/modules-log) 提供统一的业务日志管理能力。

## 安装

```bash
composer require ipiner/modules-log
```

## 日志类型

模块提供以下日志类型：

- [操作日志](/packages/log/operation)：记录用户对业务资源的操作行为。
- [行为日志](/packages/log/activity)：记录用户或系统产生的业务行为事件。
- [登录日志](/packages/log/login)：记录用户登录事件。

## 发布

模块提供配置文件和数据库迁移发布支持。

### 配置

日志模块配置文件为 `config/pin/modules/log.php`。

可按需发布配置：

```bash
php artisan vendor:publish --tag=pin-modules-log-config
```

### 迁移

```bash
php artisan vendor:publish --tag=pin-modules-log-migrations
```

::: info
仅在需要使用数据库日志时保留相关迁移，迁移结构可根据业务需求进行调整。
:::

执行迁移：

```bash
php artisan migrate
```

## 数据结构 {#table-columns}

日志记录表包含以下通用字段：

| 字段       | 类型            | 说明     |
| ---------- | --------------- | -------- |
| id         | int unsigned    | 日志 ID  |
| created_at | timestamp       | 创建时间 |
| uid        | bigint unsigned | 用户 ID  |
| username   | varchar(30)     | 用户名称 |
| user_type  | varchar(30)     | 用户类型 |
| ip         | varchar(45)     | 请求 IP  |
| request_id | varchar(36)     | 请求 ID  |

操作日志和行为日志额外包含以下通用字段：

| 字段         | 类型            | 说明                |
| ------------ | --------------- | ------------------- |
| event        | varchar(30)     | 行为事件 / 操作事件 |
| subject_id   | bigint unsigned | 关联对象 ID         |
| subject_type | varchar(255)    | 关联对象类型        |
| subject_name | varchar(255)    | 关联对象名称        |
