<?php

namespace app\api\controller;

use app\common\controller\Api;
use app\common\model\Order as OrderModel;
use app\common\model\User;
use think\Db;
use app\common\library\WxPay;
use app\common\library\Reward;

/**
 * 示例接口
 */
class Order extends Api
{

    //如果$noNeedLogin为空表示所有接口都需要登录才能请求
    //如果$noNeedRight为空表示所有接口都需要验证权限才能请求
    //如果接口已经设置无需登录,那也就无需鉴权了
    //
    // 无需登录的接口,*表示全部
    protected $noNeedLogin = ["*"];
    // 无需鉴权的接口,*表示全部
    protected $noNeedRight = ['*'];

    /**
     * 提交订单（生成订单）
     *
     * @ApiTitle    
     * @ApiMethod   
     **/
    public function putorder()
    {   
        $token = $this->request->request('token');
        $user_id = $this->request->request('user_id');
        $cartList = $this->request->request('cartList');
        $sumMonney = $this->request->request('sumMonney');
        $cupNumber = $this->request->request('cupNumber');
        $eatType = $this->request->request('eatType');//用餐方式
        $payType = $this->request->request('payType');//支付方式
        $coupon_id = $this->request->request('coupon_id');//代金卷id
        $note = $this->request->request('note');//代金卷id
        $OrderTypetime = $this->request->request('OrderTypetime');//
        
        if(!$cartList || !$sumMonney || !$cupNumber || !$token || !$user_id || !$eatType || !$payType || !isset($coupon_id) )
        {
            $this->error(__('Invalid parameters'));
        }
        //验证用户
        $user = User::get(['id' => $user_id/*,'token'=>$token*/]);
        if (!$user)
        {
            $this->error('用户信息错误','error user');
        }
        $data = json_decode($cartList,true);
        //检测数量和金额
        $checkNum = 0;
        $checkPrice = 0;
        foreach ($data as $row) 
        {
            $checkNum += $row['number'];
            $price = Db::table('tb_goods_list')->where('id',$row['goods_id'])->Field('price')->find();
            $checkPrice += ($row['number']*$price['price']);
            //添加销量
            Db::table('tb_goods_list')->where('id',$row['goods_id'])->setInc('sales',$row['number']);
        }
        //判断数量和金额
        if($checkNum != $cupNumber || $checkPrice != $sumMonney)
        {
            $this->error('金额或数量有误','error count or money');
        }
        $coupon = config('wechatcup');
        //优惠
        $coupon_amount = 0;
        $order_amount = $sumMonney;
        if($coupon['is_coupon'] ==true)
        {
            $coupon_amount = $sumMonney >= $coupon['total_money'] ? $coupon['coupon'] : 0;
            $order_amount = $sumMonney >= $coupon['total_money'] ? $sumMonney - $coupon['coupon'] : $sumMonney;
        }

        //开启事务
        Db::startTrans();
        $time = time();
        //代金卷
        if($coupon_id > 0)
        {
            $jian_amount = Db::table('tb_coupon')
            ->where(['user_id'=>$user_id,'id'=>$coupon_id,'expires_in'=>['lt',time()],'expiretime'=>['gt',time()],'used'=>0])
            ->field('worth')
            ->lock(true)
            ->find();
            if($jian_amount)
            {
                $order_amount = $order_amount - $jian_amount['worth'];
                $ret = Db::table('tb_coupon')->where(['user_id'=>$user_id,'id'=>$coupon_id])->update(['used'=>1,'updatetime'=>$time]);
                if(!$ret)
                {
                   Db::rollback();
                   $this->error('订单生成失败', 'error order');
                }
            }      
        }
        
        $params = [];
        $params['user_id'] = $user_id;
        $params['goods_info'] = $cartList;
        $params['goods_count'] = $cupNumber;
        $params['goods_amount'] = $sumMonney;
        $params['coupon_amount'] = $coupon_amount;
        $params['order_amount'] = $order_amount;
        $params['payment_code'] = $payType;
        $params['eat_type'] = $eatType;
        $params['coupon_id'] = $coupon_id;
        $params['remark'] = $note;
        $params['order_type_time'] = $OrderTypetime;
        $params['createtime'] = $time;
        $params['updatetime'] = $time;
        
        try
        {   
            $order = OrderModel::create($params);
            $paySn = getOrderPaySn($order->order_id);//生成支付单号
            //判断是否免单
            $reward = new Reward();
            $free = $reward::reward($user_id,$order_amount);
            
            if($free === true)
            {   
                $order->payment_code = 5;//免单
                $order->payment_time = $time;//支付时间
                $order->take_food_no = $order->order_id;//取餐号
                $order->order_state = 2;//已付款
                $order->pay_no = $paySn;//支付单号
                $order->save();
                
                Db::commit();
                $params['order_id'] = $order->order_id;
                $params['payment_time'] = $order->payment_time;
                $params['order_state'] = $order->order_state;
                $params['take_food_no'] = $order->take_food_no;
                $params['pay_no'] = $order->pay_no;
                $params['payment_code'] = 5;
                $params['goods_info'] = json_decode($params['goods_info'],true);
                $params['createtime'] = date('Y-m-d H:i:s',$params['createtime']);
              
                $this->success('pay success', $params);
            }

            if($payType == 3)
            {   
                //余额支付
                $userMoney = Db::table('tb_user')->where(['id'=>$user_id])->field('total_charge')->find();
                if($userMoney['total_charge'] < $order_amount)
                {   
                    Db::rollback();
                    $this->error('余额不足', 'error total_charge');
                }
                //生成余额明细
                $param = [];
                $param['user_id'] = $user_id;
                $param['order_id'] = $order->order_id;
                $param['money'] = $order_amount;
                $param['total_charge'] = $userMoney['total_charge'] - $order_amount;
                $param['type'] = 2;
                $param['note'] = '支付订单';
                $param['createtime'] = $time;
                $param['updatetime'] = $time;
                $ret = Db::table('tb_charge_detail')->insert($param);
                if(!$ret)
                {
                   Db::rollback();
                   $this->error('订单生成失败', 'error order');
                }
                //减去余额
                $ret = Db::table('tb_user')->where(['id'=>$user_id])->setDec('total_charge',$order_amount);
                if(!$ret)
                {
                   Db::rollback();
                   $this->error('订单生成失败', 'error order');
                }
                //生成支付订单
                $param = [];
                $param['user_id'] = $user_id;
                $param['order_no'] = '42000'.$paySn;
                $param['pay_no'] = $paySn;
                $param['order_id'] = $order->order_id;
                $param['money'] = $order_amount;
                $param['pay_status'] = 1;
                $param['pay_type'] = 3;
                $param['pay_time'] = $time;
                $param['createtime'] = $time;
                $param['updatetime'] = $time;
                $pay_id = Db::table('tb_pay')->insert($param);
                if(!$pay_id)
                {
                    Db::rollback();
                    $this->error('订单生成失败', 'error order');
                }
                //赠送优惠价和e币
                $coin = config('e_coin');
                if($coin['on']===true && $coin['condition'] <= $order_amount)
                {   
                    //生成余额明细
                    $param = [];
                    $param['user_id'] = $user_id;
                    $param['order_id'] = 0;
                    $param['money'] = $coin['coin'];
                    $param['e_coin'] = $user->e_coin + $coin['coin'];
                    $param['type'] = 1;
                    $param['note'] = '订单奖励';
                    $param['createtime'] = $time;
                    $param['updatetime'] = $time;
                    $ret = Db::table('tb_coin_detail')->insert($param);
                    if(!$ret)
                    {
                       Db::rollback();
                       $this->error('订单生成失败', 'error order');
                    }
                    //添加e币
                    $ret = Db::table('tb_user')->where(['id'=>$user_id])->setInc('e_coin',$coin['coin']);
                    if(!$ret)
                    {
                       Db::rollback();
                       $this->error('订单生成失败', 'error order');
                    }
                    //赠送推荐人
                    if($user->pid > 0)
                    {   
                        $piduser = Db::table('tb_user')->where(['id'=>$user->pid])->field('e_coin')->find();
                        $param['e_coin'] = $piduser['e_coin'] + $coin['coin'];
                        $param['user_id'] = $user->pid;
                        $ret = Db::table('tb_coin_detail')->insert($param);
                        if(!$ret)
                        {
                           Db::rollback();
                           $this->error('订单生成失败', 'error order');
                        }
                        //添加e币
                        $ret = Db::table('tb_user')->where(['id'=>$user->pid])->setInc('e_coin',$coin['coin']);
                        if(!$ret)
                        {
                           Db::rollback();
                           $this->error('订单生成失败', 'error order');
                        }
                    }
                }
                $reward = config('reward_coupon');
                if($reward['on']===true && $user->pid > 0 && $reward['condition'] <= $order_amount)
                {   
                    $expires_in = strtotime(date('Y-m-d',$time));
                    $expiretime = strtotime(date('Y-m-d',$time + ($reward['reward']['expires'] * 86400)).' 23:59:59');
                    $param = [];
                    $param['user_id'] = $user->pid;
                    $param['worth'] = $reward['reward']['worth'];
                    $param['desc'] = $reward['reward']['desc'];
                    $param['condition'] = $reward['reward']['condition'];
                    $param['expires_in'] = $expires_in;
                    $param['expiretime'] = $expiretime;
                    $param['createtime'] = $time;
                    $param['updatetime'] = $time;
                    $ret = Db::table('tb_coupon')->insert($param);
                    if(!$ret)
                    {
                       Db::rollback();
                       $this->error('订单生成失败', 'error order');
                    }
                }
                
                $order->payment_time = $time;//支付时间
                $order->take_food_no = $order->order_id;//取餐号
                $order->order_state = 2;//已付款
                $order->pay_no = $paySn;//支付单号
                $order->save();
                
                Db::commit();
                $params['order_id'] = $order->order_id;
                $params['payment_time'] = $order->payment_time;
                $params['order_state'] = $order->order_state;
                $params['take_food_no'] = $order->take_food_no;
                $params['pay_no'] = $order->pay_no;
                $params['goods_info'] = json_decode($params['goods_info'],true);
                $params['createtime'] = date('Y-m-d H:i:s',$params['createtime']);

                $this->success('pay success', $params);
                
            }elseif($payType == 1)
            {
                $param = [];
                $param['user_id'] = $user_id;
                $param['pay_no'] = $paySn;
                $param['order_id'] = $order->order_id;
                $param['money'] = $order_amount;
                $param['pay_type'] = 1;
                $param['createtime'] = $time;
                $param['updatetime'] = $time;
                $pay_id = Db::table('tb_pay')->insert($param);
                if(!$pay_id)
                {
                    Db::rollback();
                    $this->error('订单生成失败', 'error order');
                }
                $order->pay_no = $paySn;//支付单号
                $order->save();

                $WxPay = new WxPay;
                $result = $WxPay->pay('餐中苑-用户支付订单',$paySn,$order_amount*100,request()->ip(),$user->openid);
                $temp = json_decode($result,true);
                
                if($temp['return_code'] == 200)
                {
                    Db::commit();
                    $params['order_id'] = $order->order_id;
                    $params['goods_info'] = json_decode($params['goods_info'],true);
                    $params['payData'] = $temp['data'];
                    $this->success('create order success', $params);
                }else
                {
                    Db::rollback();
                    $this->error('订单生成失败', 'error order');
                }          
            } 
        }
        catch (Exception $e)
        {
            $this->setError($e->getMessage());
            Db::rollback();
            $this->error('订单生成失败', 'error order');
        }
    }
    /**
     * 获取订单状态
     *
     * @ApiTitle    
     * @ApiMethod   
     **/
    public function getorderstatus()
    {  
        $token = $this->request->request('token');
        $order_id = $this->request->request('order_id');
        $user_id = $this->request->request('user_id');
        if(!$token || !$order_id || !$user_id)
        {
            $this->error(__('Invalid parameters'));
        }
        //验证用户
        $user = User::get(['id' => $user_id/*,'token'=>$token*/]);
        if (!$user)
        {
            $this->error('用户信息错误','error user');
        }
        
        $order = OrderModel::get(['order_id'=>$order_id]);
        
        $order->goods_info = json_decode($order->goods_info,true);
        $order->createtime = date('Y-m-d H:i:s',$order->createtime);

        $this->success('获取订单状态',$order);
    }

