---
title: Seeder 自动发现 | 数据库
---

# Seeder 自动发现

`Pin\Database\DatabaseSeeder` 提供 Seeder 自动发现能力。

## 基本开始

让项目中的 `DatabaseSeeder` 继承 `Pin\Database\DatabaseSeeder`：

```php
namespace Database\Seeders;

class DatabaseSeeder extends \Pin\Database\DatabaseSeeder
{
}
```

然后执行：

```bash
php artisan db:seed
```

## 自动发现规则

Pin 默认扫描：

```text
database/seeders
```

仅会发现文件名匹配以下规则的 Seeder：

```text
*Seeder.php
```

例如：

```text
database/seeders/UserSeeder.php
database/seeders/Content/ArticleSeeder.php
```

## 文件路径与命名空间

Seeder 文件需要遵循 Laravel 默认的命名空间约定。

例如：

```text
database/seeders/UserSeeder.php
```

对应：

```php
Database\Seeders\UserSeeder
```

子目录会映射到命名空间：

```text
database/seeders/Content/ArticleSeeder.php
```

对应：

```php
Database\Seeders\Content\ArticleSeeder
```

Seeder 类应保持文件路径、命名空间和类名一致：

```php
namespace Database\Seeders\Content;

use Illuminate\Database\Seeder;

class ArticleSeeder extends Seeder
{
    public function run(): void
    {
        //
    }
}
```

## 执行顺序

自动发现适用于相互独立的基础数据。

对于存在明确依赖关系的 Seeder，不建议依赖文件扫描顺序。可以通过显式调用定义执行顺序：

```php
namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            AdminSeeder::class,
        ]);
    }
}
```
