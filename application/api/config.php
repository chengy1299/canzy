<?php

//配置文件
return [
    'exception_handle'        => '\\app\\api\\library\\ExceptionHandle',
    //微信小程序配置
    'wechatmini'=>[
	    'app_id' => 'wx99abd1149b53e297',
	    'app_secret' => '2c170ce70f33454e3dfe5fr534184dd52b',
	    'get_access_token_url' => "https://api.weixin.qq.com/sns/jscode2session",//微信小程序登录
	],
	'wechatcup'=>[
		'is_coupon'=>true,//true开启优惠，false关闭
		'total_money'=>20,//满20减3
		'coupon'=>3
	],
	'e_coin'=>[
		'on'=>false,//是否开启赠送e币
		'condition'=>10,//赠送订单满10
		'coin'=>1//赠送1E币
	],
	'reward_coupon'=>[
		'on'=>true,//是否开启赠送优惠卷
		'condition'=>10,//赠送订单满10
		'reward'=>[//赠送优惠卷
		   'worth' => 2,
		   'desc' =>'订单满30减2元（除去折扣）',
		   'condition' =>30,
		   'expires' =>15//有效天数,
		]
	]
];
