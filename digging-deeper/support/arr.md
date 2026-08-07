## 数组

### 递归合并

`Arr::merge()` 用于递归合并数组。

与 PHP 原生 `array_merge_recursive()` 不同，当字符串键发生冲突时，后面的值会覆盖前面的值，而不是合并为数组。

```php
use Pin\Support\Arr;

Arr::merge(
    [
        'database' => [
            'host' => 'localhost',
            'port' => 3306,
        ],
    ],
    [
        'database' => [
            'host' => '127.0.0.1',
        ],
    ],
);


// [
//     'database' => [
//         'host' => '127.0.0.1',
//         'port' => 3306,
//     ],
// ]
```

默认情况下，相同数字键会追加新值：

```php
Arr::merge(
    [1 => ['one']],
    [1 => ['two']],
);

// [
//     1 => ['one'],
//     2 => ['two'],
// ]
//
```

如需在数字键冲突时覆盖原值，可将第一个参数设为 `true`：

```php
Arr::merge(
    true,
    [1 => ['one']],
    [1 => ['two']],
);

// [
//     1 => ['two'],
// ]
```

### null 转空字符串

`Arr::nullToEmptyString()` 会递归将数组中的 `null` 值转换为空字符串。

```php
use Pin\Support\Arr;

$data = Arr::nullToEmptyString([
    'name' => null,
    'profile' => [
        'nickname' => null,
    ],
]);

// [
//     'name' => '',
//     'profile' => [
//         'nickname' => '',
//     ],
// ]
```

### 扁平数组转树

`Arr::toTree()` 将扁平数组转换为树结构。

每个元素需要包含父级字段，默认使用 `pid`：

```php
use Pin\Support\Arr;

$tree = Arr::toTree([
    ['id' => 1, 'name' => '电子产品', 'pid' => 0],
    ['id' => 2, 'name' => '手机', 'pid' => 1],
    ['id' => 3, 'name' => '手机配件', 'pid' => 2],
    ['id' => 4, 'name' => '手机壳', 'pid' => 3],
]);
```

返回结果：

```php
[
    [
        'id' => 1,
        'name' => '电子产品',
        'pid' => 0,
        'children' => [
            [
                'id' => 2,
                'name' => '手机',
                'pid' => 1,
                'children' => [
                    [
                        'id' => 3,
                        'name' => '手机配件',
                        'pid' => 2,
                        'children' => [
                            [
                                'id' => 4,
                                'name' => '手机壳',
                                'pid' => 3,
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ],
]
```

默认从 `pid = 0` 的节点开始构建树，并将子节点保存到 `children` 字段。

可以自定义父级字段和子节点字段：

```php
$tree = Arr::toTree(
    $data,
    'parent_id',
    'items',
);
```

### 敏感字段脱敏 {#arr-mask-sensitive}

`Arr::maskSensitive()` 用于递归脱敏数组中的字段值。

```php
use Pin\Support\Arr;

$payload = Arr::maskSensitive([
    'username' => 'root',
    'password' => 'secret123',
    'database' => [
        'Password' => 'db-secret',
    ],
]);
```

返回：

```php
[
    'username' => 'root',
    'password' => 'sec******',
    'database' => [
        'Password' => 'db-******',
    ],
]
```

脱敏规则参见 [Str::maskSensitive()](#str-mask-sensitive)。
