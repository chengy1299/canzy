define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'goods/goods/index',
                    add_url: 'goods/goods/add',
                    edit_url: 'goods/goods/edit',
                    del_url: 'goods/goods/del',
                    multi_url: 'goods/goods/multi',
                    table: 'goods',
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'goods.sales',
                escape: false,
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id')},
                        {field: 'type_id', title: __('Type_id'), visible: false},
                        {field: 'type.name', title: __('Type_name')},
                        {field: 'name', title: __('Name')},
                        {field: 'img', title: __('Img'),formatter: Table.api.formatter.image, operate: false},
                        {field: 'price', title: __('Price')},
                        {field: 'e_status', title: __('是否E币兑换')},
                        {field: 'e_price', title: __('E币价格')},
                        {field: 'sales', title: __('Sales')},
                        {field: 'is_sell_out', title: __('Is_Sell_Out'), formatter: Table.api.formatter.toggle},
                        {field: 'status', title: __('Status'), formatter: Table.api.formatter.toggle},
                        {field: 'createtime', title: __('Createtime'), formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange', sortable: true, visible: false},
                        {field: 'updatetime', title: __('Updatetime'), formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange', sortable: true, visible: false},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ],
                pagination: true,
                search: true,
                commonSearch: true,
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
                $(document).on('click', "input[name='row[status]']", function () {
                    var name = $("input[name='row[name]']");
                    name.prop("placeholder", $(this).val() == 1 ? name.data("placeholder-menu") : name.data("placeholder-node"));
                });
                $("input[name='row[is_putaway]']:checked").trigger("click");
                Form.api.bindevent($("form[role=form]"));
            }
        }
    };
    return Controller;
});