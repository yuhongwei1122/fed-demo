import React from 'react';
import { Result, Button } from 'antd';
function Exception404(props) {
    return (
        <Result
            status="404"
            title="404"
            subTitle="您访问的页面不存在"
            extra={
            <Button onClick={()=>{props.history.push('/login')}} type="primary">
                返回首页
            </Button>
            }
        ></Result>
    );
}
export default Exception404;
        