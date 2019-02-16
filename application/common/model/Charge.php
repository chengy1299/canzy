<?php

namespace app\common\model;

use think\Model;

/**
 * 充值
 */
class Charge Extends Model
{
   
    // 表名
    protected $name = 'charge_worth';
    // 开启自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';
    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updateTime';
    // 追加属性
    protected $append = [
    ];

}
