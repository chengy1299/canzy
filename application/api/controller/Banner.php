<?php

namespace app\api\controller;

use app\common\controller\Api;
use think\Db;

/**
 * 示例接口
 */
class Banner extends Api
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
     * 获取banner图
     *
     * @param ApiTitle
     * @param ApiMethod
     */
    public function getbanner()
    {   
        $data = Db::table('tb_banner')->order('listorder')->field('id,banner_code,listorder')->select();
        
        $banner = [];
        $center = '';
        foreach ($data as $key=> $value) {
            if($value['listorder']==1){
                $center = 'https://order123.top/canzy'.$value['banner_code'];
            }else{
               $banner[] = 'https://order123.top/canzy'.$value['banner_code'];
            }           
        }
        $this->success('返回成功',['banner'=>$banner,'center'=>$center]);
    }

}