     /**
     * 获取订单
     *
     * @ApiTitle    
     * @ApiMethod   
     **/
    public function getorder()
    {  
        $token = $this->request->request('token');
        $user_id = $this->request->request('user_id');
        if(!$token || !$user_id)
        {
            $this->error(__('Invalid parameters'));
        }
        //验证用户
        $user = User::get(['id' => $user_id/*,'token'=>$token*/]);
        if (!$user)
        {
            $this->error('用户信息错误','error user');
        }
        
        $list = OrderModel::where(['user_id'=>$user_id,'order_state'=>['gt',1],'payment_code'=>['in',[1,2,3,5]]])
        ->order(['createtime'=>'desc','order_state'=>'2,3'])
        ->select();
        $order1 = [];
        $order2 = [];
        $order3 = [];
        foreach ($list as $k=> $row) {
            $goods_info = json_decode($row['goods_info'],true);
            $date = date('Y-m-d H:i:s',$row['createtime']);
            $list[$k]['goods_info'] = $goods_info;
            $list[$k]['createtime'] = $date;
            $row['goods_info'] = $goods_info;
            $row['createtime'] = $date;
            if($row['order_state'] == 1)
            {
                $order1[] = $row;
            }elseif ($row['order_state'] == 2)
            {
                $order2[] = $row;
            }elseif ($row['order_state'] == 3)
            {
                $order3[] = $row;
            }
        }
        $order = $list ? $list : [];

        $this->success('获取订单成功',['orderall'=>$order,'order1'=>$order1,'order2'=>$order2,'order3'=>$order3]);
    }
   
