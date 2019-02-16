<?php

namespace addons\epay\controller;

use addons\epay\library\Service;
use think\addons\Controller;

/**
 * API接口控制器
 *
 * @package addons\epay\controller
 */
class Api extends Controller
{

    protected $config = [];

    public function _initialize()
    {
        parent::_initialize();
    }

    /**
     * 默认方法
     */
    public function index()
    {
        $this->error();
    }

    /**
     * 支付成功回调
     */
    public function notify()
    {
        $type = $this->request->param('type');
        $pay = Service::checkNotify($type);
        if (!$pay) {
            echo '签名错误';
            return;
        }
        //你可以在这里你的业务处理逻辑,比如处理你的订单状态、给会员加余额等等功能
        //下面这句必须要执行,且在此之前不能有任何输出
        echo $pay->success();
        return;
    }

    /**
     * 支付成功返回
     */
    public function returnx()
    {
        $type = $this->request->param('type');
        $result = Service::checkReturn($type);
        if (!$result) {
            $this->error('签名错误');
        }
        //你可以在这里定义你的提示信息,但切记不可在此编写逻辑
        $this->success("恭喜你！支付成功!", addon_url("epay/index/index"));

        return;
    }

}
