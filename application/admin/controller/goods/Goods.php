<?php

namespace app\admin\controller\goods;

use app\common\controller\Backend;

/**
 * 商品列表
 *
 * @icon fa fa-user
 */
class Goods extends Backend
{

    protected $relationSearch = true;
    protected $multiFields = 'e_status,status,is_sell_out';

    /**
     * @var \app\admin\model\Goods
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = model('goods');
        //商品类型
        $goodsType = \app\admin\model\GoodsType::column('id,name');
        $this->view->assign("goodsType", $goodsType);
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
                    ->with('type')
                    ->where($where)
                    ->order($sort, $order)
                    ->count();
            $list = $this->model
                    ->with('type')
                    ->where($where)
                    ->order($sort, $order)
                    ->limit($offset, $limit)
                    ->select();

            $result = array("total" => $total, "rows" => $list);
             
            return json($result);
        }
        return $this->view->fetch();
    }

    

    /**
     * 编辑
     */
    public function edit($ids = NULL)
    {   
        $row = $this->model->get($ids);
        if (!$row)
            $this->error(__('No Results were found'));
        $this->view->assign('goodsType', build_select('row[type_id]', \app\admin\model\GoodsType::column('id,name'), $row['type_id'], ['class' => 'form-control selectpicker']));
        return parent::edit($ids);
    }

}