    /**
     * 重新支付
     *
     * @ApiTitle    
     * @ApiMethod   
     **/
    public function repay()
    {   
        $token = $this->request->request('token');
        $user_id = $this->request->request('user_id');
        $eatType = $this->request->request('eatType');//用餐方式
        $payType = $this->request->request('payType');//支付方式
        $order_id = $this->request->request('order_id');//order_id
        $note = $this->request->request('note');//
        $OrderTypetime = $this->request->request('OrderTypetime');//
        
        if(!$token || !$user_id || !$eatType || !$payType || !$order_id )
        {
            $this->error(__('Invalid parameters'));
        }
        //验证用户
        $user = User::get(['id' => $user_id/*,'token'=>$token*/]);
        if (!$user)
        {
            $this->error('用户信息错误','error user');
        }
        
        $order = OrderModel::get(['order_id'=>$order_id,'user_id'=>$user_id]);
        if(!$order_id)
        {
            $this->error('该订单有误','error order');
        }
        //开启事务
        Db::startTrans();      
        $time = time();
        try
        {   
            $order->payment_code = $payType;
            $order->eat_type = $eatType;
            $order->order_type_time = $OrderTypetime;
            $order->remark = $note;
            $order->updatetime = $time;
            $order->save();

            if($payType == 3)
            {//余额支付
                $userMoney = Db::table('tb_user')->where(['id'=>$user_id])->field('total_charge')->find();
                if($userMoney['total_charge'] < $order->order_amount)
                {   
                    Db::rollback();
                    $this->error('余额不足', 'error total_charge');
                }
                //生成余额明细
                $param = [];
                $param['user_id'] = $user_id;
                $param['order_id'] = $order->order_id;
                $param['money'] = $order->order_amount;
                $param['total_charge'] = $userMoney['total_charge'] - $order->order_amount;
                $param['type'] = 2;
                $param['note'] = '支付订单';
                $param['createtime'] = $time;
                $param['updatetime'] = $time;
                $ret = Db::table('tb_charge_detail')->insert($param);
                if(!$ret)
                {
                   Db::rollback();
                   $this->error('生成余额明细失败', 'error order');
                }
                //减去余额
                $ret = Db::table('tb_user')->where(['id'=>$user_id])->setDec('total_charge',$order->order_amount);
                if(!$ret)
                {
                   Db::rollback();
                   $this->error('减去余额失败', 'error order');
                }
                //更新支付记录
                $ret = Db::table('tb_pay')->where(['pay_no'=>$order->pay_no])
                ->update(
                    ['order_no'=>'42000'.$order->pay_no,
                     'pay_type'=>3,
                     'pay_status'=>1,
                     'pay_time'=>$time
                    ]
                );
                if(!$ret)
                {
                   Db::rollback();
                   $this->error('更新支付记录失败', 'error order');
                }
                $order->payment_time = $time;//支付时间
                $order->take_food_no = $order->order_id;//取餐号
                $order->order_state = 2;//已付款
                $order->save();
                
                Db::commit();
                $order->goods_info = json_decode($order->goods_info,true);
                $order->createtime = date('Y-m-d H:i:s',$order->createtime);

                $this->success('pay success', $order);
                
            }elseif($payType == 1)
            {

                $WxPay = new WxPay;
                $result = $WxPay->pay('餐中苑-用户支付订单',$order->pay_no,$order->order_amount*100,request()->ip(),$user->openid);
                $temp = json_decode($result,true);
                
                if($temp['return_code'] == 200)
                {
                    Db::commit();
                    $payData['order_id'] = $order->order_id;
                    $payData['payData'] = $temp['data'];
                    $this->success('create order success', $payData);
                }else
                {
                    Db::rollback();
                    $this->error('订单重支付失败', 'error order');
                }          
            } 
        }
        catch (Exception $e)
        {
            $this->setError($e->getMessage());
            Db::rollback();
            $this->error('订单重支付失败', 'error order');
        }
    }

