---
title: 文件上传 | 扩展包
---

# 文件上传

[ipiner/upload](https://github.com/ipiner/upload) 基于 Laravel 文件上传能力扩展，用于统一处理文件验证、存储、图片处理以及文件元数据管理。

## 安装

```bash
composer require ipiner/upload
```

## 配置

上传配置文件为 `config/pin/upload.php`。

可按需发布配置：

```bash
php artisan vendor:publish --tag=pin-upload-config
```

## 快速开始

以下示例展示一个图片上传流程，包括文件验证、存储以及缩略图生成：

验证：

```php
use Pin\Upload\Rules\Upload;
use Pin\Upload\UploadedFile;

$request->validate([
    'avatar' => [
        'required',
        (new Upload())
            ->disk('public')
            ->max('2M')
            ->extensions(['jpg', 'jpeg', 'png', 'webp']),
    ],
]);
```

完成文件验证后，可以通过 `UploadedFile` 获取文件对象，并继续执行存储和图片处理：

```php
$file = UploadedFile::items($request->file('avatar'));

$path = $file->storeAs('avatars');

if ($file->isImage()) {
    $file->thumb(width: 's');
}

return [
    'path' => $path,
    'url' => $file->url(),
    'thumb' => $file->thumb,
];
```

## 文件对象

文件验证后，可以通过 `UploadedFile` 获取对应的文件对象。

获取单个文件：

```php
use Pin\Upload\UploadedFile;

$file = UploadedFile::item($request->file('avatar'));

// 或者通过表单字段
$file = UploadedFile::item('avatar');
```

获取当前请求中的全部文件：

```php
$files = UploadedFile::items();
```

文件对象封装了上传文件的基础信息，并提供存储、图片处理等操作方法。

### 文件元数据

文件对象包含以下主要字段：

| 字段        | 说明         |
| ----------- | ------------ |
| `file_id`   | 文件唯一标识 |
| `path`      | 文件相对路径 |
| `pathname`  | 文件绝对路径 |
| `name`      | 文件名称     |
| `extension` | 文件扩展名   |
| `size`      | 文件大小     |
| `mime_type` | MIME 类型    |
| `width`     | 图片宽度     |
| `height`    | 图片高度     |
| `original`  | 原始上传信息 |
| `disk`      | 存储磁盘     |
| `thumb`     | 缩略图信息   |
| `water`     | 水印信息     |

### 文件 URL

使用 `url()` 获取文件访问地址：

```php
$url = $file->url();
```

默认使用当前文件的路径和磁盘生成 URL。

也可以指定文件路径和存储磁盘：

```php
$url = $file->url(
    path: 'avatars/demo.png',
    disk: 'public',
);
```

## 图片处理

Pin 基于 [Intervention Image](https://github.com/Intervention/image) 提供图片处理能力，包括缩略图生成和水印添加。

```php
if ($file->isImage()) {
    // 图片处理
}
```

### 缩略图

使用 `thumb()` 生成缩略图：

```php
$file->thumb(
    width: 200,
);
```

| 参数      | 说明                                   |
| --------- | -------------------------------------- |
| `replace` | 是否覆盖原图                           |
| `width`   | 缩略图宽度，也可以使用配置中的尺寸名称 |
| `height`  | 缩略图高度，未指定时按比例缩放         |
| `source`  | 指定源图片路径                         |

默认尺寸配置为 `pin.upload.thumb`。

可以直接使用配置名称：

```php
$file->thumb(width: 's');
```

默认情况下，`thumb()` 会生成独立的缩略图，不会修改原文件。

生成结果可以通过 `$file->thumb` 获取。

如果需要直接替换原图，可以开启覆盖模式：

```php
$file->thumb(
    replace: true,
    width: 's',
);
```

### 水印

使用 `water()` 为图片添加水印：

```php
$file->water(
    image: storage_path('app/watermark.png'),
);
```

可以通过 `position` 指定水印位置：

```text
top-left
top
top-right
left
center
right
bottom-left
bottom
bottom-right
```

默认情况下会覆盖当前文件。

如果需要保留原文件，可以关闭覆盖模式：

```php
$file->water(
    image: storage_path('app/watermark.png'),
    replace: false,
);
```

非覆盖模式下，生成结果可以通过 `$file->water` 获取。

## Base64 文件

Pin 提供 `Base64File` 文件对象，用于处理前端提交的 Base64 文件内容。

### 创建文件

```php
use Pin\Upload\Base64File;

$file = new Base64File(
    $base64,
    name: 'avatar',
);
```

创建后，可以像普通上传文件一样进行验证和处理。

### 验证

```php
use Pin\Upload\Rules\Base64File;

$request->validate([
    'avatar' => [
        'required',
        new Base64File([
            'image/png',
            'image/jpeg',
            'image/webp',
        ]),
    ],
]);
```

`Base64File` 会将 Base64 内容转换为临时文件，并接入 Laravel 文件处理流程。

## 错误码

`Upload` 默认使用 Pin 错误码格式返回验证失败信息：

```text
code|message
```

如果不需要附带错误码，可以关闭：

```php
use Pin\Upload\Rules\Upload;

new Upload(false);
```
