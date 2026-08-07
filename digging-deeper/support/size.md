## 大小单位

`Pin\Support\Size` 用于在人类可读大小和字节数之间转换。

```php
use Pin\Support\Size;

Size::format(2147483648); // 2G
Size::format(524288);     // 512K

Size::toBytes('10B');  // 10
Size::toBytes('1K');   // 1024
Size::toBytes('0.5M'); // 524288
Size::toBytes('2G');   // 2147483648
```

::: info
`toBytes()` 根据字符串后缀识别单位，支持 `b`、`k`、`kb`、`m`、`mb`、`g`、`gb`（不区分大小写）。
:::
