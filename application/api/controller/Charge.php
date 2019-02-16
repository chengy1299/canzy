<?php

namespace app\api\controller;

use app\common\controller\Api;
use app\common\model\Charge as ChargeModel;
use app\common\model\User;
use think\Db;
use app\common\library\WxPay;

/**
 * 充值接口
 */
class Charge extends Api
{

    //如果$noNeedLogin为空表示所有接口都需要登录才能请求
    //如果$noNeedRight为空表示所有接口都需要验证权限才能请求
    //如果接口已经设置无需登录,那也就无需鉴权了
    //
    // 无需登录的接口,*表示全部
    //protected $noNeedLogin = ['getgoods', 'test1'];
    protected $noNeedLogin = ['*'];
    // 无需鉴权的接口,*表示全部
    //protected $noNeedRight = ['getgoods'];
    protected $noNeedRight = ['*'];

    /**
     * 获取充值列表
     *
     * @param ApiTitle    获取商品列表
     * @param ApiMethod   (POST)
     */
    public function getcharge()
    {   
        $charge = ChargeModel::where(['status'=>1])->order('charge_worth asc')->select();
        $this->success('返回成功', $charge);
    }
    
    /**
     * 获取余额明细列表
     *
     * @param ApiTitle    
     * @param ApiMethod   (POST)
     */
    public function getchargedetail()
    {   
        $user_id = $this->request->request('user_id');
        $token = $this->request->request('token');
        $charge = Db::table('tb_charge_detail')->where('user_id',$user_id)->order('createtime desc')->limit(100)->select();
        foreach ($charge as $key => $value) {
            $charge[$key]['createtime'] = date('Y-m-d H:i:s',$value['createtime']);
        }
        $charge = $charge ? $charge : [];
        $this->success('返回成功', $charge);
    }
    /**
     * 充值
     *
     * @param ApiTitle    充值
     * @param ApiMethod   (POST)
     */
    public function charge()
    {   
        $token = $this->request->request('token');
        $user_id = $this->request->request('user_id');
        $charge_id = $this->request->request('charge_id');//充值id
        
        if(!$token || !$user_id || !$charge_id )
        {
            $this->error(__('Invalid parameters'));
        }
        //验证用户
        $user = User::get(['id' => $user_id/*,'token'=>$token*/]);
        if (!$user)
        {
            $this->error('用户信息错误','error user');
        }
        //充值ID
        $charge = ChargeModel::get(['id'=>$charge_id]);
        if(!$charge)
        {
            $this->error('该充值id不存在','error charge_id');
        }
        Db::startTrans();
        $time = time();
        
        //生成充值支付订单
        $paySn = getOrderPaySn($charge->id);
        $param = [];
        $param['user_id'] = $user_id;
        $param['pay_no'] = $paySn;
        $param['charge_id'] = $charge->id;
        $param['money'] = $charge->charge_worth;
        $param['pay_type'] = 1;
        $param['createtime'] = $time;
        $param['updatetime'] = $time;
        $pay_id = Db::table('tb_pay')->insert($param);
        if(!$pay_id)
        {
            Db::rollback();
            $this->error('生成充值订单失败', 'error order');
        }

        $WxPay = new WxPay;
        $result = $WxPay->pay('餐中苑-用户充值',$paySn,$charge->charge_worth*100,request()->ip(),$user->openid);
        $temp = json_decode($result,true);
        
        if($temp['return_code'] == 200)
        {
            Db::commit();
            $params = [];
            $params['pay_no'] = $paySn;
            $params['payData'] = $temp['data'];
            $this->success('create order success', $params);
        }else
        {
            Db::rollback();
            $this->error('生成充值订单失败', 'error order');
        }          
    }

    /**
     * 获取充值状态
     *
     * @ApiTitle    
     * @ApiMethod   
     **/
    public function getchargestatus()
    {  
        $token = $this->request->request('token');
        $pay_no = $this->request->request('pay_no');
        $user_id = $this->request->request('user_id');
        if(!$token || !$pay_no || !$user_id)
        {
            $this->error(__('Invalid parameters'));
        }
        //验证用户
        $user = User::get(['id' => $user_id/*,'token'=>$token*/]);
        if (!$user)
        {
            $this->error('用户信息错误','error user');
        }
        
        $pay = Db::table('tb_pay')->where(['pay_no'=>$pay_no])->find();

        $this->success('获取订单状态',$pay);
    }

}
