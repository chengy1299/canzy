define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'order/orderhand/index',
                    // add_url: 'order/orderhand/add',
                    // edit_url: 'order/orderhand/edit',
                    // del_url: 'order/orderhand/del',
                    multi_url: 'order/orderhand/multi',
                    table: 'order',
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'order_id',
                sortName: 'order.createtime',
                escape: false,
                columns: [
                    [
                        {checkbox: true},
                        {field: 'order_id', title: __('Order_Id'),operate: false},
                        {field: 'pay_no', title: __('Pay_No'),sortable:true,visible:false},
                        {field: 'user_id', title: __('User_Id'),formatter:Table.api.formatter.search},
                        //{field: 'goods_info', title: __('Goods_Info'), operate: 'FIND_IN_SET', formatter: Table.api.formatter.label},
                        {field: 'goods_count', title: __('Goods_Count')},
                        {field: 'goods_amount', title: __('Goods_Amount')},
                        {field: 'coupon_amount', title: __('Coupon_Amount')},
                        {field: 'coupon_id', title: __('Coupon_Id')},
                        {field: 'order_amount', title: __('Order_Amount')},
                        {field: 'remark', title: __('Remark')},
                        {field: 'eat_type', title: __('Eat_Type')},
                        {field: 'take_food_no', title: __('Take_Food_No'),formatter:Table.api.formatter.search,operate: 'BETWEEN'},
                        {field: 'order_type_time', title: __('Order_Type_Time')},
                        {field: 'payment_code', title: __('Payment_Code')},
                        {field: 'payment_time', title: __('Payment_Time'),formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange', sortable: true, visible: false},
                        {field: 'finnshed_time', title: __('Finnshed_Time'),formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange', sortable: true, visible: false},
                        {field: 'order_state', title: __('Order_State')},
                        {
                            field: 'order_state',
                            title: __('点击完成'),
                            table: table,
                            events: Table.api.events.operate,
                            buttons: [
                                {
                                    name: 'ajax',
                                    text: __('点击完成'),
                                    title: __('点击完成'),
                                    classname: 'btn btn-xs btn-success btn-magic btn-ajax',
                                    icon: 'fa fa-list',
                                    url: 'order/orderhand/finish',
                                    confirm: '确认完成？',
                                    success: function (data, ret) {                
                                        $(".btn-refresh").trigger("click");
                                        //如果需要阻止成功提示，则必须使用return false;
                                        //return false;
                                    },
                                    error: function (data, ret) {
                                        console.log(data, ret);
                                        Layer.alert(ret.msg);
                                        return false;
                                    }
                                }
                            ],
                            formatter: Table.api.formatter.buttons
                        },
                        {field: 'createtime', title: __('Createtime'), formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange', sortable: true, visible: true},
                        {field: 'updatetime', title: __('Updatetime'), formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange', sortable: true, visible: false},
                        //{field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                        {field: 'operate', title: __('Operate'), table: table,
                            events: Table.api.events.operate,
                            buttons: [{
                                    name: 'detail',
                                    text: '商品详情',
                                    icon: 'fa fa-list',
                                    classname: 'btn btn-info btn-xs btn-detail btn-dialog',
                                    url: 'order/orderhand/detail'
                                }],
                            formatter: Table.api.formatter.operate
                        },
                    ]
                ],
                pagination: true,
                search: true,
                commonSearch: true,
                pageList:[20,50,100],
            });

            // 为表格绑定事件
            Table.api.bindevent(table);
        },
        add: function () {
            Controller.api.bindevent();
        },
        edit: function () {
            Controller.api.bindevent();
        },
        api: {
            bindevent: function () {
                $(document).on('click', "input[name='row[order_state]']", function () {
                    var name = $("input[name='row[name]']");
                    name.prop("placeholder", $(this).val() == 1 ? name.data("placeholder-menu") : name.data("placeholder-node"));
                });
                $("input[name='row[order_state]']:checked").trigger("click");
                Form.api.bindevent($("form[role=form]"));
            }
        }
    };
    return Controller;
});