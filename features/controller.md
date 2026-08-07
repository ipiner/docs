---
title: 控制器 | 核心功能
---

# 控制器

`Pin\Http\Controller` 继承 Laravel 基础控制器，并提供 `success()` 和 `error()` 方法，用于返回统一结构的 API 响应。

控制器可继续按照 Laravel 的方式组织业务逻辑，并使用对应方法返回响应。

## 成功响应

使用 `success()` 返回成功响应：

```php
use Pin\Http\ApiResponse;
use Pin\Http\Controller;

class UserController extends Controller
{
    public function show(int $id): ApiResponse
    {
        return $this->success([
            'id' => $id,
            'name' => 'Pin',
        ]);
    }
}
```

更多用法请参阅[成功响应](/features/response#success)。

## 错误响应

使用 `error()` 返回错误响应：

```php
use Pin\Errors\Errors;

public function delete(int $id): ApiResponse
{
    if (! $this->service->canDelete($id)) {
        return $this->error(Errors::DeleteFailed)->withStatusCode(403);
    }

    return $this->success();
}
```

更多用法请参阅[错误响应](/features/response#error)。
