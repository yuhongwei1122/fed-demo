import React from 'react';
import { Route, Redirect} from 'react-router-dom';
import Config from '../config/config';

function PrivateRoute({component: Component, path: path, role:role, ...rest}) {
    const checkLogin = () => {
        let info = {};
        if(sessionStorage.getItem(Config.PREXFIX_LOGIN)){
            info = JSON.parse(sessionStorage.getItem(Config.PREXFIX_LOGIN));
        }
        return true;
        // if(Object.keys(info).length > 0){
        //     return true;
        // }else{
        //     return false;
        // }
    };
    const checkPermission = (role) => {
        // console.log("角色",role);
        //1：管理员  2：商户代理   3：商户
        let info = {};
        if(sessionStorage.getItem(Config.PREXFIX_LOGIN)){
            info = JSON.parse(sessionStorage.getItem(Config.PREXFIX_LOGIN));
        }
        return true;
        // if(role.indexOf(Number(info.userType)) > -1){
        //     return true;
        // }else{
        //     return false;
        // }
    };
    return (
        <Route path={path} {...rest} render={props => {
            // console.log("进入这里",role);
            if (checkLogin()) {
                if(!role){
                    return (
                        <Component {...props}/>
                    );
                }else{
                    if(checkPermission(role)){
                        // console.log('输出');
                        return (
                            <Component {...props}/>
                        );
                    }else{
                        sessionStorage.removeItem(Config.PREXFIX_LOGIN);
                        return <Redirect to={{
                            pathname: '/login',
                            state: { from: props.location }
                        }}/>
                    }
                }
            }else{
                sessionStorage.removeItem(Config.PREXFIX_LOGIN);
                return (
                    <Redirect to={{
                        pathname: '/login',
                        state: { from: props.location }
                    }}/>
                )
            }
        }}/>
    )
}

export default  PrivateRoute;
