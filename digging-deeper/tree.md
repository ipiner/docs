---
title: Tree（树）| 核心功能
---

# Tree（树）

Pin 提供 Tree（树） 支持，用于处理具有父子关系的数据结构。

## 树结构

树结构依赖以下字段：

| 字段    | 说明                                              |
| ------- | ------------------------------------------------- |
| `id`    | 节点 ID                                           |
| `pid`   | 父节点 ID，根节点为 `0`                           |
| `path`  | 节点物化路径，例如 `1/2/10`                       |
| `paths` | 节点路径数组，例如 `[1, 2, 10]`（由 `path` 解析） |
| `level` | 节点层级，由路径深度计算得到                      |
| `sort`  | 同级排序值，为空或 `-1` 时使用节点 ID             |
| `name`  | 节点名称，用于展示和完整名称解析                  |

## 树模型

Pin 提供 `Pin\Tree\TreeModel` 作为树模型基类。

继承 `TreeModel` 后，模型会自动维护节点 ID、父节点、路径、层级和排序等树相关字段。

```php
use Pin\Tree\TreeModel;

class Category extends TreeModel
{
}
```

### 层级限制

Pin Tree 支持限制树结构的最大层级。

默认不限制，可通过配置调整：

```php
// config/pin/tree.php

return [
    'max_level' => 5,
];
```

也可以通过重写 `maxTreeLevel()` 方法，为单个树模型定义独立限制：

```php
use Override;

#[Override]
protected function maxTreeLevel(): int
{
    return 5;
}
```

例如：

```
层级一
  └── 层级二
      └── 层级三
```

当最大层级设置为 `3` 时：

- 创建第四级节点会失败；
- 移动节点后导致子树超过三级时，移动操作会失败。

### 创建节点

```php
$parent = Category::create([
    'name' => '电子产品',
]);

$phone = Category::create([
    'name' => '手机',
    'pid' => $parent->id,
]);

$phoneAccessory = Category::create([
    'name' => '手机配件',
    'pid' => $phone->id,
]);

$phoneCase = Category::create([
    'name' => '手机壳',
    'pid' => $phoneAccessory->id,
]);
```

生成的树：

```
电子产品
  └── 手机
      └── 手机配件
          └── 手机壳
```

对应节点数据：

| id  | name     | pid | path      | level |
| --- | -------- | --- | --------- | ----- |
| 1   | 电子产品 | 0   | `1`       | 1     |
| 2   | 手机     | 1   | `1/2`     | 2     |
| 3   | 手机配件 | 2   | `1/2/3`   | 3     |
| 4   | 手机壳   | 3   | `1/2/3/4` | 4     |

### 移动节点

更新节点的 `pid` 即可移动节点。

例如，将「手机」从「电子产品」下移动为根节点：

```php
$phone->update(['pid' => 0]);
```

移动后：

```
电子产品

手机
└── 手机配件
    └── 手机壳
```

移动节点后，当前节点及其子节点的路径和层级会同步更新。

对应节点数据：

| id  | name     | pid | path    | level |
| --- | -------- | --- | ------- | ----- |
| 1   | 电子产品 | 0   | `1`     | 1     |
| 2   | 手机     | 0   | `2`     | 1     |
| 3   | 手机配件 | 2   | `2/3`   | 2     |
| 4   | 手机壳   | 3   | `2/3/4` | 3     |

### 查询节点

`TreeModel` 提供了用于查询树的方法，可以方便地获取祖先节点、后代节点和子节点。

#### 查询祖先节点

`ancestors()` 方法用于获取当前节点的所有祖先节点，不包含当前节点。

例如，查询「手机壳」的祖先：

```php
$ancestors = $phoneAccessory->ancestors();
```

返回：

```
电子产品
手机
手机配件
```

::: info
返回结果按照从根节点到直接父节点的顺序排列。
:::

#### 查询后代节点

`descendants()` 方法用于获取当前节点的所有后代节点，不包含当前节点本身。

例如，查询「手机」下的所有分类：

