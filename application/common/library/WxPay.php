<?php

namespace app\common\library;

use think\App;
use think\Config;
use think\Log;

class WxPay 
{
    private $appid = "wx99abd1149b53e297";
    private $mch_id = "1512278761";
    private $ApiKey = "813db7dd97edd55d819ca76331001d5f";
    //传递参数给微信,生成预支付订单! 接收微信返回的数据,在反给APP端,APP端调用支付接口,完成支付
    public function pay($body,$order_id,$total_fee,$spbill_create_ip,$openid) 
    {
        $nonce_str = $this->rand_code();        //调用随机字符串生成方法获取随机字符串
        $data['appid'] = $this->appid;          //appid
        $data['mch_id'] = $this->mch_id;        //商户号
        $data['nonce_str'] = $nonce_str;        //随机字符串
        $data['body'] = $body;                  //商品描述
        $data['out_trade_no'] = $order_id;      //商户订单号,不能重复
        $data['total_fee'] = $total_fee;        //金额(单位：分)
        $data['spbill_create_ip'] = $spbill_create_ip;   //用户端实际ip
        $data['notify_url'] = 'https://order123.top/canzy/api/pay/wx_notify'; //回调地址,用户接收支付后的通知,必须为能直接访问的网址,不能跟参数
        $data['openid'] = $openid;
        $data['trade_type'] = 'JSAPI';      //支付方式
        //将参与签名的数据保存到数组  注意：以上几个参数是追加到$data中的，$data中应该同时包含开发文档中要求必填的剔除sign以外的所有数据
        $data['sign'] = $this->getSign($data);        //获取签名
        $xml = $this->ToXml($data);            //数组转xml
        
        //curl 传递给微信方
        $url = "https://api.mch.weixin.qq.com/pay/unifiedorder";
        //header("Content-type:text/xml");
        $ch = curl_init();
        curl_setopt($ch,CURLOPT_URL, $url);
        if(stripos($url,"https://")!==FALSE){
            curl_setopt($ch, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
        }    else    {
            curl_setopt($ch,CURLOPT_SSL_VERIFYPEER,TRUE);
            curl_setopt($ch,CURLOPT_SSL_VERIFYHOST,2);//严格校验
        }
        //设置header
        curl_setopt($ch, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1);
        curl_setopt($ch, CURLOPT_HEADER, FALSE);
        //要求结果为字符串且输出到屏幕上
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        //设置超时
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_POST, TRUE);
        //传输文件
        curl_setopt($ch, CURLOPT_POSTFIELDS, $xml);
        //运行curl
        $data = curl_exec($ch);

        //返回结果
        if($data){ 
            curl_close($ch);
            //返回成功,将xml数据转换为数组.
            $re = $this->FromXml($data); 
            if($re['return_code'] != 'SUCCESS'){ 
               return json_encode($re);
            }
            else{
                //接收微信返回的数据,传给APP!
                $arr =array(
                    //'prepayid' =>$re['prepay_id'],
                    'appId' => $this->appid,
                    //'partnerid' => $this->mch_id,
                    'package' =>'prepay_id=' .$re['prepay_id'],
                    'signType' =>'MD5',
                    'nonceStr' => $nonce_str,
                    'timeStamp' =>time(),
                );
                //第二次生成签名
                $sign = $this->getSign($arr);
                $arr['sign'] = $sign;
                unset($arr['appId']);
                return json_encode(array('return_code'=>200,'msg'=>'签名成功','data'=>$arr));
            }
        } else {
            $error = curl_errno($ch);
            curl_close($ch);
            return json_encode('201',"curl出错，错误码:$error");
        }
    }

    //传输给微信的参数要组装成xml格式发送,传如参数数组
    public function ToXml($data=array())
    {
        if(!is_array($data) || count($data) <= 0)
        {
           return '数组异常';
        }

        $xml = "<xml>";
        foreach ($data as $key=>$val)
        {
            if (is_numeric($val)){
                $xml.="<".$key.">".$val."</".$key.">";
            }else{
                $xml.="<".$key."><![CDATA[".$val."]]></".$key.">";
            }
        }
        $xml.="</xml>";
        return $xml;
    }

    //生成随机字符串,微信所需参数
    public function rand_code(){
        $str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';//62个字符
        $str = str_shuffle($str);
        $str = substr($str,0,32);
        return  $str;
    }
    
    //这里是微信比较重要的一步了,这个方法会多次用到!生成签名
    public function getSign($params) {
        ksort($params);        //将参数数组按照参数名ASCII码从小到大排序
        foreach ($params as $key => $item) {
            if (!empty($item)) {         //剔除参数值为空的参数
                $newArr[] = $key.'='.$item;     // 整合新的参数数组
            }
        }
        $stringA = implode("&", $newArr);         //使用 & 符号连接参数
        $stringSignTemp = $stringA."&key=".$this->ApiKey;        //拼接key
        // key是在商户平台API安全里自己设置的
        $stringSignTemp = MD5($stringSignTemp);       //将字符串进行MD5加密
        $sign = strtoupper($stringSignTemp);      //将所有字符转换为大写
        return $sign;
    }

    
    
    //将xml数据转换为数组,接收微信返回数据时用到.
    public function FromXml($xml)
    {
        if(!$xml){
            echo "xml数据异常！";
        }
        //将XML转为array
        //禁止引用外部xml实体
        libxml_disable_entity_loader(true);
        $data = json_decode(json_encode(simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA)), true);
        return $data;
    }
 
 
}
