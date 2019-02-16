<?php

namespace addons\epay;

use app\common\library\Menu;
use think\Addons;
use think\Config;
use think\Loader;

/**
 * 企业支付插件
 */
class Epay extends Addons
{

    /**
     * 插件安装方法
     * @return bool
     */
    public function install()
    {

        return true;
    }

    /**
     * 插件卸载方法
     * @return bool
     */
    public function uninstall()
    {

        return true;
    }

    /**
     * 插件启用方法
     * @return bool
     */
    public function enable()
    {

        return true;
    }

    /**
     * 插件禁用方法
     * @return bool
     */
    public function disable()
    {

        return true;
    }

    /**
     * 渲染payment配置信息
     */
    public function appInit()
    {
        $payment = include_once ADDON_PATH . 'epay' . DS . 'config' . DS . 'payment.php';
        Config::set('payment', $payment);

        //添加支付包的命名空间
        Loader::addNamespace('Yansongda', ADDON_PATH . 'epay' . DS . 'library' . DS . 'Yansongda' . DS);
    }

}