```php
$descendants = $phone->descendants();
```

返回：

```
手机配件
手机壳
```

#### 查询直接子节点

`children` 关系用于获取当前节点的直接子节点，不包含更深层级的节点。

例如，查询「手机」下的直接子分类：

```php
$children = $phone->children;
```

返回：

```
手机配件
```

### 获取节点完整名称

`fullName` 属性可以根据节点路径生成当前节点的完整名称。

例如：

```php
$fullName = $phoneCase->fullName;
```

返回：

```
电子产品 / 手机 / 手机配件 / 手机壳
```

完整名称默认使用 `/` 分隔，也可以通过 `namePath()` 方法指定分隔符：

```php
$fullName = $phoneCase->namePath(' > ');
```

返回：

```
电子产品 > 手机 > 手机配件 > 手机壳
```

如果需要获取名称数组，可以将分隔符设置为 `null`：

```php
$names = $phoneCase->namePath(null);

// ['电子产品', '手机', '手机配件', '手机壳']
```

### 查询排序 {#ordered-query}

`orderedQuery()` 方法返回适用于树形展示的查询构造器。

```php
$categories = Category::orderedQuery()->get();
```

查询结果会按照节点层级、同级排序值和节点 ID 依次排序：

1. `level`
2. `sort`
3. `id`

## 树工具

### 排序树

`Tree::sort()` 用于对树节点集合进行排序。

```php
use Pin\Support\Facades\Tree;

$sorted = Tree::sort($categories);
```

排序规则与[查询排序](#ordered-query)一致

### 过滤树

`Tree::filter()` 方法可以根据条件过滤节点。

例如，过滤禁用分类：

过滤前：

```
电子产品
├── 手机
│   └── 手机配件
└── 电脑

服装
```

如果「手机」已禁用：

```php
use Pin\Support\Facades\Tree;

$visible = Tree::filter(
    $categories,
    fn ($item) => ! $item->isDisabled()
);
```

返回结果：

```
电子产品
└── 电脑

服装
```

被过滤节点及其子树都会从结果中移除。

### 校验树

`Tree::check()` 方法用于校验树节点结构是否一致：

```php
use Pin\Support\Facades\Tree;

$errors = Tree::check($categories);
```

返回错误列表：

```php
[
    [
        'id' => 2,
        'rule' => 'path_mismatch',
        'message' => 'expect=[1,2] got=[3,2]',
    ],
]
```

校验内容包括：

- `paths` 是否存在；
- `level` 是否与路径深度一致；
- 路径末尾是否为当前节点 ID；
- 根节点路径长度是否为 1；
- 父节点是否存在；
- 父子节点路径是否保持一致。

例如：

```
电子产品
└── 手机
```

正常：

| id  | path  |
| --- | ----- |
| 1   | `1`   |
| 2   | `1/2` |

异常：

| id  | path  |
| --- | ----- |
| 2   | `3/2` |

校验结果：

```php
[
    [
        'id' => 2,
        'rule' => 'path_mismatch',
        'message' => 'expect=[1,2] got=[3,2]',
    ],
]
```

## Tree Action

Tree Action 提供树节点创建和更新时的基础校验能力。

```php
use Override;
use Pin\Tree\Action;

class CreateCategoryAction extends Action
{
    public function __construct(protected CategoryService $service)
    {
        //
    }

    public function handle()
    {
        return $this->service->create($this->validated());
    }

    #[Override]
    protected function rules(): array
    {
        return [
            ...$this->basicRules(),

            // 业务字段规则
        ];
    }
}
```

复用基础规则后，Action 会自动校验：

- 节点名称；
- 父节点关系；
- 排序值。

同时支持：

- 同级节点名称唯一；
- 父节点有效性校验；
- 防止循环引用。

## 树模型服务 {#tree-model-service}

`Pin\Tree\ModelService` 用于处理树模型的创建、更新和删除，详见[模型服务](/model/service)。

```php
use Pin\Tree\ModelService;

class CategoryService extends ModelService
{
    public string $resourceName = '分类';
}
```
