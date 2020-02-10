import Config from './config';
// const baseUrl = process.env.NODE_ENV === 'development' ? 'http://10.102.1.243:8892' : 'http://13.231.234.243:8892';
const baseUrl = process.env.NODE_ENV === "development" ? 'http:////simulationmanage-enn-ai-test.topaas.enncloud.cn' : window.location.protocol + '//simulationmanage-enn-ai-test.topaas.enncloud.cn'

function parseJSON(response) {
  return response.json();
}

function checkStatus(response) {
  // console.log(response);
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(url, options) {
  // console.log(options,url.indexOf("login"));
  options["headers"] = {};
  options["headers"]["Content-Type"] = "application/json";
  if(url.indexOf("login") <= 0){
    const accountInfo = JSON.parse(sessionStorage.getItem(Config.PREXFIX_LOGIN));
    // console.log("登录信息",accountInfo);
    if(accountInfo){
      options["headers"]['userId'] = accountInfo.id;
      options["headers"]['token'] = accountInfo.token;
    }
  }
  if(options.body){
    options.body = JSON.stringify(options.body);
  }
  if(options.method === 'get'){
    if (options.body) {
      let paramsArray = [];
      const data = options.body;
      //拼接参数
      Object.keys(data).forEach(key => paramsArray.push(key + '=' + data[key]))
      if (url.search(/\?/) === -1) {
          url += '?' + paramsArray.join('&')
      } else {
          url += '&' + paramsArray.join('&')
      }
    }
  }
  if(navigator.onLine){
     // console.log(options);
    return fetch(baseUrl+url, options)
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      // console.log('request',data);
      if(data && Number(data.code) === 5001){//若接口返回5001，则登录时效，进入登录窗口
        // console.log("登录失效");
        // console.log(data.msg);
        // message.error(data.msg);
        // routerRedux.push("/login");
        sessionStorage.removeItem(Config.PREXFIX_LOGIN);
        window.location.href = "/#/login";
        return {msg:'登录失效，请重新登录'};
      }else{
        if(data && (Number(data.code) === 200)){
          return data;
        }else{
          // throw new Error(data.msg || "系统错误");
          window.location.href = "/#/error?code=500&reurl=/simulation/sence/list";
          throw new Error(data.msg || "系统错误");
        }
      }
    })
    .catch((err)=>{
      console.log(err);
      window.location.href = "/#/error?code=500&reurl=/simulation/sence/list";
    });
  }else{
     window.location.href = "/#/error?code=1&reurl=/simulation/sence/list";
  }
}
