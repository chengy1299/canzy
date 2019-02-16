<?php

namespace app\api\controller;

use app\common\controller\Api;
use app\common\model\Order as OrderModel;
use app\common\model\User;
use think\Db;
use think\Log;
use app\common\library\WxPay;

/**
 * 支付回调
 */
class Pay extends Api
{

    //如果$noNeedLogin为空表示所有接口都需要登录才能请求
    //如果$noNeedRight为空表示所有接口都需要验证权限才能请求
    //如果接口已经设置无需登录,那也就无需鉴权了
    //
    // 无需登录的接口,*表示全部
    protected $noNeedLogin = ['*'];
    // 无需鉴权的接口,*表示全部
    protected $noNeedRight = ['*'];

    // 微信支付回调(APP支付成功后,会调用你填写的回调地址)
    public function wx_notify(){
        $WxPay = new WxPay;
        //接收微信返回的数据数据,返回的xml格式
        $xmlData = file_get_contents('php://input');
        //将xml格式转换为数组
        $data = $WxPay->FromXml($xmlData);
        
        Log::write('wxpay_notify 微信支付成功异步通知:数据 '.print_r($data,true),'pay');
        //为了防止假数据，验证签名是否和返回的一样。
        //记录一下，返回回来的签名，生成签名的时候，必须剔除sign字段。
        $sign = $data['sign'];
        unset($data['sign']);
        if($sign == $WxPay->getSign($data)){
            //签名验证成功后，判断返回微信返回的
            if ($data['result_code'] == 'SUCCESS') {
                //根据返回的订单号做业务逻辑           

                //验证订单是否存在
                $where['pay_no'] = $data['out_trade_no'];
                $where['pay_status'] = 0;
                $check = Db::table('tb_pay')->where($where)->count(1);
                unset($where['pay_status']);
                
                if(!$check)
                {
                    Log::write('wxpay_notify 微信支付成功异步通知:订单不存在'.print_r($data,true),'pay');
                    echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>';exit();
                }

                Db::startTrans();
                $time = time();
                
                $chargeInfo = Db::table("tb_pay")->alias('p')
                ->join('tb_user u','u.id = p.user_id')
                ->field('p.pay_no,p.user_id,p.order_id,p.charge_id,p.money,u.pid,u.total_charge,u.e_coin')
                ->where(array('p.pay_no'=>$data['out_trade_no']))->lock(true)->find();
                
                //验证金额是否正确
                if(($chargeInfo['money']*100) != $data['total_fee']){
                    Log::write('wxpay_notify 微信支付成功异步通知:金额有误'.print_r($data,true),'pay');
                    echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[金额有误]]></return_msg></xml>';exit();
                }

                $up1 = true;
                $up2 = true;
                $up3 = true;
                $up4 = true;

                if($chargeInfo['order_id'] > 0)
                {//支付订单
                    //验证金额是否正确
                    $order = OrderModel::get(['order_id'=>$chargeInfo['order_id']]);

                    if(($order->order_amount * 100) != ($chargeInfo['money']*100))
                    {
                        Db::rollback();
                        Log::write('wxpay_notify 微信支付成功异步通知:业务处理失败，金额有误'.print_r($data,true),'pay');
                        echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[金额有误]]></return_msg></xml>';exit();
                    }
                    //赠送优惠价和e币
                    $coin = config('e_coin');
                    if($coin['on']===true && $coin['condition'] <= $order->order_amount)
                    {   
                        //生成E币明细
                        $param = [];
                        $param['user_id'] = $chargeInfo['user_id'];
                        $param['order_id'] = 0;
                        $param['money'] = $coin['coin'];
                        $param['e_coin'] = $chargeInfo['e_coin'] + $coin['coin'];
                        $param['type'] = 1;
                        $param['note'] = '订单奖励';
                        $param['createtime'] = $time;
                        $param['updatetime'] = $time;
                        $up1 = Db::table('tb_coin_detail')->insert($param);
                        if(!$up1)
                        {
                            Db::rollback();
                            Log::write('wxpay_notify 微信支付成功异步通知:业务处理失败，添加e币记录失败'.print_r($data,true),'pay');
                            echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                        }
                        //添加e币
                        $up2 = Db::table('tb_user')->where(['id'=>$chargeInfo['user_id']])->setInc('e_coin',$coin['coin']);
                        if(!$up2)
                        {
                            Db::rollback();
                            Log::write('wxpay_notify 微信支付成功异步通知:业务处理失败，添加e币失败'.print_r($data,true),'pay');
                            echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                        }
                        //赠送推荐人
                        if($chargeInfo['pid'] > 0)
                        {   
                            $piduser = Db::table('tb_user')->where(['id'=>$chargeInfo['pid']])->field('e_coin')->find();
                            $param['e_coin'] = $piduser['e_coin'] + $coin['coin'];
                            $param['user_id'] = $chargeInfo['pid'];
                            $ret = Db::table('tb_coin_detail')->insert($param);
                            if(!$ret)
                            {
                               Db::rollback();
                               Log::write('wxpay_notify 微信支付成功异步通知:业务处理失败，添加e币记录失败'.print_r($data,true),'pay');
                               echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                            }
                            //添加e币
                            $ret = Db::table('tb_user')->where(['id'=>$chargeInfo['pid']])->setInc('e_coin',$coin['coin']);
                            if(!$ret)
                            {
                               Db::rollback();
                               Log::write('wxpay_notify 微信支付成功异步通知:业务处理失败，添加e币记录失败'.print_r($data,true),'pay');
                               echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                            }
                        }
                    }
                    $reward = config('reward_coupon');
                    if($reward['on']===true && $chargeInfo['pid'] > 0 && $reward['condition'] <= $order->order_amount)
                    {   
                        $expires_in = strtotime(date('Y-m-d',$time));
                        $expiretime = strtotime(date('Y-m-d',$time + ($reward['reward']['expires'] * 86400)).' 23:59:59');
                        $param = [];
                        $param['user_id'] = $chargeInfo['pid'];
                        $param['worth'] = $reward['reward']['worth'];
                        $param['desc'] = $reward['reward']['desc'];
                        $param['condition'] = $reward['reward']['condition'];
                        $param['expires_in'] = $expires_in;
                        $param['expiretime'] = $expiretime;
                        $param['createtime'] = $time;
                        $param['updatetime'] = $time;
                        $up4 = Db::table('tb_coupon')->insert($param);
                        if(!$up4)
                        {
                            Db::rollback();
                            Log::write('wxpay_notify 微信支付成功异步通知:业务处理失败，生成优惠卷失败'.print_r($data,true),'pay');
                            echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                        }
                    }
                    $order->payment_time = $time;//支付时间
                    $order->take_food_no = $order->order_id;//取餐号
                    $order->order_state = 2;//已付款
                    $order->pay_no = $chargeInfo['pay_no'];//支付单号
                    $order->updatetime = $time;
                    try {
                        $order->save();
                    } catch (Exception $e) {
                        Db::rollback();
                        Log::write('wxpay_notify 微信支付成功异步通知:业务处理失败，更新订单失败'.print_r($data,true),'pay');
                        echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                    }
                }else if($chargeInfo['charge_id'] > 0)
                {//充值
                    $userMoney = Db::table('tb_user')->where(array('id'=>$chargeInfo['user_id']))->field('total_charge')->find();

                    $up1 = Db::table('tb_user')->where(array('id'=>$chargeInfo['user_id']))->setInc('total_charge',$chargeInfo['money']);
                    if(!$up1)
                    {
                       Db::rollback();
                       Log::write('wxpay_notify 微信支付成功异步通知:业务处理失败，更新用户余额失败'.print_r($data,true),'pay');
                        echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                    }
                    //生成余额明细
                    $param = [];
                    $param['user_id'] = $chargeInfo['user_id'];
                    $param['order_id'] = 0;
                    $param['money'] = $chargeInfo['money'];
                    $param['total_charge'] = $userMoney['total_charge'] + $chargeInfo['money'];
                    $param['type'] = 1;
                    $param['note'] = '余额充值';
                    $param['createtime'] = $time;
                    $param['updatetime'] = $time;
                    $up2 = Db::table('tb_charge_detail')->insert($param);
                    if(!$up2)
                    {
                       Db::rollback();
                       Log::write('wxpay_notify 微信支付成功异步通知:业务处理失败，生成余额明细失败'.print_r($data,true),'pay');
                        echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                    }
                    //生成优惠卷
                    $charge = Db::table('tb_charge_worth')->where(['id'=>$chargeInfo['charge_id']])->find();
                    $temp = [];
                    $expires_in = strtotime(date('Y-m-d',$time));
                    $expiretime = strtotime(date('Y-m-d',$time + ($charge['expires'] * 86400)).' 23:59:59');
                    for ($i=1; $i <= $charge['num']; $i++) { 
                        $params = [];
                        $params['user_id'] = $chargeInfo['user_id'];
                        $params['worth'] = $charge['cou_worth'];
                        $params['desc'] = $charge['cou_desc'];
                        $params['condition'] = $charge['condition'];
                        $params['expires_in'] = $expires_in;
                        $params['expiretime'] = $expiretime;
                        $params['createtime'] = $time;
                        $params['updatetime'] = $time;
                        $temp[] = $params;
                    }
                    $up4 = Db::table('tb_coupon')->insertAll($temp);
                    if(!$up4)
                    {
                       Db::rollback();
                       Log::write('wxpay_notify 微信支付成功异步通知:业务处理失败，生成优惠卷失败'.print_r($data,true),'pay');
                        echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                    }
                    //如果有E币赠送
                    if($charge['e_coin'] > 0 )
                    {   
                        //生成E币明细
                        $param = [];
                        $param['user_id'] = $chargeInfo['user_id'];
                        $param['order_id'] = 0;
                        $param['money'] = $charge['e_coin'];
                        $param['e_coin'] = $chargeInfo['e_coin'] + $charge['e_coin'];
                        $param['type'] = 1;
                        $param['note'] = '充值奖励';
                        $param['createtime'] = $time;
                        $param['updatetime'] = $time;
                        $ret = Db::table('tb_coin_detail')->insert($param);
                        if(!$ret)
                        {
                            Db::rollback();
                            Log::write('wxpay_notify 微信支付成功异步通知:充值奖励-业务处理失败，添加e币记录失败'.print_r($data,true),'pay');
                            echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                        }
                        //添加e币
                        $ret = Db::table('tb_user')->where(['id'=>$chargeInfo['user_id']])->setInc('e_coin',$charge['e_coin']);
                        if(!$ret)
                        {
                            Db::rollback();
                            Log::write('wxpay_notify 微信支付成功异步通知:充值奖励-业务处理失败，添加e币失败'.print_r($data,true),'pay');
                            echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                        }
                    }
                }

                $te['order_no'] = $data['transaction_id'];
                $te['pay_time'] = $time;
                $te['updatetime'] = $time;
                $te['pay_status'] = 1;
                //更新支付状态 pay_status = 1
                $up3 = Db::table('tb_pay')->where($where)->update($te);

                if(!$up1 || !$up2 || !$up3 || !$up4){
                    Db::rollback();
                    Log::write('wxpay_notify 微信支付成功异步通知:业务处理失败'.print_r($data,true),'pay',0,'pay.log');
                    echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务处理失败]]></return_msg></xml>';exit();
                }

                Db::commit();
                //处理完成之后，告诉微信成功结果！
                echo '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>';exit();
                
            }
              //支付失败，输出错误信息
            else{  
                Log::write('wxpay_notify 微信支付成功异步通知，支付失败，输出错误信息：'.print_r($data,true),'pay');
                echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>';exit();
            }
        }else{  
            Log::write('wxpay_notify 微信支付成功异步通知，错误信息，签名验证失败：'.print_r($data,true),'pay'); 
            echo '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名验证失败]]></return_msg></xml>';exit();
        }

    }
}
