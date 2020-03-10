import React,{useState,useEffect} from 'react'
import Papa from 'papaparse'
import echarts from 'echarts';
import { Card, Row, Col, Button, Tooltip, Divider, Modal, Icon } from 'antd';
import '../App.scss';
import pic from '../images/pic.png';
import LOGO from '../images/ic-logo.png';
const deviceArray = ['余杭·燃气蒸汽锅炉','廊坊·燃气蒸汽锅炉','长沙·燃气蒸汽锅炉','广州·燃气蒸汽锅炉'];
// const GBName = {Ffuel:'燃气耗量(m³)',Fs:'蒸汽产量(t)'};
const GBName = {TsPreOut_abnormal:'冷凝器出口温度(℃)',TpreIn_abnormal:'冷凝器进口烟温(℃)',Texh_abnormal:'锅炉排烟温度(℃)',PAw_abnormal:'给水入口压力(Mpa)',TsEcoOut_abnormal:'节能器出口温度(℃)',PAs0_abnormal:'蒸汽压力(Mpa)',Ts0_abnormal:'蒸汽温度(℃)'};
const COMMRUNSTEP = 10;
const paraArr = ['TsPreOut_abnormal','TpreIn_abnormal','Texh_abnormal','PAw_abnormal','TsEcoOut_abnormal','PAs0_abnormal','Ts0_abnormal'];
let profileChart = null;
let intervalFun = null;
let paraIntervalFun = null;
let barIntervalFun = null;
let upIndex = 0;
let paraIndex = 0;//最大420
let barIndex = 0;
let chartObj = {};
let upstart = 0;
let upend = 500;
export default function() {
    const [deviceData, setDeviceData] = React.useState({});
    const [selectDevice,setSelectDevice] = useState('全部');//设备选择
    const [runFlag, setRunFlag] = useState(false);
    const [nowIndex, setNowIndex] = useState(0);//当前运行到第几个数据
    const [detailFlag,setDetailFlag] = useState(false);//详情弹窗标示
    const [detailName, setDetailName] = useState('余杭·燃气蒸汽锅炉');//显示详情的设备
    const [goon, setGoon] = useState(false);
    async function getData(filename) {
        const response = await fetch('/data/'+filename+'.csv')
        const reader = response.body.getReader()
        const result = await reader.read() // raw array
        const decoder = new TextDecoder('utf-8')
        const csv = decoder.decode(result.value) // the csv text
        const results = Papa.parse(csv, { header: true }) // object with { data, errors, meta }
        const rows = results.data // array of objects
        const keys = Object.keys(rows[0]);
        let params = {};
        keys.map((key)=>{
            params[key] = [];
        })
        for (let i = 0 ; i < rows.length; i++) {
            keys.map((key)=>{
                params[key].push(rows[i][key]);
            })
        }
        return params;
    }
    function getdeviceData(){
        let profileFileName = 'profit02';
        let paramsFileName = 'GSB02';
        let deviceResult = {'全部':[]};
        deviceArray.map((device,index)=>{
            if(device === '余杭·燃气蒸汽锅炉'){
                profileFileName = 'profit02';
                paramsFileName = 'GSB02';
            }else if(device === '廊坊·燃气蒸汽锅炉'){
                profileFileName = 'profit03';
                paramsFileName = 'GSB03';
            }
            else if(device === '长沙·燃气蒸汽锅炉'){
                profileFileName = 'profit05';
                paramsFileName = 'GSB05';
            }
            else if(device === '广州·燃气蒸汽锅炉'){
                profileFileName = 'profit06';
                paramsFileName = 'GSB06';
            }
            deviceResult[device] = {};
            getData(profileFileName).then((res)=>{
                deviceResult[device] = Object.assign(deviceResult[device], res);
                // console.log(res);
                showLeftLearnCharts('oneLearnChart'+index,'oneLearnChart'+index,device,'fed_fix',res,500);
                showLeftLearnCharts('oneLocalChart'+index,'oneLocalChart'+index,device,'local_fix',res,500);
                if(index === 0){
                    ['fed_fix','local_fix','preventive_fix','corrective_fix'].map((name,second)=>{
                        showLeftLearnCharts('oneModalChart'+second,'oneModalChart'+second,selectDevice,name,res || [],500);
                    });
                }
            });
            getData(paramsFileName).then((res)=>{
                deviceResult[device] = Object.assign(deviceResult[device], res);
                showParamsCharts('oneParamsChart'+index,'oneParamsChart'+index,device,'PAs0_abnormal',res,1);
                showParamsCharts('twoParamsChart'+index,'twoParamsChart'+index,device,'Ts0_abnormal',res,2);
                if(index === 0){
                    paraArr.map((name,second)=>{
                        showParamsCharts('oneModalParamsChart'+second,'oneModalParamsChart'+second,selectDevice,name,res || [],1);
                    })
                }
            });
        });
        getData('allprofit').then((res)=>{
            deviceResult['全部'] = res;
            showProfileCharts(res);
        });
        console.log(deviceResult[selectDevice]);
        setDeviceData(deviceResult);
        
        // deviceArray.map((name,index)=>{
        //     console.log(deviceResult[name]);
        // });
    };
    //查看详情
    function showDetail(device){
        setDetailFlag(true);
        setDetailName(device);
        document.getElementById('detailModal').setAttribute('style', 'display: visable !important')
        console.log('是否在运行：'+runFlag);
        console.log('是否在暂停：'+goon);
    };
    function startRunProfileCharts(going){
        if(going){
            console.log(nowIndex,'upIndex:'+upIndex);
        }else{
            upIndex = 0;
            paraIndex = 0;
            barIndex = 0;
            setNowIndex(0);
            clearInterval(intervalFun);
            clearInterval(paraIntervalFun);
        }
        setRunFlag(false);
        setGoon(false);
        intervalFun = setInterval(() =>{
            const end = upIndex*COMMRUNSTEP+COMMRUNSTEP;
            const start = end < 500 ? 0 : end - 490;
            // console.log(deviceData[selectDevice]['time'][end-1],deviceData[selectDevice]['corrective'][end-1]);
            const maxValue = Math.ceil(Math.max.apply(null, deviceData[selectDevice]['fed_profit'].slice(start,end < 500 ? 500 : end)));
            const minValue = Math.floor(Math.min.apply(null,deviceData[selectDevice]['corrective_profit'].slice(start < 500 ? 0 : start,end)));
            const pend = paraIndex*(COMMRUNSTEP-5);
            if(paraIndex >= 420/(COMMRUNSTEP-5)){
                paraIndex = 0;
            }else{
                paraIndex ++;
            }
            // console.log(start,end,document.getElementById('oneModalChart0'));
            if(upIndex == 4000/(COMMRUNSTEP)){
                clearInterval(intervalFun);
                clearInterval(paraIntervalFun);
                clearInterval(barIntervalFun);
                console.log('结束',upIndex,paraIndex,pend);
                upIndex = 0;
                paraIndex = 0;
                upstart = start;
                upend = end;
                deviceArray.map((device,index)=>{
                    chartObj['oneParamsChart'+index].setOption(getRunParamsOption('PAs0_abnormal',420,deviceData[device]));
                    chartObj['twoParamsChart'+index].setOption(getRunParamsOption('Ts0_abnormal',420,deviceData[device]));
                });
            }else{
                const colors = ['#FEB927','#B45FD7','#219FFF','#01C5D1'];
                
                const seriseData = ['corrective_profit','preventive_profit','local_profit','fed_profit'].map((name,index)=>{
                    const temp = end < 1000 ?{yAxis: deviceData[selectDevice][name][end-1],
                    xAxis: deviceData[selectDevice]['time'][end-2],} :{yAxis: deviceData[selectDevice][name][end-1],
                            xAxis: deviceData[selectDevice]['time'][end-1],
                            // x: '93%',
                        };
                    return {
                        sampling:'average',
                        // animationEasing:'quarticInOut',
                        data: deviceData[selectDevice][name].slice(start,end),
                        markPoint : {
                            data : [
                                {
                                    value : '¥'+Math.floor(deviceData[selectDevice][name][end-1]),
                                    name: '最后的值',
                                    ...temp,
                                    symbolSize:1,
                                    label:{
                                      normal:{
                                        borderColor:colors[index],
                                        backgroundColor:colors[index],
                                        padding:[6,4],
                                        borderRadius:10,
                                        color: '#fff',
                                        fontWeight:'bolder',
                                        fontSize:12
                                      }
                                    }
                                }
                            ]
                        }
                    }
                })
                profileChart.setOption({
                    yAxis:{
                        max: maxValue,
                        min: minValue,
                        // interval: (maxValue - minValue)/3
                    },
                    xAxis:{
                        data:deviceData[selectDevice]['time'].slice(start,end < 1000 ? 1000 :end),
                        // splitNumber:5,
                        axisLabel:{
                            interval:250
                        }
                    },
                    series: seriseData
                });
                setTimeout(()=>{
                    deviceArray.map((device,index)=>{
                        chartObj['oneParamsChart'+index].setOption(getRunParamsOption('PAs0_abnormal',pend,deviceData[device]));
                        chartObj['twoParamsChart'+index].setOption(getRunParamsOption('Ts0_abnormal',pend,deviceData[device]));
                        chartObj['oneLearnChart'+index].setOption(getRunBarOption('fed_fix',start,end,deviceData[device]));
                        chartObj['oneLocalChart'+index].setOption(getRunBarOption('local_fix',start,end,deviceData[device]));
                    });
                    if(document.getElementById('oneModalChart0')){
                        console.log('弹窗显示变化');
                        // chartObj['oneModalParamsChart0'].setOption(getRunParamsOption('PAs0_abnormal',pend,deviceData[detailName]));
                        ['fed_fix','local_fix','preventive_fix','corrective_fix'].map((name,index)=>{
                            chartObj['oneModalChart'+index].setOption(getRunBarOption(name,start,end,deviceData[detailName]));
                        });
                        paraArr.map((name,index)=>{
                            chartObj['oneModalParamsChart'+index].setOption(getRunParamsOption(name,pend,deviceData[detailName]));
                        })
                    }
                },0);
                upIndex++;
                setNowIndex((upIndex*COMMRUNSTEP+COMMRUNSTEP)-1);
            }
        }, 100);
    }
    function steopRunProfilecahrts(){
        console.log(intervalFun);
        console.log('需要暂停');
        setRunFlag(false);
        setGoon(true);
        clearInterval(paraIntervalFun);
        clearInterval(barIntervalFun);
        console.log(intervalFun);
        console.log('重新开始');
        clearInterval(intervalFun);
    };

    function goingRunProfileCharts(){
        setGoon(false);
        startRunProfileCharts(true);
    };
    function showProfileCharts(data){
        // console.log(data);
        profileChart = echarts.init(document.getElementById('profitCharts'));
        // 绘制图表
        profileChart.setOption(allChartOption(data));
    };
    function showLeftLearnCharts(ids,chartName,device,modal,data,end){
        // console.log(data,ids);
        chartObj[chartName]= echarts.init(document.getElementById(ids));
        // 绘制图表
        // const data = deviceData[device];
        chartObj[chartName].setOption(selectBarOption(data,modal,end));
    };
    function showParamsCharts(ids,chartName,device,modal,data,colorType){
        chartObj[chartName] = echarts.init(document.getElementById(ids));
        // 绘制图表
        // console.log(data,modal);
        chartObj[chartName].setOption(selectParamsCharts(data,modal,colorType));
    };
    React.useEffect(() => {
        getdeviceData();
        setTimeout(()=>{
            console.log('过紧密',deviceData);
            setRunFlag(true);
        },1000);
    }, []) // [] means just do this once, after initial render
    function getOutputData(device,modal){
        // console.log(device)
        if(deviceData[device] && Object.keys(deviceData[device]).length > 0){
            // console.log(deviceData[device][modal]);
            return deviceData[device][modal];
        }else{
            return [];
        }
    };
  return (
    <div className='containWrap'>
            <div className='headerWrap'>
                <Row className='header' type="flex" justify="space-between">
                    <Col span={8} offset={8} className='title'>
                        <img className='logo' src={LOGO} alt='logo'/>联合学习预测性维护场景实例展示
                    </Col>
                    <Col span={8} style={{textAlign:'right'}}>
                        {
                            goon ? 
                            <Button className='btn' onClick={()=>goingRunProfileCharts()} type='primary'>继续</Button>
                            :
                            <Button className='btn' onClick={()=>steopRunProfilecahrts()} type='primary'>暂停</Button>
                        }
                        
                        <Button className='btn reset-btn' onClick={()=>startRunProfileCharts()}>重置</Button>
                    </Col>
                </Row>
            </div>
        <div className='app'> 
            <Row>
                <Col span={9} className='demo-left'>
                    {/* 图例说明 */}
                    <div className='left-desc'>
                        <div className='desc-item'>
                            <span className='desc-item-icon'></span><span>设备维护</span>
                        </div>
                        <div className='desc-item'>
                            <span className='desc-item-icon2'></span><span>故障维修</span>
                        </div>
                        <div className='desc-item'>
                            (色块长度代表维护/维修所需时长)
                        </div>
                    </div>
                    {/* {deviceData['余杭·燃气蒸汽锅炉'] && deviceData['余杭·燃气蒸汽锅炉']['fed_fix'] ? */}
                    <div>
                        {
                            deviceArray.map((name,index)=>{
                                // console.log(name);
                                return <Card key={index} 
                                    bordered={false} 
                                    hoverable={true} 
                                    className={(selectDevice == name) ? 'demo-item demo-item-select' : 'demo-item'} 
                                    title={name} 
                                    extra={<a className='moredetail' onClick={()=>showDetail(name)}>详情<Icon type="right" style={{marginLeft:3,fontSize:'12px',transform:'scale(0.8)'}}/></a>}>
                                    <div>
                                        <Row className='item-wrap'>
                                            <Col span={12} className='item-wrap-left border-ver'>
                                                <Row style={{paddingBottom:10}}>
                                                    <Col span={5} className='p-title'>联合</Col>
                                                    <Col span={19} className='p-desc' style={{textAlign:'right'}}>
                                                        <span style={{transform:'scale(0.9)'}}>维护(次):{nowIndex ? testCount(getOutputData(name,'fed_fix').slice(0,nowIndex),1) : testCount(getOutputData(name,'fed_fix'),1)}</span>
                                                        <Divider type="vertical" />
                                                        <span style={{transform:'scale(0.9)'}}>故障(次):{nowIndex ? testCount(getOutputData(name,'fed_fix').slice(0,nowIndex),3) : testCount(getOutputData(name,'fed_fix'),3)}</span>
                                                    </Col>
                                                </Row>
                                                <div className='small-charts'>
                                                    <div className='small-charts-right hasbg' style={{paddingRight:10}}>
                                                        <div id={'oneLearnChart'+index} style={{width:144,height:10}}></div>
                                                    </div>
                                                    <div className='small-charts-left' style={{color:'#8C96AA !important',transform:'scale(0.9)',width:'auto',textAlign:'right',marginRight:10}}>{nowIndex ? ((nowIndex-COMMRUNSTEP)+1)/2 : 4000}(d)</div>
                                                </div>
                                            </Col>
                                            <Col span={12} className='item-wrap-right' >
                                                <Row style={{paddingBottom:10}}>
                                                    <Col span={5} className='p-title'>本地</Col>
                                                    <Col span={19} className='p-desc' style={{textAlign:'right'}}>
                                                        <span style={{transform:'scale(0.9)'}}>维护(次):{nowIndex ? testCount(getOutputData(name,'local_fix').slice(0,nowIndex),1) : testCount(getOutputData(name,'local_fix'),1)}</span>
                                                        <Divider type="vertical" />
                                                        <span style={{transform:'scale(0.9)'}}>故障(次):{nowIndex ? testCount(getOutputData(name,'local_fix').slice(0,nowIndex),3) : testCount(getOutputData(name,'local_fix'),3)}</span>
                                                    </Col>
                                                </Row>
                                                <div className='small-charts'>
                                                    <div className='small-charts-right hasbg' style={{paddingRight:10}}>
                                                        <div id={'oneLocalChart'+index} style={{width:144,height:10}}></div>
                                                    </div>
                                                    <div className='small-charts-left' style={{color:'#8C96AA !important',transform:'scale(0.9)',width:'auto',marginRight:10}}>{nowIndex ? ((nowIndex-COMMRUNSTEP)+1)/2 : 4000}(d)</div>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row className='item-bottom'>
                                            <Col span={12}>
                                                <div className='small-charts'>
                                                <div className='small-charts-left'>蒸汽压力(Mpa)</div>
                                                    <div className='small-charts-right' style={{paddingRight:10}}>
                                                        <div id={'oneParamsChart'+index} style={{width:130,height:40}}></div>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col span={12}>
                                                <div className='small-charts'>
                                                <div className='small-charts-left' style={{paddingLeft:20,width:100}}>蒸汽温度(℃)</div>
                                                <div className='small-charts-right'>
                                                    <div id={'twoParamsChart'+index} style={{width:130,height:40}}></div>
                                                </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                </Card>
                            })
                        }
                    </div>
                    {/* :null} */}
                </Col>
                <Col span={15} className='demo-right'>
                    <div style={{lineHeight:'50px'}}>
                        <div style={{fontSize:'16px',color:'#1C1E25',fontWeight:'bold'}}>训练模式对比</div>
                        </div>
                    <div className='charts' style={{position:'relative'}}>
                        {/* <div style={{padding: '0px 20px 20px'}}>
                            <div onClick={()=>changeSlectTab('全部')} className={selectDevice == '全部' ? 'item-tab item-tab-select' :'item-tab'}>全部</div>
                            <div onClick={()=>changeSlectTab('余杭·燃气蒸汽锅炉')} className={selectDevice == '余杭·燃气蒸汽锅炉' ? 'item-tab item-tab-select' :'item-tab'}>余杭·燃气蒸汽锅炉</div>
                            <div onClick={()=>changeSlectTab('廊坊·燃气蒸汽锅炉')} className={selectDevice == '廊坊·燃气蒸汽锅炉' ? 'item-tab item-tab-select' :'item-tab'}>廊坊·燃气蒸汽锅炉</div>
                            <div onClick={()=>changeSlectTab('长沙·燃气蒸汽锅炉')} className={selectDevice == '长沙·燃气蒸汽锅炉' ? 'item-tab item-tab-select' :'item-tab'}>长沙·燃气蒸汽锅炉</div>
                            <div onClick={()=>changeSlectTab('广州·燃气蒸汽锅炉')} className={selectDevice == '广州·燃气蒸汽锅炉' ? 'item-tab item-tab-select' :'item-tab'}>广州·燃气蒸汽锅炉</div>
                        </div> */}
                        <div style={{fontSize:'12px',color:'#51596D'}}>(运营利润:万元)</div>
                        <div id='profitCharts' style={{height:380,width:860}}>
                            {/*  运营利润曲线 */}
                        </div>
                        <div style={{fontSize:'12px',color:'#51596D',position:'absolute',bottom:47,right:37}}>(时间:d)</div>
                        <div className='bottom-desc'>
                            <div className='desc-item'>
                                <span className='desc-item-icon'></span>
                                <span>联合预测性维护</span>
                            </div>
                            <div className='desc-item'>
                                <span className='desc-item-icon2'></span>
                                <span>本地预测性维护</span>
                            </div>
                            <div className='desc-item'>
                                <span className='desc-item-icon3'></span>
                                <span>定期维护</span>
                            </div>
                            <div className='desc-item'>
                                <span className='desc-item-icon4'></span>
                                <span>不维护</span>
                            </div>
                        </div>
                    </div>
                    <div className='compare'>
                        <div className={'content-table'}>
                            <ul className='table-td' style={{color:'#1C1E25'}}>
                                <li></li>
                                <li>联合预测性维护 <Tooltip title="联合预测性维护：基于联合学习的设备预测模型，进行预测性维护。"><Icon style={{color:'#91A5BE',margin:'0px 6px'}} type="question-circle" /></Tooltip></li>
                                <li>本地预测性维护 <Tooltip title="本地预测性维护：基于本地设备运行状态，进行预测性维护。"> <Icon style={{color:'#91A5BE',margin:'0px 6px'}} type="question-circle" /> </Tooltip> </li>
                                <li>定期维护 <Tooltip title="定期维护：根据预先定义的维修日程表，进行定期保养维护。"> <Icon style={{color:'#91A5BE',margin:'0px 6px'}} type="question-circle" /> </Tooltip> </li>
                                <li>不维护 <Tooltip title="不维护：不做预测性监测，设备坏了直接维修或者报废。"> <Icon style={{color:'#91A5BE',margin:'0px 6px'}} type="question-circle" /> </Tooltip> </li>
                            </ul>
                            <ul>
                                <li> 运营利润(万元) </li>
                                <li className='title1'>
                                    ¥{nowIndex ? Math.floor(getOutputData(selectDevice,'fed_profit')[nowIndex-COMMRUNSTEP])
                                    :Math.floor(getOutputData(selectDevice,'fed_profit').slice(-1))}
                                </li>
                                <li className='title1'>
                                    ¥{nowIndex ? Math.floor(getOutputData(selectDevice,'local_profit')[nowIndex-COMMRUNSTEP])
                                    :Math.floor(getOutputData(selectDevice,'local_profit').slice(-1))}
                                </li>
                                <li className='title1'>
                                    ¥{nowIndex ? Math.floor(getOutputData(selectDevice,'preventive_profit')[nowIndex-COMMRUNSTEP])
                                    :Math.floor(getOutputData(selectDevice,'preventive_profit').slice(-1))}
                                </li>
                                <li className='title1'>
                                    ¥{nowIndex ? Math.floor(getOutputData(selectDevice,'corrective_profit')[nowIndex-COMMRUNSTEP])
                                    :Math.floor(getOutputData(selectDevice,'corrective_profit').slice(-1))}
                                </li>
                            </ul>
                            <ul>
                                <li> 维护(次) </li>
                                <li className='title1'>
                                    {nowIndex ? 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),1)
                                    : 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','fed_fix'),1)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','fed_fix'),1)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','fed_fix'),1)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','fed_fix'),1)
                                    }
                                </li>
                                <li className='title1'>
                                    {nowIndex ? 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),1)
                                    : 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','local_fix'),1)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','local_fix'),1)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','local_fix'),1)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','local_fix'),1)
                                    }
                                </li>
                                <li className='title1'>
                                    {nowIndex ? 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),1)
                                    : 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix'),1)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','preventive_fix'),1)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','preventive_fix'),1)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','preventive_fix'),1)
                                    }
                                </li >
                                <li className='title1'>
                                    {nowIndex ? 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),1)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),1)
                                    : 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix'),1)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','corrective_fix'),1)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','corrective_fix'),1)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','corrective_fix'),1)
                                    }
                                </li>
                            </ul>
                            <ul>
                                <li> 故障(次) </li>
                                <li className='title1'>
                                    {nowIndex ? 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),3)
                                    : 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','fed_fix'),3)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','fed_fix'),3)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','fed_fix'),3)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','fed_fix'),3)
                                    }
                                </li>
                                <li className='title1'>
                                    {nowIndex ? 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),3)
                                    : 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','local_fix'),3)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','local_fix'),3)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','local_fix'),3)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','local_fix'),3)
                                    }
                                </li>
                                <li className='title1'>
                                    {nowIndex ? 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),3)
                                    : 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix'),3)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','preventive_fix'),3)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','preventive_fix'),3)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','preventive_fix'),3)
                                    }
                                </li >
                                <li className='title1'>
                                    {nowIndex ? 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),3)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),3)
                                    : 
                                        testCount(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix'),3)+
                                        testCount(getOutputData('廊坊·燃气蒸汽锅炉','corrective_fix'),3)+
                                        testCount(getOutputData('长沙·燃气蒸汽锅炉','corrective_fix'),3)+
                                        testCount(getOutputData('广州·燃气蒸汽锅炉','corrective_fix'),3)
                                    }
                                </li>
                            </ul>
                            <ul>
                                <li> 维护时长(天) </li>
                                <li className='title2'>
                                    {nowIndex ? 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),1)
                                    : 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix'),1)
                                    }
                                </li>
                                <li className='title2'>
                                    {nowIndex ? 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),1)
                                    : 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix'),1)
                                    }
                                </li>
                                <li className='title2'>
                                    {nowIndex ? 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),1)
                                    : 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix'),1)
                                    }
                                </li >
                                <li className='title2'>
                                    {nowIndex ? 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),1)
                                    : 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix'),1)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix'),1)
                                    }
                                </li>
                            </ul>
                            <ul>
                                <li> 故障时长(天) </li>
                                <li className='title2'>
                                    {nowIndex ? 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix').slice(0,nowIndex),3)
                                    : 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','fed_fix'),3)
                                    }
                                </li>
                                <li className='title2'>
                                    {nowIndex ? 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix').slice(0,nowIndex),3)
                                    : 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','local_fix'),3)
                                    }
                                </li>
                                <li className='title2'>
                                    {nowIndex ? 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix').slice(0,nowIndex),3)
                                    : 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','preventive_fix'),3)
                                    }
                                </li >
                                <li className='title2'>
                                    {nowIndex ? 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix').slice(0,nowIndex),3)
                                    : 
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix'),3)+
                                        countOccurences(getOutputData('余杭·燃气蒸汽锅炉','corrective_fix'),3)
                                    }
                                </li>
                            </ul>
                            <ul>
                                <li> 运行时长(天) </li>
                                <li className='title2'>
                                    {nowIndex ? ((nowIndex-COMMRUNSTEP) + 1) : 4000}
                                </li>
                                <li className='title2'>
                                    {nowIndex ? ((nowIndex-COMMRUNSTEP) + 1) : 4000}
                                </li>
                                <li className='title2'>
                                    {nowIndex ? ((nowIndex-COMMRUNSTEP) + 1) : 4000}
                                </li>
                                <li className='title2'>
                                    {nowIndex ? ((nowIndex-COMMRUNSTEP) + 1) : 4000}
                                </li>
                            </ul>
                        </div>
                    </div>
                </Col>
            </Row>
            <Modal
                centered
                title=""
                width={400}
                visible={runFlag}
                onOk={()=>setRunFlag(false)}
                onCancel={()=>setRunFlag(false)}
                footer={null}
                closable={false}
                maskClosable={true}
            >
                <div style={{textAlign:'center'}}>
                    <img style={{width:150,height:150}} src={pic} alt='pic'/>
                </div>
                <div style={{textAlign:'center',fontSize:'14px',color:'#1C1E25'}}>欢迎进入联合学习预测性维护场景实例展示</div>
                <div style={{textAlign:'center',margin:'30px 16px 16px'}}>
                    <Button style={{borderRadius:'18px',fontWeight:'bold'}} onClick={()=>startRunProfileCharts()} type='primary'>开始运行</Button>
                </div>
            </Modal>
            
            {/* <Modal
                title=""
                centered
                width={780}
                visible={detailFlag}
                onOk={()=>setDetailFlag(false)}
                onCancel={()=>setDetailFlag(false)}
                footer={null}
                closable={false}
                maskClosable={true}
            > */}
            <div className={'ant-modal-mask'} style={{display:'none'}} id='detailModal'>
                <div className={detailFlag ? "ant-modal-wrap ant-modal-centered" : 'ant-modal-wrap ant-modal-centered ant-modal-mask-hidden'} role="dialog">
                    <div role="document" className="ant-modal" style={{width: "780px",transformOrigin: "149px 136px"}}>
                        <div className="ant-modal-content">
                            <div className="ant-modal-body">
                                <div className='demo-left' style={{padding:'0px 16px'}}>
                                    <div className='left-desc'>
                                        <div className='desc-item'>
                                            <span className='desc-item-icon3'></span><span>运行时长</span>
                                        </div>
                                        <div className='desc-item'>
                                            <span className='desc-item-icon'></span><span>设备维护</span>
                                        </div>
                                        <div className='desc-item'>
                                            <span className='desc-item-icon2'></span><span>故障维修</span>
                                        </div>
                                        <div className='desc-item'>
                                            (色块长度代表维护/维修所需时长)
                                        </div>
                                    </div>
                                    
                                    <div style={{border:'1px solid #CED8E6',borderRadius:'4px',marginTop:20}}>
                                        <div style={{color:'#1C1E25',fontWeight:'bold',padding:'13px 20px',borderBottom:'1px solid rgba(206,216,230,0.2)'}}>{detailName}</div>
                                        <Row className='item-wrap' type="flex" justify="space-between" style={{margin:30}}>
                                            <Col style={{paddingRight:40}} span={12} className='item-wrap-left border-ver'>
                                                <Row style={{paddingBottom:15}}>
                                                    <Col span={9} className='p-title'>联合预测性维护</Col>
                                                    <Col span={15} className='p-desc' style={{textAlign:'right',fontSize:'12px'}}>
                                                        <span style={{transform:'scale(0.9)'}}>维护(次):{nowIndex ? testCount(getOutputData(detailName,'fed_fix').slice(0,nowIndex),1) : testCount(getOutputData(detailName,'fed_fix'),1)}</span>
                                                        <Divider type="vertical" />
                                                        <span style={{transform:'scale(0.9)'}}>故障(次):{nowIndex ? testCount(getOutputData(detailName,'fed_fix').slice(0,nowIndex),3) : testCount(getOutputData(detailName,'fed_fix'),3)}</span>
                                                    </Col>
                                                </Row>
                                                <div className='small-charts'>
                                                    <div className='small-charts-right hasbg' style={{paddingRight:10}}>
                                                        <div id='oneModalChart0' style={{width:200,height:10}}></div>
                                                    </div>
                                                    <div className='small-charts-left' style={{color:'#8C96AA !important',transform:'scale(0.9)',width:'auto',textAlign:'right'}}>{nowIndex ? ((nowIndex-COMMRUNSTEP)+1)/2 : 4000}(d)</div>
                                                </div>
                                            </Col>
                                            <Col style={{paddingLeft:40}} span={12} className='item-wrap-right' >
                                                <Row style={{paddingBottom:15}}>
                                                    <Col span={9} className='p-title'>本地预测性维护</Col>
                                                    <Col span={15} className='p-desc' style={{textAlign:'right',fontSize:'12px'}}>
                                                        <span style={{transform:'scale(0.9)'}}>维护(次):{nowIndex ? testCount(getOutputData(detailName,'local_fix').slice(0,nowIndex),1) : testCount(getOutputData(detailName,'local_fix'),1)}</span>
                                                        <Divider type="vertical" />
                                                        <span style={{transform:'scale(0.9)'}}>故障(次):{nowIndex ? testCount(getOutputData(detailName,'local_fix').slice(0,nowIndex),3) : testCount(getOutputData(detailName,'local_fix'),3)}</span>
                                                    </Col>
                                                </Row>
                                                <div className='small-charts'>
                                                    <div className='small-charts-right hasbg' style={{paddingRight:10}}>
                                                        <div id='oneModalChart1' style={{width:200,height:10}}></div>
                                                    </div>
                                                    <div className='small-charts-left' style={{color:'#8C96AA !important',transform:'scale(0.9)',width:'auto'}}>{nowIndex ? ((nowIndex-COMMRUNSTEP)+1)/2 : 4000}(d)</div>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row className='item-wrap' type="flex" justify="space-between" style={{margin:30}}>
                                            <Col style={{paddingRight:40}} span={12} className='item-wrap-left border-ver'>
                                                <Row style={{paddingBottom:15}}>
                                                    <Col span={9} className='p-title'>定期维护</Col>
                                                    <Col span={15} className='p-desc' style={{textAlign:'right',fontSize:'12px'}}>
                                                        <span style={{transform:'scale(0.9)'}}>维护(次):{nowIndex ? testCount(getOutputData(detailName,'preventive_fix').slice(0,nowIndex),1) : testCount(getOutputData(detailName,'preventive_fix'),1)}</span>
                                                        <Divider type="vertical" />
                                                        <span style={{transform:'scale(0.9)'}}>故障(次):{nowIndex ? testCount(getOutputData(detailName,'preventive_fix').slice(0,nowIndex),3) : testCount(getOutputData(detailName,'preventive_fix'),3)}</span>
                                                    </Col>
                                                </Row>
                                                <div className='small-charts'>
                                                    <div className='small-charts-right hasbg' style={{paddingRight:10}}>
                                                        <div id='oneModalChart2' style={{width:200,height:10}}></div>
                                                    </div>
                                                    <div className='small-charts-left' style={{color:'#8C96AA !important',transform:'scale(0.9)',width:'auto',textAlign:'right'}}>{nowIndex ? ((nowIndex-COMMRUNSTEP)+1)/2 : 4000}(d)</div>
                                                </div>
                                            </Col>
                                            <Col style={{paddingLeft:40}} span={12} className='item-wrap-right' >
                                                <Row style={{paddingBottom:15}}>
                                                    <Col span={9} className='p-title'>不维护</Col>
                                                    <Col span={15} className='p-desc' style={{textAlign:'right',fontSize:'12px'}}>
                                                        <span style={{transform:'scale(0.9)'}}>维护(次):{nowIndex ?testCount(getOutputData(detailName,'corrective_fix').slice(0,nowIndex),1) : testCount(getOutputData(detailName,'preventive_fix'),1)}</span>
                                                        <Divider type="vertical" />
                                                        <span style={{transform:'scale(0.9)'}}>故障(次):{nowIndex ?testCount(getOutputData(detailName,'corrective_fix').slice(0,nowIndex),3) : testCount(getOutputData(detailName,'preventive_fix'),3)}</span>
                                                    </Col>
                                                </Row>
                                                <div className='small-charts'>
                                                    <div className='small-charts-right hasbg' style={{paddingRight:10}}>
                                                        <div id='oneModalChart3' style={{width:200,height:10}}></div>
                                                    </div>
                                                    <div className='small-charts-left' style={{color:'#8C96AA !important',transform:'scale(0.9)',width:'auto'}}>{nowIndex ? ((nowIndex-COMMRUNSTEP)+1)/2 : 4000}(d)</div>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row className='item-bottom'>
                                            {
                                                paraArr.map((paramKey,index)=>{
                                                    return <Col key={paramKey} span={8} style={{margin:'10px 0px'}}>
                                                        <div className='small-charts'>
                                                            <div className='small-charts-left' style={{transform:'scale(0.9)',width:120}}>{GBName[paramKey]}</div>
                                                            <div className='small-charts-right' style={{paddingRight:10}}>
                                                            <div id={'oneModalParamsChart'+index} style={{width:100,height:42}}></div>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                })
                                            }
                                        </Row>
                                    </div>
                                </div>
                                <div style={{textAlign:'center',margin:'30px 16px 16px'}}>
                                    <Button style={{borderRadius:'18px',fontWeight:'bold'}} onClick={()=>{setDetailFlag(false);document.getElementById('detailModal').setAttribute('style','display:none !important')}} className='reset-btn'>关闭</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* </Modal> */}
        </div>
    </div>
  )
}