     /**
     * 取消订单
     *
     * @ApiTitle    
     * @ApiMethod   
     **/
    public function delorder()
    {  
        $token = $this->request->request('token');
        $user_id = $this->request->request('user_id');
        $order_id = $this->request->request('order_id');
        if(!$token || !$user_id || !$order_id)
        {
            $this->error(__('Invalid parameters'));
        }

        //验证用户
        $user = User::get(['id' => $user_id/*,'token'=>$token*/]);
        if (!$user)
        {
            $this->error('用户信息错误','error user');
        }
        
        $order_id = OrderModel::where(['user_id'=>$user_id,'order_id'=>$order_id])->update(['order_state'=>0]);
        if($order_id)
        {
            $this->success('取消订单成功',$order_id);
        }else
        {
            $this->error('取消订单失败');
        }
    }

    /**
     * E币兑换
     *
     * @ApiTitle    
     * @ApiMethod   
     **/
    public function puteorder()
    {   
        $token = $this->request->request('token');
        $user_id = $this->request->request('user_id');
        $cartList = $this->request->request('cartList');
        $sumMonney = $this->request->request('sumMonney');
        $cupNumber = $this->request->request('cupNumber');
        $eatType = $this->request->request('eatType');//用餐方式
        $note = $this->request->request('note');//代金卷id
        $OrderTypetime = $this->request->request('OrderTypetime');//
        
        if(!$cartList || !$sumMonney || !$cupNumber || !$token || !$user_id || !$eatType )
        {
            $this->error(__('Invalid parameters'));
        }
        //验证用户
        $user = User::get(['id' => $user_id/*,'token'=>$token*/]);
        if (!$user)
        {
            $this->error('用户信息错误','error user');
        }
        $data = json_decode($cartList,true);
        //检测数量和金额
        $checkNum = 0;
        $checkPrice = 0;
        foreach ($data as $row) 
        {
            $checkNum += $row['number'];
            $price = Db::table('tb_goods_list')->where('id',$row['goods_id'])->Field('e_price')->find();
            $checkPrice += ($row['number']*$price['e_price']);
            //添加销量
            Db::table('tb_goods_list')->where('id',$row['goods_id'])->setInc('sales',$row['number']);
        }
        //判断数量和金额
        if($checkNum != $cupNumber || $checkPrice != $sumMonney)
        {
            $this->error('金额或数量有误','error count or money');
        }
        $coupon = config('wechatcup');

        $order_amount = $sumMonney;

        //开启事务
        Db::startTrans();
        $time = time();
        
        $params = [];
        $params['user_id'] = $user_id;
        $params['goods_info'] = $cartList;
        $params['goods_count'] = $cupNumber;
        $params['goods_amount'] = $sumMonney;
        $params['order_amount'] = $order_amount;
        $params['payment_code'] = 4;
        $params['eat_type'] = $eatType;
        $params['order_type_time'] = $OrderTypetime;
        $params['remark'] = $note;
        $params['createtime'] = $time;
        $params['updatetime'] = $time;
        
        try
        {   
            $order = OrderModel::create($params);

            if($user->e_coin < $order_amount)
            {   
                Db::rollback();
                $this->error('E币不足', 'error e_coin');
            }
            //生成余额明细
            $param = [];
            $param['user_id'] = $user_id;
            $param['order_id'] = $order->order_id;
            $param['money'] = $order_amount;
            $param['e_coin'] = $user->e_coin - $order_amount;
            $param['type'] = 2;
            $param['note'] = '兑换订单';
            $param['createtime'] = $time;
            $param['updatetime'] = $time;
            $ret = Db::table('tb_coin_detail')->insert($param);
            if(!$ret)
            {
               Db::rollback();
               $this->error('订单生成失败', 'error order');
            }
            //减去余额
            $ret = Db::table('tb_user')->where(['id'=>$user_id])->setDec('e_coin',$order_amount);
            if(!$ret)
            {
               Db::rollback();
               $this->error('订单生成失败', 'error order');
            }
            $paySn = getOrderPaySn($order->order_id);
            //生成支付订单
            $param = [];
            $param['user_id'] = $user_id;
            $param['order_no'] = '42000'.$paySn;
            $param['pay_no'] = $paySn;
            $param['order_id'] = $order->order_id;
            $param['money'] = $order_amount;
            $param['pay_status'] = 1;
            $param['pay_type'] = 4;
            $param['pay_time'] = $time;
            $param['createtime'] = $time;
            $param['updatetime'] = $time;
            $pay_id = Db::table('tb_pay')->insert($param);
            if(!$pay_id)
            {
                Db::rollback();
                $this->error('订单生成失败', 'error order');
            }

            $order->payment_time = $time;//支付时间
            $order->take_food_no = $order->order_id;//取餐号
            $order->order_state = 2;//已付款
            $order->pay_no = $paySn;//支付单号
            $order->save();
            
            Db::commit();
            $params['order_id'] = $order->order_id;
            $params['payment_time'] = $order->payment_time;
            $params['order_state'] = $order->order_state;
            $params['take_food_no'] = $order->take_food_no;
            $params['pay_no'] = $order->pay_no;
            $params['goods_info'] = json_decode($params['goods_info'],true);
            $params['createtime'] = date('Y-m-d H:i:s',$params['createtime']);

            $this->success('pay success', $params);
                
        }
        catch (Exception $e)
        {
            $this->setError($e->getMessage());
            Db::rollback();
            $this->error('订单生成失败', 'error order');
        }
    }

