<?php

namespace app\api\controller;

use app\common\controller\Api;
use think\Db;

/**
 * 首页接口
 */
class Index extends Api
{

    protected $noNeedLogin = ['*'];
    protected $noNeedRight = ['*'];

    /**
     * 首页
     * 
     */
    public function index()
    {   
        $this->success('请求成功');
    }
    
    /**
    *是否打样
    */
    public function open()
    {   
        $open = Db::table('tb_config')->where('id',18)->field('value')->find();
        $this->success('请求成功',isset($open['value'])?$open['value']:0);
    }

}
