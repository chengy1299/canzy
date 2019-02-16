<?php

namespace app\api\controller;

use app\common\controller\Api;
use app\common\model\GoodsList;
use think\Db;

/**
 * 示例接口
 */
class Goods extends Api
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
     * 获取商品列表
     *
     * @param ApiTitle    获取商品列表
     * @param ApiMethod   (GET)
     */
    public function getgoods()
    {   
        //商品分类
        $goods_type = Db::table('tb_goods_type')->column('id,models,name');

        //商品
        $goods = GoodsList::where('status',1)->select();

        $data = [];
        $goodsType = [];
        foreach ($goods_type as $id => $row) 
        {   
            $type = json_decode($row['models'],true);
            if($type){
                $item = [];
                foreach ($type as $key => $value) {
                    $t['name'] = $key;
                    $t['index'] = 0;
                    $t['item'] = explode(',', $value);
                    $item[] = $t;
                }
                $goodsType[$id] = $item;
            }
            $temp['name'] = $row['name'];
            $temp['goods'] = [];
            foreach ($goods as $k => $v) 
            {
                if($id == $v['type_id'])
                {   
                    $v['img'] = 'https://order123.top/canzy'.$v['img'];
                    $temp['goods'][] = $v;
                }
            }
            $data[] = $temp;
        }
        $open = Db::table('tb_config')->where('id',18)->field('value')->find();

        $this->success('返回成功', ['data'=>$data,'goods_type'=>$goodsType,'coupon'=>config('wechatcup'),'open'=>isset($open['value'])?$open['value']:0]);
    }

    /**
     * 获取商品优惠配置
     *
     * @param ApiTitle    获取商品列表
     * @param ApiMethod   (GET)
     */
    public function getcoupon()
    {   
        //$this->success('返回成功', $this->request->param());
        $this->success('返回成功', config('wechatcup'));
    }

    /**
     * 获取商品列表
     *
     * @param ApiTitle    获取商品列表
     * @param ApiMethod   (GET)
     */
    public function getegoods()
    {   
        //商品分类
        $goods_type = Db::table('tb_goods_type')->column('id,models,name');
        //商品
        $goods = GoodsList::where('e_status','1')->select();

        $data = [];
        $goodsType = [];
        foreach ($goods_type as $id => $row) 
        {   
            $type = json_decode($row['models'],true);
            if($type){
                $item = [];
                foreach ($type as $key => $value) {
                    $t['name'] = $key;
                    $t['index'] = 0;
                    $t['item'] = explode(',', $value);
                    $item[] = $t;
                }
                $goodsType[$id] = $item;
            }
            $temp['name'] = $row['name'];
            $temp['goods'] = [];
            foreach ($goods as $k => $v) 
            {
                if($id == $v['type_id'])
                {   
                    $v['img'] = 'https://order123.top/canzy'.$v['img'];
                    $temp['goods'][] = $v;
                }
            }
            $data[] = $temp;
        }
        $open = Db::table('tb_config')->where('id',18)->field('value')->find();

        $this->success('返回成功', ['goods'=>$data,'goods_type'=>$goodsType,'open'=>isset($open['value'])?$open['value']:0]);
    }

}