     /**
     * 获取我的订单（已付款未完成）
     *
     * @ApiTitle    
     * @ApiMethod   
     **/
    public function getworder()
    {  
        $token = $this->request->request('token');
        $user_id = $this->request->request('user_id');
        if(!$token || !$user_id)
        {
            $this->error(__('Invalid parameters'));
        }
        //验证用户
        $user = User::get(['id' => $user_id/*,'token'=>$token*/]);
        if (!$user)
        {
            $this->error('用户信息错误','error user');
        }
        
        $list = OrderModel::where(['user_id'=>$user_id,'order_state'=>2,'payment_code'=>['lt',4]])
        ->order(['createtime'=>'desc'])
        ->select();
        foreach ($list as $k=> $row) {
            $goods_info = json_decode($row['goods_info'],true);
            $date = date('Y-m-d H:i:s',$row['createtime']);
            $list[$k]['goods_info'] = $goods_info;
            $list[$k]['createtime'] = $date;
            $row['goods_info'] = $goods_info;
            $row['createtime'] = $date;
        }
        $order = $list ? $list : [];

        $this->success('获取订单成功',$order);
    }
     /**
     * 获取我的E币兑换订单（已付款未完成）
     *
     * @ApiTitle    
     * @ApiMethod   
     **/
    public function getweorder()
    {  
        $token = $this->request->request('token');
        $user_id = $this->request->request('user_id');
        if(!$token || !$user_id)
        {
            $this->error(__('Invalid parameters'));
        }
        //验证用户
        $user = User::get(['id' => $user_id/*,'token'=>$token*/]);
        if (!$user)
        {
            $this->error('用户信息错误','error user');
        }
        
        $list = OrderModel::where(['user_id'=>$user_id,'order_state'=>['gt',0],'payment_code'=>4])
        ->order(['createtime'=>'desc','order_state'=>'2,3'])
        ->select();
        foreach ($list as $k=> $row) {
            $goods_info = json_decode($row['goods_info'],true);
            $date = date('Y-m-d H:i:s',$row['createtime']);
            $list[$k]['goods_info'] = $goods_info;
            $list[$k]['createtime'] = $date;
            $row['goods_info'] = $goods_info;
            $row['createtime'] = $date;
        }
        $order = $list ? $list : [];

        $this->success('获取订单成功',$order);
    }
}
