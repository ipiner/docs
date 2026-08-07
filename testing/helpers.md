---
title: 辅助工具 | 测试相关
---

# 辅助工具

Pin 提供测试辅助工具，用于简化测试用例编写和统一测试描述。

## 启用测试辅助

使用 Pin 提供的 Pest helper 前，需要在测试入口处初始化：

```php
<?php

namespace Tests;

use Pin\Testing\Pest;

Pest::boot();

abstract class TestCase extends \Illuminate\Foundation\Testing\TestCase
{
    //
}
```

## Pest 描述增强

Pin 提供一组用于生成 Pest `it()` 描述文本的 helper，用于统一测试用例名称。

这些 helper 仅负责生成测试描述，不参与请求执行或断言流程。

| 方法                             | 输出示例                                      |
| -------------------------------- | --------------------------------------------- |
| `creates($name)`                 | `creates user successfully`                   |
| `failsToCreate($name)`           | `fails to create user`                        |
| `updates($name)`                 | `updates user successfully`                   |
| `failsToUpdate($name)`           | `fails to update user`                        |
| `deletes($name)`                 | `deletes user successfully`                   |
| `failsToDelete($name)`           | `fails to delete user`                        |
| `lists($name)`                   | `lists users successfully`                    |
| `validatesCreatePayload($name)`  | `validates payload for creating user`         |
| `validatesCreateRequired($name)` | `validates required fields for creating user` |
| `validatesUpdatePayload($name)`  | `validates payload for updating user`         |
| `validatesUpdateRequired($name)` | `validates required fields for updating user` |
| `ensuresUnique($name, $field)`   | `ensures user's username is unique`           |
| `runTestsAutomatically($name)`   | `runs user's tests automatically`             |

```php

it(creates('user'), function () {
    UserRoute::Create->testing($this)->created();
});

it(validatesCreateRequired('user'), function () {
    UserRoute::Create
        ->testing($this)
        ->withPayload([])
        ->json()
        ->assertInvalid(['username']);
});

it(ensuresUnique('user', 'username'), function () {
    UserRoute::Create
        ->testing($this)
        ->fakePayload(['username' => 'pin'])
        ->created();

    UserRoute::Create
        ->testing($this)
        ->fakePayload(['username' => 'pin'])
        ->json()
        ->assertInvalid(['username']);
});
```
