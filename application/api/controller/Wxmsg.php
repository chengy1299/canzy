<?php

namespace app\api\controller;

use app\common\controller\Api;
use think\Db;
use think\Log;

/**
 * 小程序推送消息接口
 */
class Wxmsg extends Api
{

    //如果$noNeedLogin为空表示所有接口都需要登录才能请求
    //如果$noNeedRight为空表示所有接口都需要验证权限才能请求
    //如果接口已经设置无需登录,那也就无需鉴权了
    //
    // 无需登录的接口,*表示全部
    protected $noNeedLogin = ['*'];
    // 无需鉴权的接口,*表示全部
    protected $noNeedRight = ['*'];
    private $appid = "wx99abd1149b53e297";
    private $secret = "2c170ce70f450e3dfe5fc534184dd52b";
 
    //获取access_token
    public function getAccessToken () {
        $appid = $this->appid;
        $appsecret = $this->secret;
        $url='https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='.$appid.'&secret='.$appsecret;
        $html = file_get_contents($url);
        $output = json_decode($html, true);
        $access_token = $output['access_token'];
        return $access_token;
    }

    //发送模板消息
    public function send_post($post_data){
        $post_data = json_encode($post_data, true);
        //将数组编码为 JSON
        $url = "https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=".$this->getAccessToken();
        $options = array(
            'http' => array(
                'method'  => 'POST',
                'header'  => 'Content-type:application/json',
                //header 需要设置为 JSON
                'content' => $post_data,
                'timeout' => 60
                //超时时间
            )
        );
        $context = stream_context_create( $options );
        $result = file_get_contents( $url, false, $context );
        return $result;
    }

    //例子
    //注意：自己提交的formid只能发给自己的openid，一个form_id只能用一次
    public function send()
    {   
        $user_id = $this->request->request('user_id');
        $form_id = $this->request->request('form_id');
        Log::info($_POST);
        $template_id = "BdJQIdclV8UiyVjqEP4M99Ei6QtfCVrdHgb5OVRZKxw";//$this->request->request('template_id');//暂时写死
        $page = "pages/index/index";//$this->request->request('page');//暂时写死
        $data = $this->request->request('data');
        $data = json_decode($data,true);
        Log::info($data);
        
        $keyword2 = $data['order_type_time'] == 0 && is_numeric($data['order_type_time']) ? "即时订单" : "预约订单";
        $keyword2 .= $data['eat_type']== 1 ? "（堂食）" : "（外带）";
        $openid = Db::table('tb_user')->where(['id'=>$user_id])->field('openid')->find();
        
        //模板消息配置
        $post_faqi = array(
            "touser" => $openid['openid'],//推送的人的openid
            "template_id" => $template_id,//模板id
            "page" => $page,//跳转路径
            "form_id" => $form_id,//form_id或者prepay_id
            //data 自己根据公众平台申请的消息模板进行填写
            "data" => array(
                'keyword1' => array("value" => $data['take_food_no'], "color" => "#4a4a4a"),//取餐号
                'keyword2' => array("value" => $keyword2, "color" => "#9b9b9b"),//订单类型
                'keyword3' => array("value" => $data['createtime'], "color" => "#9b9b9b"),//下单时间
                'keyword4' => array("value" => '平南县餐中苑饮食店（兴平路309号）', "color" => "#9b9b9b"),//取餐门店
                'keyword5' => array("value" => '您的餐点准备中，请准时前往取餐区凭借取餐号取餐', "color" => "#9b9b9b"),//温馨提示
            ),
            "emphasis_keyword" => "keyword1.DATA",//需加大显示的字体
        );
        // echo "<pre>";
        // print_r($_POST);
        // echo "</pre>";
        Log::info($post_faqi);
        $ret = $this->send_post($post_faqi);
        Log::info($ret);
        $this->success('返回',$ret);
    }   
}
