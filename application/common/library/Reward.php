<?php

namespace app\common\library;

use think\Exception;
use think\exception\PDOException;
use think\Db;

class Reward
{
    /*
    假设：有一个二维数组，记录了所有本次抽奖的奖项信息：
    $test_arr =array('a'=>20,'b'=>30,'c'=>50);
    a奖概率20%，b奖概率30%，c奖概率50%
    模拟函数执行过程：
    总概率精度为20+30+50=100
    第一次数组循环，$procur=20
    假设抽取的随机数rand(1,100)，假设抽到$randNum=55
    如果$randNum<=20,则result=a
    否则进入下一循环，总概率精度变为100-20=80
    第二次数组循环，$procur=30
    假设抽取的随机数rand(1,80)，假设抽到$randNum=33
    如果$randNum<=30,则result=b
    否则进入下一循环，总概率精度变为80-30=50
    第三次数组循环，$prosur=50;
    假设抽取的随机数rand(1,50)，不管怎么抽，随机数都会<或=50，
    那么得出result=c;
    因为样本没有改变，虽然可能抽取的随机数不止一个，但是概率是不变的。
    */
    private static function get_rand($proArr) { 
        
        $result = ''; 
        //概率数组的总概率精度
        $proSum = array_sum($proArr); 
        //概率数组循环  
        foreach ($proArr as $key => $proCur) { 
            $randNum = mt_rand(1, $proSum);             
            if ($randNum <= $proCur) { 
                $result = $key;                       
                break; 
            } else { 
                $proSum -= $proCur;                     
            } 
        } 
        unset ($proArr); 
        return $result; 
    }
    
    /**
     * @access public
     * @param  user_id 用户id money 支付金额 
     * @return boolean 
     */
    public static function reward($user_id = 0,$money = 0){
        /* 
         * 奖项数组 
         * 是一个二维数组，记录了所有本次抽奖的奖项信息， 
         * 其中id表示中奖等级，prize表示奖品，rate表示中奖概率。 
         * 注意其中的rate必须为整数，如果rate设置成0，即意味着该奖项抽中的几率是0， 
         * 数组中rate的总和（基数），基数越大越能体现概率的准确性。 
         * 本例中rate的总和为100，那么MAC对应的 中奖概率就是1%， 
         * 如果rate的总和是10000，那中奖概率就是万分之一了。  
         */  
        // $prize_arr = array(   
        //     '0' => array('id'=>1,'prize'=>'MAC','rate'=>1),   
        //     '1' => array('id'=>2,'prize'=>'iPhone','rate'=>5),   
        //     '2' => array('id'=>3,'prize'=>'iPad','rate'=>10),   
        //     '3' => array('id'=>4,'prize'=>'iWatch','rate'=>12),   
        //     '4' => array('id'=>5,'prize'=>'iPod','rate'=>22),   
        //     '5' => array('id'=>6,'prize'=>'抱歉!再接再厉','rate'=>50),   
        // );  
        /* 
         * 每次前端页面的请求，PHP循环奖项设置数组， 
         * 通过概率计算函数get_rand获取抽中的奖项id。 
         * 将中奖奖品保存在数组$res['yes']中， 
         * 而剩下的未中奖的信息保存在$res['no']中。  
         */  
        // foreach ($prize_arr as $key => $val) {   
        //     $arr[$val['id']] = $val['rate'];   
        // }   
        // $rid = get_rand($arr); //根据概率获取奖项id   
          
        // $res['yes'] = $prize_arr[$rid-1]['prize']; //中奖项   
        // unset($prize_arr[$rid-1]); //将中奖项从数组中剔除，剩下未中奖项   
        // shuffle($prize_arr); //打乱数组顺序   
        // for($i=0;$i<count($prize_arr);$i++){   
        //     $pr[] = $prize_arr[$i]['prize'];   
        // }   
        // $res['no'] = $pr;   //未中奖项  
        // print_r($res);  
        $data = Db::table('tb_config')->where(['group'=>'reward'])->select();
        $is_open_reward = 0;
        $first_reward = [];
        $second_reward = [];
        $reward = [];
        foreach ($data as $v) {
            if($v['name'] == 'is_open_reward'){
                $is_open_reward = $v['value'];
            }elseif($v['name'] == 'first_reward'){
                $first_reward = json_decode($v['value'],true);
            }elseif($v['name'] == 'second_reward'){
                $second_reward = json_decode($v['value'],true);
            }
        }
        //如果未开启
        if($is_open_reward != 1){
            return false;
        }
        $checkNum = Db::table('tb_order')->where(['user_id'=>$user_id])->limit(2)->select();
        if(count($checkNum) > 1){
            $reward = $second_reward;
        }else{
            $reward = $first_reward;
        }
        $percent = 0;
        foreach ($reward as $per => $v) {
            $t = explode('-',$v);
            if($per == 0 && (($money >= $t[0] && $money <= $t[1]) || $money >= $t[0]) ){
                return false;
                break;
            }elseif($money >= $t[0] && $money <= $t[1]){
               $percent = $per;
               break;
            }
            
        }
        //设置概率数组
        $arr = [
            "yes"=> $percent,//命中免单概率
            "no"=> 100 - $percent
        ];

        $rid = self::get_rand($arr); //根据概率获取奖项id  
        if($rid == "yes"){
            return true;//抽中免单
        }
        return false;//未抽中免单
    }


}
