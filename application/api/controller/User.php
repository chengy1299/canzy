<?php

namespace app\api\controller;

use app\common\controller\Api;
use app\common\library\Ems;
use app\common\library\Sms;
use think\Db;
use fast\Random;
use think\Validate;
use fast\Http;
use think\Config;
use think\Session;

/**
 * 会员接口
 */
class User extends Api
{
 
    protected $noNeedLogin = ['login', 'mobilelogin', 'register', 'resetpwd', 'changeemail', 'changemobile', 'third','wechatminilogin','wechatminiauth','getusermoney','getusercharge'];
    protected $noNeedRight = '*';

    public function _initialize()
    {
        parent::_initialize();
    }

    /**
     * 会员中心
     */
    public function index()
    {
        $this->success('', ['welcome' => $this->auth->nickname]);
    }
    
    /**
     * 会员登录
     * 
     * @param string $account 账号
     * @param string $password 密码
     */
    public function login()
    {
        $account = $this->request->request('account');
        $password = $this->request->request('password');
        if (!$account || !$password)
        {
            $this->error(__('Invalid parameters'));
        }
        $ret = $this->auth->login($account, $password);
        if ($ret)
        {
            $data = ['userinfo' => $this->auth->getUserinfo()];
            $this->success(__('Logged in successful'), $data);
        }
        else
        {
            $this->error($this->auth->getError());
        }
    }

    /**
     * 微信小程序登录
     * @param string    $code    用户登录凭证（有效期五分钟）,使用 code 换取 openid 和 session_key 等信息
     */
    public function wechatminilogin()
    {   
        $code = $this->request->request('code');
        if (!$code)
        {
            $this->error(__('Invalid parameters'));
        }

        $miniConf = config('wechatmini');
        $queryarr = array(
            "appid"      => $miniConf['app_id'],
            "secret"     => $miniConf['app_secret'],
            "js_code"       => $code,
            "grant_type" => "authorization_code",
        );
        $response = Http::post($miniConf['get_access_token_url'], $queryarr);
        $ret = json_decode($response, TRUE);
        if(isset($ret['openid']))
        {   
            $result = $this->auth->wechatminilogin($ret['openid'],$ret['session_key']);
            if ($result)
            {   
                $data = ['userinfo' => $this->auth->getUserinfo()];
                $data['userinfo']['nickname'] = emoji_decode($data['userinfo']['nickname']);
                $this->success(__('Logged in successful'), $data);
            }
            else
            {
                $this->error($this->auth->getError(),$result);
            }
        }
        else
        {
            $this->error($this->auth->getError());
        }
    }

     /**
     * 微信小程序授权登录
     * @param string    $code    用户登录凭证（有效期五分钟）,使用 code 换取 openid 和 session_key 等信息
     */
    public function wechatminiauth()
    {   
        $code = $this->request->request('code');
        $rawData = $this->request->request('rawData');
        $mobile = $this->request->request('mobile');
        $password = $this->request->request('password');
        $pid = $this->request->request('pid');

        if (!$code || !$rawData || !$mobile || !$password )
        {
            $this->error(__('Invalid parameters'));
        }

        $miniConf = config('wechatmini');
        $queryarr = array(
            "appid"      => $miniConf['app_id'],
            "secret"     => $miniConf['app_secret'],
            "js_code"       => $code,
            "grant_type" => "authorization_code",
        );
        $response = Http::post($miniConf['get_access_token_url'], $queryarr);
        $ret = json_decode($response, TRUE);

        if(isset($ret['openid']))
        {   
            $result = $this->auth->wechatminiauth($ret['openid'],$ret['session_key'],json_decode($rawData,TRUE),$mobile,$password,$pid);
            if ($result===TRUE)
            {
                $data = ['userinfo' => $this->auth->getUserinfo()];
                $data['userinfo']['nickname'] = emoji_decode($data['userinfo']['nickname']);
                $this->success(__('Logged in successful'), $data);
            }
            else
            {
                $this->error($this->auth->getError(),$result);
            }
        }
        else
        {
            $this->error($this->auth->getError());
        }
        
    }

    /**
     * 手机验证码登录
     * 
     * @param string $mobile 手机号
     * @param string $captcha 验证码
     */
    public function mobilelogin()
    {
        $mobile = $this->request->request('mobile');
        $captcha = $this->request->request('captcha');
        if (!$mobile || !$captcha)
        {
            $this->error(__('Invalid parameters'));
        }
        if (!Validate::regex($mobile, "^1\d{10}$"))
        {
            $this->error(__('Mobile is incorrect'));
        }
        if (!Sms::check($mobile, $captcha, 'mobilelogin'))
        {
            $this->error(__('Captcha is incorrect'));
        }
        $user = \app\common\model\User::getByMobile($mobile);
        if ($user)
        {
            //如果已经有账号则直接登录
            $ret = $this->auth->direct($user->id);
        }
        else
        {
            $ret = $this->auth->register($mobile, Random::alnum(), '', $mobile, []);
        }
        if ($ret)
        {
            Sms::flush($mobile, 'mobilelogin');
            $data = ['userinfo' => $this->auth->getUserinfo()];
            $this->success(__('Logged in successful'), $data);
        }
        else
        {
            $this->error($this->auth->getError());
        }
    }

