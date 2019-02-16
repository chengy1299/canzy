<?php

namespace app\admin\controller;

use app\common\controller\Backend;
use think\Log;
/**
 * banner图管理
 *
 * @icon
 */
class Banner extends Backend
{

    protected $relationSearch = true;


    /**
     * @var \app\admin\model\Banner
     */
    protected $model = null;

    public function _initialize()
    {   
        parent::_initialize();
        $this->model = model('Banner');
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
                    ->where($where)
                    ->order('listorder', $order)
                    ->count();
            $list = $this->model
                    ->where($where)
                    ->order('listorder', $order)
                    ->limit($offset, $limit)
                    ->select();
            $result = array("total" => $total, "rows" => $list);
            return json($result);
        }
        return $this->view->fetch();
    }

}