const countOccurences = (arr, value) => {
    // console.log(arr);
    return arr.reduce((a, v) => v*1 === value ? a + 1 : a + 0, 0)
};

const selectBarOption = (deviceData,modal,end) => { 
    let modalData = deviceData[modal] || [];
    let dataValue = [];
    let oneData = [];
    let twoData = [];
    let time = deviceData['time'] || [];
    if(upIndex > 0){
        dataValue = modalData.slice(upstart,upend);
        time = time.slice(upstart,upend);
        oneData = dataValue.slice(upstart,upend).join(',').replace(/3/g,'0').split(',');
        twoData = dataValue.slice(upstart,upend).join(',').replace(/1/g,'0').replace(/3/g,'1').split(',');
    }else{
        dataValue = modalData.slice(-end);
        time = time.slice(-end);
        oneData = dataValue.slice(-end).join(',').replace(/3/g,'0').split(',');
        twoData = dataValue.slice(-end).join(',').replace(/1/g,'0').replace(/3/g,'1').split(',');
    }
    return {
        xAxis: {
            type: 'category',
            data: time,
            show:false
        },
        yAxis: {
            type: 'value',
            // min:0,max:3,
            show:false
        },
        color:['#FFCD00','#FD5756'],
        series: [{
            data: oneData,
            type: 'bar',
            barMinHeight:10,
            color:'#FFCD00',
            large: true,
            barCategoryGap:'0%',
            barGap:'-100%'
        },{
            data: twoData,
            type: 'bar',
            barMinHeight:10,
            color:'#FD5756',
            large: true,
            barCategoryGap:'0%',
            barGap:'-100%'
        }]
    }
}