    /**
     * 注册会员
     * 
     * @param string $username 用户名
     * @param string $password 密码
     * @param string $email 邮箱
     * @param string $mobile 手机号
     */
    public function register()
    {
        $username = $this->request->request('username');
        $password = $this->request->request('password');
        $email = $this->request->request('email');
        $mobile = $this->request->request('mobile');
        if (!$username || !$password)
        {
            $this->error(__('Invalid parameters'));
        }
        if ($email && !Validate::is($email, "email"))
        {
            $this->error(__('Email is incorrect'));
        }
        if ($mobile && !Validate::regex($mobile, "^1\d{10}$"))
        {
            $this->error(__('Mobile is incorrect'));
        }
        $ret = $this->auth->register($username, $password, $email, $mobile, []);
        if ($ret)
        {
            $data = ['userinfo' => $this->auth->getUserinfo()];
            $this->success(__('Sign up successful'), $data);
        }
        else
        {
            $this->error($this->auth->getError());
        }
    }

    /**
     * 注销登录
     */
    public function logout()
    {
        $this->auth->logout();
        $this->success(__('Logout successful'));
    }

    /**
     * 修改会员个人信息
     * 
     * @param string $avatar 头像地址
     * @param string $username 用户名
     * @param string $nickname 昵称
     * @param string $bio 个人简介
     */
    public function profile()
    {
        $user = $this->auth->getUser();
        $username = $this->request->request('username');
        $nickname = $this->request->request('nickname');
        $bio = $this->request->request('bio');
        $avatar = $this->request->request('avatar');
        $exists = \app\common\model\User::where('username', $username)->where('id', '<>', $this->auth->id)->find();
        if ($exists)
        {
            $this->error(__('Username already exists'));
        }
        $user->username = $username;
        $user->nickname = $nickname;
        $user->bio = $bio;
        $user->avatar = $avatar;
        $user->save();
        $this->success();
    }

    /**
     * 修改邮箱
     * 
     * @param string $email 邮箱
     * @param string $captcha 验证码
     */
    public function changeemail()
    {
        $user = $this->auth->getUser();
        $email = $this->request->post('email');
        $captcha = $this->request->request('captcha');
        if (!$email || !$captcha)
        {
            $this->error(__('Invalid parameters'));
        }
        if (!Validate::is($email, "email"))
        {
            $this->error(__('Email is incorrect'));
        }
        if (\app\common\model\User::where('email', $email)->where('id', '<>', $user->id)->find())
        {
            $this->error(__('Email already exists'));
        }
        $result = Ems::check($email, $captcha, 'changeemail');
        if (!$result)
        {
            $this->error(__('Captcha is incorrect'));
        }
        $verification = $user->verification;
        $verification->email = 1;
        $user->verification = $verification;
        $user->email = $email;
        $user->save();

        Ems::flush($email, 'changeemail');
        $this->success();
    }

    /**
     * 修改手机号
     * 
     * @param string $email 手机号
     * @param string $captcha 验证码
     */
    public function changemobile()
    {
        $user = $this->auth->getUser();
        $mobile = $this->request->request('mobile');
        $captcha = $this->request->request('captcha');
        if (!$mobile || !$captcha)
        {
            $this->error(__('Invalid parameters'));
        }
        if (!Validate::regex($mobile, "^1\d{10}$"))
        {
            $this->error(__('Mobile is incorrect'));
        }
        if (\app\common\model\User::where('mobile', $mobile)->where('id', '<>', $user->id)->find())
        {
            $this->error(__('Mobile already exists'));
        }
        $result = Sms::check($mobile, $captcha, 'changemobile');
        if (!$result)
        {
            $this->error(__('Captcha is incorrect'));
        }
        $verification = $user->verification;
        $verification->mobile = 1;
        $user->verification = $verification;
        $user->mobile = $mobile;
        $user->save();

        Sms::flush($mobile, 'changemobile');
        $this->success();
    }

