<?php

namespace app\admin\controller\order;

use app\common\controller\Backend;
use think\Db;

/**
 * 订单列表
 *
 * @icon fa fa-order
 */
class Orderhand extends Backend
{

    protected $relationSearch = true;
    protected $multiFields = 'order_state,status';

    /**
     * @var \app\admin\model\Order
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = model('Order');
    }   

    /**
     * 查看
     */
    public function index()
    {   
        //设置过滤方法
        $this->request->filter(['strip_tags']);
        if ($this->request->isAjax())
        {   
            //如果发送的来源是Selectpage，则转发到Selectpage
            if ($this->request->request('keyField'))
            {
                return $this->selectpage();
            }
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            $total = $this->model
                    ->with('user')
                    ->where($where)
                    ->where('order.order_state',2)
                    ->order($sort, $order)
                    ->count();
            $list = $this->model
                    ->with('user')
                    ->where($where)
                    ->where('order.order_state',2)
                    ->order($sort, $order)
                    ->limit($offset, $limit)
                    ->select();
                    
            $pay = [1=>'微信支付',2=>'支付宝',3=>'余额支付',4=>'E币兑换',5=>'免单'];
            $orderState = [0=>'已取消',1=>'未付款',2=>'已付款',3=>'已完成'];
            
            foreach ($list as $k => $v) {
                $list[$k]['coupon_amount'] = '-' . $v['coupon_amount'];
                $worth = Db::table('tb_coupon')->where('id',$v['coupon_id'])->column('worth');
                $list[$k]['coupon_id'] = $worth ? '-' . $worth[0] : '无';
                $list[$k]['eat_type'] = $v['eat_type'] == 1 ? '堂食' : '外带';
                $list[$k]['payment_code'] = $pay[$v['payment_code']];
                $list[$k]['order_type_time'] = $v['order_type_time'] == '0' ? '即时订单' : $v['order_type_time'];
                $list[$k]['order_state'] = $orderState[$v['order_state']];
            }        
            $result = array("total" => $total, "rows" => $list);
            
            return json($result);
        }
        return $this->view->fetch();
    }

    /**
     * 商品详情
     */
    public function detail($ids = NULL)
    {   
        $row = $this->model->get($ids);
        if (!$row)
            $this->error(__('No Results were found'));
        $row->goods_info = json_decode($row->goods_info,true);
        
        $this->view->assign("row", $row->toArray());
        return $this->view->fetch();
    }
    /**
    *点击完成
    */
    public function finish($ids){
        if ($this->request->isAjax())
        {
            $res = Db::table('tb_order')->where(array(
                'order_id'=>$ids
            ))->update(array(
                'order_state'=>3
            ));
            $this->success();
        }
    }
    /**
     * 编辑
     */
    // public function edit($ids = NULL)
    // {   
    //     $row = $this->model->get($ids);
    //     if (!$row)
    //         $this->error(__('No Results were found'));
    //     $this->view->assign('goodsType', build_select('row[type_id]', \app\admin\model\GoodsType::column('id,name'), $row['type_id'], ['class' => 'form-control selectpicker']));
    //     return parent::edit($ids);
    // }

}
