export default {
    PREXFIX_LOGIN: "simulationSystem",

    loginApi: '/api/user/login',
    logoutApi: '/api/user/logout',

    senceApi: '/get_all_scene',//获取所有场景列表
    senceDetailApi: '/get_scene',//获取单个场景详情
    senceAddApi: '/scene_add',//添加场景
    senceModifyApi: '/modify',//编辑场景
    senceDeleteApi: '/delete_scene_test',//删除场景
    senceTestApi: '/scene_test_commit',//场景测试

    addSenceResultApi: '/simulation',//创建仿真结果
    senceResultHistoryApi: '/get_simulation_result',
    senceResultListApi: '/get_simulation_result_by_sceneid',//获取某场景下的仿真记录
    senceResultDeleteApi: '/delete_simulation_result',//删除仿真记录
    senceResultDetailApi: '/get_simulation_result_by_id',//获取单个仿真结果详情

    loadPredictApi: '/load_predict_new',//负荷预测
    loadSearchApi: '/load_search',//负荷查询

}