const selectParamsCharts = (data,params,colorType) => {
    const dataValue = data[params] || [];
    const max = Math.max.apply(null, dataValue);
    const min = Math.min.apply(null, dataValue);
    return {
        xAxis: {
          type: 'category',
          show: false,
          data: Array.from(new Array(420).keys()),
        },
        color:colorType === 1 ? ['#80D57A','#4D84FF'] : ['#4D84FF','#80D57A'],
        grid:{
          show: true,
          borderWidth: 0,
          top:10,
          left:0,
          right:5,
          bottom:5
        },
        yAxis: {
            type: 'value',
            show: false,
            scale: false,
            max: max || 0,
            min: min || 0
        },
        series: [{
            data: dataValue,
            type: 'line',
            symbol:'none',
            smooth:false,
            lineStyle:{
              width:1
            },
            areaStyle:{
              opacity: 0.08
            },
        }]
    };
};
const allChartOption = (data) => {
    let profileMax = Math.max.apply(null,data['fed_profit']);
    return {
        title: {
            show:false
        },
        color:["#FEB927","#B45FD7","#219FFF","#01C5D1"],
        tooltip: {
            trigger: 'axis',
            backgroundColor:'rgba(68,76,95,0.95)',
            axisPointer: {
                animation: false
            },
            formatter:function(params)  { 
                var relVal = "第"+Math.ceil(params[0].name)+"天";  
                for (var i = 0, l = params.length; i < l; i++) {  
                    relVal += '<div><div style="margin-right:10px;display:inline-block;margin-left:5px;border-radius:6px;width:6px;height:6px;background-color:'+params[i].color+';"></div>' + params[i].seriesName+' : ¥' + Math.floor(params[i].value) + "万元"+'</div>';
                }  
                return relVal;  
            }
        },
        grid: {
            left: 0,
            right: 60,
            bottom: 15,
            top: 40,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            splitLine: {
                show: false
            },
            formatter: function (value, index) {
                return index;
            },
            splitNumber:6,
            // interval:800,
            data:data['time'],
            boundaryGap: true,
            axisLine: {
                show:false
            },
            axisTick:{
                show: false
            },
            axisLabel:{
                interval:800,
                color: '#51596D',
                fontFamily:'Microsoft YaHei',
                // formatter: function (value, index) {
                //     return Math.ceil(value/2);
                // }
            }
        },
        yAxis: {
            type: 'value',
            boundaryGap: [0, '100%'],
            // name:'运营利润(元)',
            max:profileMax,
            splitNumber: 4,
            min:0,
            axisLine: {
                show:false
            },
            axisTick:{
                show: false
            },
            axisLabel:{
                color: '#51596D',
                fontFamily:'Microsoft YaHei',
                formatter: function (value, index) {
                    return Math.round(value);
                }
            },
            splitLine:{
                lineStyle:{
                    color: '#F1F2F4'
                }
            },
        },
        series: [{
            name: '不维护',
            type: 'line',
            showSymbol: false,
            hoverAnimation: false,
            animationEasing:'quarticInOut',
            lineStyle:{
                width:2,
                color: '#FEB927'
            },
            markPoint : {
                data : [
                    {
                        value : '¥'+Math.floor(data['corrective_profit'].slice(-1)),
                        name: '最后的值',
                        yAxis: data['corrective_profit'].slice(-1),
                        xAxis: data['time'].slice(-1),
                        // x: '93%',
                        // coord:[data['time'].slice(-1),data['corrective_profit'].slice(-1)],
                        symbolSize:1,
                        label:{
                          normal:{
                            borderColor:'#FEB927',
                            backgroundColor:'#FEB927',
                            padding:[6,4],
                            borderRadius:10,
                            color: '#fff',
                            fontWeight:'bolder',
                            fontSize:12
                          }
                        }
                    }
                ]
            },
            data: data['corrective_profit']
        },{
            name: '定期维护',
            type: 'line',
            showSymbol: false,
            hoverAnimation: false,
            animationEasing:'quarticInOut',
            lineStyle:{
                width:2,
                color: '#B45FD7'
            },
            markPoint : {
                data : [
                    {
                        value : '¥'+Math.floor(data['preventive_profit'].slice(-1)),
                        name: '最后的值',
                        yAxis: data['preventive_profit'].slice(-1),
                        xAxis: data['time'].slice(-1),
                        // x: '93%',
                        // coord:[data['time'].slice(-1),data['preventive_profit'].slice(-1)],
                        symbolSize:1,
                        label:{
                          normal:{
                            borderColor:'#B45FD7',
                            backgroundColor:'#B45FD7',
                            padding:[6,4],
                            borderRadius:10,
                            color: '#fff',
                            fontWeight:'bolder',
                            fontSize:12
                          }
                        }
                    }
                ]
            },
            data: data['preventive_profit']
        },{
            name: '本地预测性维护',
            type: 'line',
            showSymbol: false,
            hoverAnimation: false,
            animationEasing:'quarticInOut',
            lineStyle:{
                width:2,
                color: '#4696FF'
            },
            markPoint : {
                data : [
                    {
                        value : '¥'+Math.floor(data['local_profit'].slice(-1)),
                        name: '最后的值',
                        yAxis: data['local_profit'].slice(-1),
                        xAxis: data['time'].slice(-1),
                        // x: '93%',
                        // coord:[data['time'].slice(-1),data['local_profit'].slice(-1)],
                        symbolSize:1,
                        label:{
                          normal:{
                            borderColor:'#4696FF',
                            backgroundColor:'#4696FF',
                            padding:[6,4],
                            borderRadius:10,
                            color: '#fff',
                            fontWeight:'bolder',
                            fontSize:12
                          }
                        }
                    }
                ]
            },
            data: data['local_profit']
        },{
            name: '联合预测性维护',
            type: 'line',
            showSymbol: false,
            hoverAnimation: false,
            animationEasing:'quarticInOut',
            lineStyle:{
                width:4,
                color: '#01C5D1'
            },
            markPoint : {
                data : [
                    {
                        value : '¥'+Math.floor(data['fed_profit'].slice(-1)),
                        name: '最后的值',
                        yAxis: data['fed_profit'].slice(-1),
                        xAxis: data['time'].slice(-1),
                        // x: '93%',
                        // coord:[data['time'].slice(-1),data['fed_profit'].slice(-1)],
                        symbolSize:1,
                        label:{
                          normal:{
                            borderColor:'#01C5D1',
                            backgroundColor:'#01C5D1',
                            padding:[6,4],
                            borderRadius:10,
                            color: '#fff',
                            fontWeight:'bolder',
                            fontSize:12
                          }
                        }
                    }
                ]
            },
            data: data['fed_profit']
        }]
    };
};
const getRunParamsOption = (params,end,deviceData) => {
    const dataValue = deviceData[params] || [];
    return {
        yAxis:{
            max: Math.max.apply(null,dataValue.slice(0,end)),
            min: Math.min.apply(null,dataValue.slice(0,end))
        },
        series:[{
            data: dataValue.slice(0,end),
            animationEasing:'quarticInOut'
        }]
    };
};
const getRunBarOption = (params,start,end,deviceData) => {
    const dataValue = deviceData[params] || [];
    const oneData = dataValue.slice(start,end).join(',').replace(/3/g,'0').split(',');
    const twoData = dataValue.slice(start,end).join(',').replace(/1/g,'0').replace(/3/g,'1').split(',');
    return {
        xAxis:{
            data:deviceData['time'].slice(start,end)
        },
        series:[{
            data: oneData
        },{
            data: twoData
        }]
    };
};
function testCount(str,likev) {
    let count = 0; //计数
    for(let index = 0; index < str.length; index++) {
        //console.log(str[index-1]);
       if(str[index-1] != str[index] && str[index] == likev){
           count++;
       }
    }
    // console.log(count);
    return count;
}