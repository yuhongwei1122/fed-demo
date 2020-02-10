import 'core-js/es/map';
import 'core-js/es/set';

import 'raf/polyfill';
import 'core-js/es/string';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {
  HashRouter as Router,
  Route,
  Switch
} from "react-router-dom";
import Loadable from 'react-loadable';
import MyLoadingComponent from './loading';
import { ConfigProvider } from 'antd';
import * as serviceWorker from './serviceWorker';
import zhCN from 'antd/es/locale/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

ReactDOM.render(<ConfigProvider locale={zhCN}>
    <Router>
      <Switch>
        {/* <Route path="/404" component={Loadable({
          loader: () => import('./pages/404'),
          loading: MyLoadingComponent
        })} /> */}
        <Route path="/demo" component={Loadable({
          loader: () => import('./pages/newdemo'),
          loading: MyLoadingComponent
        })} />
        <Route path="/" component={Loadable({
          loader: () => import('./pages/readcsv'),
          loading: MyLoadingComponent
        })} />
        
      </Switch>
    </Router>
  </ConfigProvider>
  , document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