    /**
     * 第三方登录
     * 
     * @param string $platform 平台名称
     * @param string $code Code码
     */
    public function third()
    {   
        $url = url('user/index');
        $platform = $this->request->request("platform");
        $code = $this->request->request("code");
        $config = get_addon_config('third');
        if (!$config || !isset($config[$platform]))
        {
            $this->error(__('Invalid parameters'));
        }
        $app = new \addons\third\library\Application($config);
        //通过code换access_token和绑定会员
        $result = $app->{$platform}->getUserInfo(['code' => $code]);
        if ($result)
        {
            $loginret = \addons\third\library\Service::connect($platform, $result);
            if ($loginret)
            {
                $data = [
                    'userinfo'  => $this->auth->getUserinfo(),
                    'thirdinfo' => $result
                ];
                $this->success(__('Logged in successful'), $data);
            }
        }
        $this->error(__('Operation failed'), $url);
    }

    /**
     * 重置密码
     * 
     * @param string $mobile 手机号
     * @param string $newpassword 新密码
     * @param string $captcha 验证码
     */
    public function resetpwd()
    {
        $type = $this->request->request("type");
        $mobile = $this->request->request("mobile");
        $email = $this->request->request("email");
        $newpassword = $this->request->request("newpassword");
        $captcha = $this->request->request("captcha");
        if (!$newpassword || !$captcha)
        {
            $this->error(__('Invalid parameters'));
        }
        if ($type == 'mobile')
        {
            if (!Validate::regex($mobile, "^1\d{10}$"))
            {
                $this->error(__('Mobile is incorrect'));
            }
            $user = \app\common\model\User::getByMobile($mobile);
            if (!$user)
            {
                $this->error(__('User not found'));
            }
            $ret = Sms::check($mobile, $captcha, 'resetpwd');
            if (!$ret)
            {
                $this->error(__('Captcha is incorrect'));
            }
            Sms::flush($mobile, 'resetpwd');
        }
        else
        {
            if (!Validate::is($email, "email"))
            {
                $this->error(__('Email is incorrect'));
            }
            $user = \app\common\model\User::getByEmail($email);
            if (!$user)
            {
                $this->error(__('User not found'));
            }
            $ret = Ems::check($email, $captcha, 'resetpwd');
            if (!$ret)
            {
                $this->error(__('Captcha is incorrect'));
            }
            Ems::flush($email, 'resetpwd');
        }
        //模拟一次登录
        $this->auth->direct($user->id);
        $ret = $this->auth->changepwd($newpassword, '', true);
        if ($ret)
        {
            $this->success(__('Reset password successful'));
        }
        else
        {
            $this->error($this->auth->getError());
        }
    }

    /**
     * 获取用代金卷（支付用）
     * 
     * @param token $user_id 
     * @param string $token
     */
    public function getusercoupon()
    {
        $user_id = $this->request->request("user_id");
        $token = $this->request->request("token");
        $checkMoney = $this->request->request("checkMoney");
        if (!$user_id || !$token || !$checkMoney)
        {
            $this->error(__('Invalid parameters'));
        }
        
        $coupon = Db::table('tb_coupon')
        ->where("user_id = {$user_id} and expiretime >=".time()." and used = 0 and `condition` <= {$checkMoney}")
        ->field('id as coupon_id,worth,desc')
        ->order('expires_in desc,worth desc')
        ->select();
        
        $coupon = $coupon ? $coupon : [];
        
        $this->success('获取成功',['usercoupon'=>$coupon,'coupon'=>config('wechatcup')]); 
    }
    /**
     * 获取用户余额、E币
     * 
     * @param token $user_id 
     * @param string $token
     */
    public function getusercharge()
    {   
        $user_id = $this->request->request("user_id");
        $token = $this->request->request("token");
        if (!$user_id || !$token)
        {
            $this->error(__('Invalid parameters'));
        }
        
        $data = Db::table('tb_user')->where('id',$user_id)->field('total_charge,e_coin')->find();
        $data = $data ? $data : []; 

        $this->success('获取成功',$data); 
    }

    /**
     * 获取用户优惠卷列表
     * 
     * @param token $user_id 
     * @param string $token
     */
    public function getcoupon()
    {
        $user_id = $this->request->request("user_id");
        $token = $this->request->request("token");
        if (!$user_id || !$token)
        {
            $this->error(__('Invalid parameters'));
        }

        $coupon = Db::table('tb_coupon')
        ->where(['user_id'=>$user_id])
        ->order('used asc,expires_in desc,worth desc')
        ->limit(100)
        ->select();
        foreach ($coupon as $key => $value) {
            if($value['expiretime'] < time()){
                $coupon[$key]['used'] = 2;
            }
            $coupon[$key]['expires_in'] = date('Y.m.d',$value['expires_in']);
            $coupon[$key]['expiretime'] = date('Y.m.d',$value['expiretime']);
        }
        $coupon = $coupon ? $coupon : [];
        
        $this->success('获取成功',$coupon); 
    }

}
