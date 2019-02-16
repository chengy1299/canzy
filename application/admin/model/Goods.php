<?php

namespace app\admin\model;

use think\Model;

class Goods extends Model
{

    // 表名
    protected $name = 'goods_list';
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';
    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
    // 追加属性
    // protected $append = [
    //     'prevtime_text',
    //     'logintime_text',
    //     'jointime_text'
    // ];

    
    public function getGenderList()
    {
        return ['1' => __('Male'), '0' => __('Female')];
    }

    public function getStatusList()
    {
        return ['normal' => __('Normal'), 'hidden' => __('Hidden')];
    }

    public function type()
    {
        return $this->belongsTo('GoodsType', 'type_id', 'id', [], 'LEFT')->setEagerlyType(0);
    }

}
