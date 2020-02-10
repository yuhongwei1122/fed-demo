import React from 'react';
import './loading.scss';
import Empty from './images/pic-empty-networkfault.png';
function refresh(){
    //创建一个HTTP请求对象
    let request = new XMLHttpRequest();
    //使用open（）打开一个新请求
    request.open('GET', window.location.href);
    //设置XHR访问JSON格式数据，然后发送请求
    // request.responseType = 'json';
    //设置XHR访问text格式数据
    request.setRequestHeader("Pragma","no-cache"); // 可以定义请求头带给后端
    request.setRequestHeader("Expires",-1);
    request.setRequestHeader("Cache-Control","no-cache");
    request.responseType = 'text';
    request.send();
 
    //处理来自服务器的数据
    request.onload = function() {
        window.location.reload(true);
    };
};
const MyLoadingComponent = ({ isLoading, error }) => {
    // Handle the loading state
    if (isLoading) {
        return (
            <div className='loading'>
                <div className='loader'>
                </div>
            </div>
        );
    }
    // Handle the error state
    else if (error) {
        return <div style={{marginTop:40,textAlign:'center'}}>
            <div>
                <div className='error-wrap'>
                    <div style={{textAlign:'center',height:'70%'}}>
                        <img src={Empty} alt='error' style={{height:'100%'}}/>
                    </div>
                    <div className='desc-lable' style={{marginBottom:20}}>
                       页面有新发布版本，请Ctrl+R刷新页面清除缓存
                    </div>
                    <span className='link-a' onClick={()=>refresh} type="primary">
                        重新加载
                    </span>
                </div>
            </div>
        </div>
    }
    else {
        return null;
    }
};
export default MyLoadingComponent;