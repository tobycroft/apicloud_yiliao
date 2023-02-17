
/*
 * 公共方法,建议涉及到一些公用方法可以再里面扩展
 */
(function(window) {
    var public = {
      apiHost: 'http://chat.tuuz.cc:20010/v1/', // 服务器地址域名
      imgHost: 'http://chat.tuuz.cc:20010/', // 图片地址域名
      apiChat: 'http://chat.tuuz.cc:20010/v1/',
        apiWS: 'ws://chat.tuuz.cc:20011',
        fileUrl: 'http://upload.tuuz.cc:81/upfull?token=yiliao',
        // apiHost: 'http://192.168.1.10/v1/', // 服务器地址域名
        // imgHost: 'http://192.168.1.10/', // 图片地址域名
        // apiChat: 'http://192.168.1.10/v1/',
        // apiWS: 'ws://192.168.1.10:81',
        /**
         * socket参数封装
         **/
        socketParams: function(router, data, request) {
            var _data = {
                router: router,
                identifier: 'test',
                user_id: $api.getStorage('uid') || '',
                token: $api.getStorage('token') || '',
                request: request,
                platform: 'app',
                data: data
            }
            console.log('请求参数:' + JSON.stringify(_data));
            return _data;
        },
        /**
         * socket发送接受
         **/
        socketPost: function(router, params, callback, isShowProgress) {
            // var isHideProgress = false;
            // if (isShowProgress) {
            //     Pub.showProgress();
            //     setTimeout(function(){
            //         api.hideProgress();
            //     },10000);
            // }
            var randomString = Pub.randomStr();
            var wsParams = Pub.socketParams(router, params, randomString);
            Pub.eventSend('ws_send', {
                data: wsParams
            });
            $('.my-btn').addClass('disabled');
            Pub.eventListen('ws_response' + randomString, function(ret) {
                // if (isShowProgress) {
                //     api.hideProgress();
                //     isHideProgress = true;
                // }
                if (ret.value.data.request == randomString) {
                    $('.my-btn').removeClass('disabled');
                    var res = ret.value.data.data;
                    if (callback && typeof callback == 'function') {
                        callback(res);
                    }
                    if (res.code !== 200 && res.code !== 1000) {
                        Pub.msg(res.echo);
                    }
                    if (res.code == 1000) {
                        var wins = JSON.stringify(api.windows());
                        if (wins.indexOf('login') == -1 && wins.indexOf('register') == -1 && wins.indexOf('forget') == -1) {
                            $api.rmStorage('uid');
                            $api.rmStorage('token');
                            Pub.openView('widget://html/login/login_win', {
                                slidBackEnabled: false
                            });
                        }
                    }
                    Pub.eventRemove('ws_response' + randomString);
                }
            })
        },
        openDb: function(callback) {
            var db = api.require('db');
            db.openDatabase({
                name: 'nimo',
                path: 'fs://nimo/nimo.db'
            }, function(ret, err) {
                console.log(JSON.stringify(ret));
                if (ret.status) {
                    if (callback && typeof callback == 'fucntion') {
                        callback(true);
                    }
                } else {
                    alert(JSON.stringify(err));
                }
            });
        },
        dbExecuteSql: function(sqlite_sql, callback) {
            var sqlite_db = api.require('db');
            sqlite_db.transaction({
                name: 'nimo',
                operation: 'begin'
            }, function(ret, err) {
                if (ret.status) {
                    console.log('事务begin:' + JSON.stringify(ret));
                } else {
                    console.log('事务begin:' + JSON.stringify(err));
                }
            });
            sqlite_db.executeSql({
                name: 'nimo',
                sql: sqlite_sql
            }, function(ret, err) {
                console.log('执行正确' + JSON.stringify(ret));
                console.log('执行错误' + JSON.stringify(err));
                if (ret.status) {
                    if (callback && typeof callback == 'function') {
                        callback(true);
                    }
                } else {
                    //   Pub.msg('对不起，获取会话信息失败，为您恢复数据，请稍后');
                    Pub.openDb(function(is_true) {
                        if (is_true) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    });
                }
            });
            sqlite_db.transaction({
                name: 'nimo',
                operation: 'commit'
            }, function(ret, err) {
                if (ret.status) {
                    console.log('事务commit:' + JSON.stringify(ret));
                } else {
                    console.log('事务commit:' + JSON.stringify(err));
                }
            });
        },
        dbSelectSql: function(sqlite_sql, callback) {
            sqlite_db = api.require('db');
            sqlite_db.selectSql({
                name: 'nimo',
                sql: sqlite_sql
            }, function(ret, err) {
                console.log('数据库查询成功' + JSON.stringify(ret));
                console.log('数据库查询失败' + JSON.stringify(err));
                if (ret.status) {
                    callback(ret.data);
                } else {
                    //   Pub.msg('数据查询失败' + err.msg);
                    //   Pub.openDb(function(is_true) {
                    //       if (is_true) {
                    //           callback(true);
                    //       } else {
                    //           callback(false);
                    //       }
                    //   });
                }
            });
        },
        /**
         * post请求
         * @param {string} url api请求接口地址
         * @param {object} data 参数
         * @param {function} callback 回调方法
         * @param {Boolean} isHideProgress 是否隐藏加载进度框
         **/
        post: function(url, data, callback, isHideProgress) {
            var _this = this;
            var _file = {}
            var _params = {};
            if (data.uploadType == 'image') {
                _file = {
                    image: data.files
                }
            } else if (data.uploadType == 'file') {
                _file = {
                    file: data.files
                }
            } else {
                _file = [];
                _params = data;
            }
            var uid = $api.getStorage('uid');
            var token = $api.getStorage('token');
            var lang = $api.getStorage('lang');
            if (uid) {
                _params.uid = uid
            }
            if (token) {
                _params.token = token
            }
            if (lang) {
                _params.lang = lang;
            }
            var wins = JSON.stringify(api.windows());
            if (!uid && !token && wins.indexOf('login') == -1 && wins.indexOf('register') == -1 && wins.indexOf('forget') == -1) {
                $api.rmStorage('uid');
                $api.rmStorage('token');
                _this.openView('widget://html/login/login_win', {
                    slidBackEnabled: false
                });
            }
            // if (!isHideProgress) {
            //     this.showProgress();
            // }
            var random = Math.random();
            // api.openFrame({
            //     name: 'pop_zz_frm'+random,
            //     url: 'widget://script/pop_zz_frm.html',
            //     rect: {
            //         x: 0,
            //         y: 0,
            //         w: 'auto',
            //         h: 'auto'
            //     },
            //     bounces: false,
            //     progress: {type: ''},
            //     bgColor: 'rgba(0,0,0,0)',
            //     vScrollBarEnabled: true,
            //     hScrollBarEnabled: true
            // });
            $('.my-btn').addClass('disabled');
            console.log(_this.apiHost);
            var _url = (url.indexOf('http') == -1) ? (_this.apiHost + url) : url;
            api.ajax({
                url: _url,
                method: 'post',
                timeout: 60,
                data: {
                    values: _params,
                    files: _file
                }
            }, function(ret, err) {
                console.log('请求地址' + _url);
                console.log('参数:' + JSON.stringify(_params));
                console.log('文件:' + JSON.stringify(_file));
                //api.hideProgress();
                // api.closeFrame({
                //     name: 'pop_zz_frm'+random
                // });

                $('.my-btn').removeClass('disabled');
                if (ret) {
                    console.log(JSON.stringify(ret));
                    if (ret) {
                        if (callback && typeof callback == 'function') {
                            callback(ret);
                        }
                        _this.catchError(ret);
                    }
                } else {
                    console.log(JSON.stringify(err));
                    if (err.code == 0 || err.code == 1) {
                        // _this.msg('网络开了小差，请稍后重试');
                    } else {
                        _this.msg(err.echo);
                        // _this.alert('提示', JSON.stringify(err));
                    }
                }
            });
        },
        get: function(url, fnSuc, dataType) {
            var argsToJson = this.parseArguments.apply(null, arguments);
            var json = {};
            var fnSuc = argsToJson.fnSuc;
            argsToJson.url && (json.url = this.apiHost + argsToJson.url);
            //argsToJson.data && (json.data = argsToJson.data);
            if (argsToJson.dataType) {
                var type = argsToJson.dataType.toLowerCase();
                if (type == 'text' || type == 'json') {
                    json.dataType = type;
                }
            } else {
                json.dataType = 'text';
            }
            json.method = 'get';
            api.ajax(json,
                function(ret, err) {
                    if (ret) {
                        fnSuc && fnSuc(ret);
                    }
                }
            );
        },
        parseArguments: function(url, data, fnSuc, dataType) {
            if (typeof(data) == 'function') {
                dataType = fnSuc;
                fnSuc = data;
                data = undefined;
            }
            if (typeof(fnSuc) != 'function') {
                dataType = fnSuc;
                fnSuc = undefined;
            }
            return {
                url: url,
                data: data,
                fnSuc: fnSuc,
                dataType: dataType
            };
        },
        /**
         * ajax请求数据的错误码处理
         **/
        catchError: function(res) {
            if (res.code != 0 && res.code > 0) {
                this.msg(res.msg || res.echo);
            }
            if (res.code == -1 && api.winName.indexOf('login') == -1) {
                var wins = JSON.stringify(api.windows());
                if (wins.indexOf('login') == -1 && wins.indexOf('register') == -1 && wins.indexOf('forget') == -1) {
                    $api.rmStorage('uid');
                    $api.rmStorage('token');
                    this.openView('widget://html/login/login_win', {
                        slidBackEnabled: false
                    });
                }
            }
        },
        /**
         * 获取代币的余额
         *
         **/
        getTokenBalance: function(address, contract, callback) {
            api.ajax({
                url: 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=' + contract + '&address=' + address + '&tag=latest&apikey=YourApiKeyToken',
                method: 'post'
            }, function(ret, err) {
                if (ret) {
                    console.log(JSON.stringify(ret));
                    if (ret.status == 1 && ret.message == 'OK') {
                        if (callback && typeof callback == 'function') {
                            callback(ret.result);
                        }
                    }
                } else {
                    Pub.msg(err.msg);
                    console.log(JSON.stringify(err));
                }
            });

        },
        /**
         * base64上传图片接口
         * @param {string} base64 base64图片字符串
         **/
        uploadImgBase64: function(image, callback) {
            var params = {
                file: image
            }
            this.post('http://upload.tuuz.cc:81/upfull?token=yiliao', params, function(res) {
                console.log('录音' + JSON.stringify(res));
                if (res.code == 0) {
                    if (callback && typeof callback == 'function') {
                        callback(res);
                    }
                }
            });
        },
        /**
         * 图片文件上传接口
         * @param {string} type  文件类型 传值'image'
         * @param {arr} files  文件
         * @param {callback} type  回调方法
         **/
        uploadImg: function(files, callback, type) {
            var params = {
                uploadType: type || 'file',
                files: files
            }
            Pub.post('http://upload.tuuz.cc:81/upfull?token=yiliao', params, function(res) {
                if (res.code == 0) {
                    if (callback && typeof callback == 'function') {
                        callback(res.data);
                    }
                }else{
                  Pub.msg(res.data);
                }
            });
        },
        /**
         * 加载进度条
         **/
        showProgress: function(title) {
            return api.showProgress({
                style: 'default',
                animationType: 'fade',
                title: title || '',
                text: '',
                modal: true
            });
        },
        /**
         * 下拉刷新，设置app基本色调，callback回调函数处理后续逻辑
         **/
        pullDown: function(callback, type, bgColor, color) {
            var textDown = Pub.getLang('drop_down_refresh') + '...',
                textUp = Pub.getLang('release_and_refresh') + '...',
                isTime = true;
            if (type && type == 'up') {
                textDown = Pub.getLang('drop_down_loading') + '...';
                textUp = Pub.getLang('release_and_loading') + '...';
                isTime = false;
            }
            api.setRefreshHeaderInfo({
                visible: true,
                loadingImg: 'widget://icon/logo.png',
                bgColor: bgColor || 'rgba(255,255,255,0)',
                textColor: color || '#8a8a8a',
                textDown: textDown,
                textLoading: Pub.getLang('loading') + '...',
                textUp: textUp,
                showTime: isTime
            }, function(ret, err) {
                if (callback && typeof callback === 'function') {
                    callback();
                }
            });
        },
        /**
         * 下拉手动停止加载状态
         **/
        pullDownDone: function() {
            return api.refreshHeaderLoadDone();
        },
        /**
         * 上拉监听
         **/
        pullUp: function(callback) {
            api.addEventListener({
                name: 'scrolltobottom'
            }, function(ret, err) {
                if (callback && typeof callback == 'function') {
                    callback();
                }
            });
        },
        /**
         * 停止上拉监听
         **/
        pullUpDone: function() {
            return api.removeEventListener({
                name: 'scrolltobottom'
            })
        },
        /**
         * 事件监听接收
         **/
        eventListen: function(name, callback) {
            api.addEventListener({
                name: name
            }, function(ret, err) {
                if (callback && typeof callback === 'function') {
                    callback(ret);
                }
            });
        },
        /**
         * 事件发送
         **/
        eventSend: function(name, params) {
            api.sendEvent({
                name: name,
                extra: params
            });
        },
        /**
         * 事件发送
         **/
        eventRemove: function(name) {
            api.removeEventListener({
                name: 'name'
            });
        },
        /**
         * 选中文字
         **/
        textSelect: function(o, a, b) {
            //o是当前对象，例如文本域对象
            //a是起始位置，b是终点位置
            var a = parseInt(a, 10),
                b = parseInt(b, 10);
            var l = o.innerHTML.length;
            if (l) {
                //如果非数值，则表示从起始位置选择到结束位置
                if (!a) {
                    a = 0;
                }
                if (!b) {
                    b = l;
                }
                //如果值超过长度，则就是当前对象值的长度
                if (a > l) {
                    a = l;
                }
                if (b > l) {
                    b = l;
                }
                //如果为负值，则与长度值相加
                if (a < 0) {
                    a = l + a;
                }
                if (b < 0) {
                    b = l + b;
                }
                if (o.createTextRange) { //IE浏览器
                    var range = o.createTextRange();
                    range.moveStart("character", -l);
                    range.moveEnd("character", -l);
                    range.moveStart("character", a);
                    range.moveEnd("character", b);
                    range.select();
                } else {
                    o.setSelectionRange(a, b);
                    o.focus();
                }
            }
        },
        /**
         ** 延迟几秒后做什么
         */
        timeoutDo: function(callback, time) {
            setTimeout(function() {
                if (callback && typeof callback == 'function') {
                    callback();
                }
            }, time || 1500);
        },
        /**
         * toast事件
         * @param {string} msg 信息
         * @param {string} position 位置
         * @param {number} time 时间
         **/
        msg: function(msg, position, time) {
            if (msg) {
                api.toast({
                    msg: msg,
                    duration: time || 2000,
                    location: position || 'middle',
                    global: false
                });
            }
        },
        /**
         * alert事件
         * @param {string} title 标题
         * @param {string} msg 信息
         * @param {function} callback 回调事件
         **/
        alert: function(title, msg, callback) {
            api.alert({
                title: title,
                msg: msg,
            }, function(ret, err) {
                if (callback && typeof callback === 'function') {
                    callback();
                }
            });
        },
        /**
         * confirm事件
         * @param {string} title 标题
         * @param {string} msg 信息
         * @param {function} callback 回调事件
         **/
        confirm: function(title, msg, callback) {
            api.confirm({
                title: title,
                msg: msg,
                buttons: [Pub.getLang('confirm'), Pub.getLang('cancel')]
            }, function(ret, err) {
                var index = ret.buttonIndex;
                if (index == 1) {
                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                }
            });
        },
        /**
         * prompt文本框确认事件
         * @param {string} title 标题
         * @param {string} msg 信息
         * @param {string} text 文本框默认值
         * @param {string} type 文本框类型(可选值:text,password,number,email,url)
         * @param {function} callback 回调事件)
         **/
        prompt: function(title, msg, text, type, callback) {
            var _this = this;
            api.prompt({
                title: title || '',
                msg: msg || '',
                text: text || '',
                type: type || 'password',
                buttons: [Pub.getLang('confirm'), Pub.getLang('cancel')]
            }, function(ret, err) {
                var index = ret.buttonIndex;
                var text = ret.text;
                if (index == 1) {
                    if (!text) return _this.msg(msg || title);
                    if (callback && typeof callback === 'function') {
                        callback(text);
                    }
                }
            });
        },
        /**
         * 复制
         **/
        copy: function(val) {
            if (typeof api == 'undefined') {
                // 没有api对象时调用浏览器复制方法
                // 添加虚拟dom元素
                var fictitious_dom = document.createElement('textarea');
                fictitious_dom.style.opacity = '0';
                fictitious_dom.style.height = '0.1px';
                fictitious_dom.setAttribute('id', 'in_browser_fictitious_dom');
                fictitious_dom.innerHTML = val;
                document.body.appendChild(fictitious_dom);
                var in_browser_fictitious_dom1 = document.getElementById('in_browser_fictitious_dom');
                in_browser_fictitious_dom1.select();
                document.execCommand("Copy");
                // 移除虚拟dom元素
                Pub.msg(Pub.getLang('copy_success'));
                return;
            }
            // 有api对象时复制
            var obj = api.require('clipBoard');
            obj.set({
                value: val
            }, function(ret, err) {
                if (ret.status) {
                    Pub.msg(Pub.getLang('copy_success'));
                } else {
                    Pub.msg(Pub.getLang('copy_fail'));
                }
            });
        },
        /**
         * 通过值删除数组元素
         */
        deleteByValue: function(arr, valueToDelete) {
            var ret = $.grep(arr, function(value, i) {
                return value != valueToDelete;
            });
            return ret;
        },
        /**
         * 通过索引删除数组元素
         */
        deleteByIndex: function(arr, indexToDelete) {
            var reta = $.grep(arr, function(value, i) {
                return i != indexToDelete;
            });
            return reta;
        },
        /*数组重新排列*/
        arrRand: function(arr) {
            for (var i = 0, len = arr.length; i < len; i++) {
                var rand = parseInt(Math.random() * len);
                var temp = arr[rand];
                arr[rand] = arr[i];
                arr[i] = temp;
            }
            return arr;
        },
        /**
         * 判断字符串在数组的位置
         */
        arrIndexOf: function(arr, str) {
            // 如果可以的话，调用原生方法
            if (arr && arr.length > 0) {
                var len = arr.length;
                for (var i = 0; i < len; i++) {
                    var isString = JSON.stringify(arr[i]);
                    // 定位该元素位置
                    if (isString.indexOf(str) != -1) {
                        return i;
                    }
                }
            }
            // 数组中不存在该元素
            return -1;
        },
        /**
         *关键字是否在数组中
         **/
        arrIdexist: function(data, id) {
            if (Array.isArray(data) && data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].id == id) {
                        console.log('存在');
                        return i;
                    }
                }
            }
            return -1;
        },
        /**
         * 对字符串添加空格
         **/
        strSpace: function(value, position, padstr, inputElement) {
            position.forEach(function(item, index) {
                if (value.length > item + index) {
                    value = value.substring(0, item + index) + padstr + value.substring(item + index)
                }
            })
            value = value.trim();
            return value;
        },
        /*数值相乘精确*/
        multiply: function(arg1, arg2) {
            var m = 0,
                s1 = arg1.toString(),
                s2 = arg2.toString();
            try {
                m += s1.split(".")[1].length
            } catch (e) {}
            try {
                m += s2.split(".")[1].length
            } catch (e) {}
            return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
        },
        /*数值相除精确*/
        division: function(arg1, arg2) {
            var t1 = 0,
                t2 = 0,
                r1, r2;
            try {
                t1 = arg1.toString().split(".")[1].length
            } catch (e) {}
            try {
                t2 = arg2.toString().split(".")[1].length
            } catch (e) {}
            with(Math) {
                r1 = Number(arg1.toString().replace(".", ""))
                r2 = Number(arg2.toString().replace(".", ""))
                return (r1 / r2) * pow(10, t2 - t1);
            }
        },
        changeByte: function(limit) {
            var size = "";
            if (limit < 0.1 * 1024) { //小于0.1KB，则转化成B
                size = limit.toFixed(2) + "B"
            } else if (limit < 0.1 * 1024 * 1024) { //小于0.1MB，则转化成KB
                size = (limit / 1024).toFixed(2) + "KB"
            } else if (limit < 0.1 * 1024 * 1024 * 1024) { //小于0.1GB，则转化成MB
                size = (limit / (1024 * 1024)).toFixed(2) + "MB"
            } else { //其他转化成GB
                size = (limit / (1024 * 1024 * 1024)).toFixed(2) + "GB"
            }

            var sizeStr = size + ""; //转成字符串
            var index = sizeStr.indexOf("."); //获取小数点处的索引
            var dou = sizeStr.substr(index + 1, 2) //获取小数点后两位的值
            if (dou == "00") { //判断后两位是否为00，如果是则删除00
                return sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2)
            }
            return size;
        },
        /**
         * 设置常用win跳转默认值，可选参数opts，为对象时生效，对象键值对参照api文档
         **/
        openView: function(url, opts) {
            if (!url) {
                return this.msg(api.winName + 'openWin时url不能为空');
            }
            var urlArr = [],
                name = '';
            if (url.indexOf('/') > -1) {
                urlArr = url.split('/');
                name = urlArr[urlArr.length - 1];
            } else {
                name = url;
            }
            console.log('win:' + name);
            var _opts = {
                name: name,
                url: url + '.html',
                reload: false,
                allowEdit: true,
                delay: 0,
                animation: {
                    // type: 'push',
                    // subType: 'from_right',
                    // duration: 500,
                },
                // progress: {
                //     type: 'default',
                //     title: ''
                // },
                bgColor: '#ffffff'
            };
            if (this.isObject(opts)) {
                for (var k in opts) {
                    _opts[k] = opts[k];
                }
            }
            api.openWin(_opts);
        },
        /**
         * 设置常用frame跳转默认值，可选参数opts，为对象时生效，对象键值对参照api文档
         **/
        openFrame: function(url, position, opts, isSafe) {
            if (!url) return this.msg("openFrame时url不能为空");
            var _h = 0,
                _b = 0,
                _opts = {};
            if (position && this.isObject(position)) {
                if (position.headerPos && position.headerPos.h) {
                    _h = position.headerPos.h;
                }
                if (position.footerPos && position.footerPos.h) {
                    _b = position.footerPos.h;
                } else {
                    // _b = api.safeArea.bottom;
                }
            }
            var realUrl = '';
            if (url.indexOf('http') > -1) {
                realUrl = url
            } else {
                realUrl = url + '.html';
                if (url.indexOf('/') > -1) {
                    var urlArr = url.split('/');
                    url = urlArr[urlArr.length - 1];
                }
            }
            console.log(url)
            var rectY = 0,
                rectH = 0;
            // if(isSafe){
            //     rectY = _h;
            //     rectH = api.winHeight - _h - _b;
            // } else {
            //     rectY = _h + api.safeArea.top;
            //     rectH = api.winHeight - api.safeArea.top - _h - _b;
            // }
            rectY = _h;
            rectH = api.winHeight - _h - _b;
            _opts = {
                name: url,
                url: realUrl,
                rect: {
                    x: 0,
                    y: rectY,
                    w: "auto",
                    h: rectH
                },
                allowEdit: true,
                bounces: false,
                vScrollBarEnabled: true,
                hScrollBarEnabled: true,
                overScrollMode: 'always',
                // animation:{
                //   type: 'fade',
                //   duration: 50
                // }
            }
            if (opts && this.isObject(opts)) {
                for (var k in opts) {
                    _opts[k] = opts[k];
                }
            }
            api.openFrame(_opts);
        },
        /**
         * 判断是否是对象
         **/
        isObject: function(obj) {
            if (Object.prototype.toString.call(obj) == '[object Object]') {
                return true;
            } else {
                return false;
            }
        },
        /**
         * 获取当前年月日
         **/
        getCurrentDay() {
            var date = new Date();
            var seperator1 = "-";
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var strDate = date.getDate();
            if (month >= 1 && month <= 9) {
                month = "0" + month;
            }
            if (strDate >= 0 && strDate <= 9) {
                strDate = "0" + strDate;
            }
            var currentdate = year + seperator1 + month + seperator1 + strDate;
            return currentdate;
        },
        /**
         * 时间转换(timestamp: 时间戳)
         **/
        timestampFormat: function(timestamp) {
            function zeroize(num) {
                return (String(num).length == 1 ? '0' : '') + num;
            }

            var curTimestamp = parseInt(new Date().getTime() / 1000); //当前时间戳
            var timestampDiff = curTimestamp - timestamp; // 参数时间戳与当前时间戳相差秒数
            var curDate = new Date(curTimestamp * 1000); // 当前时间日期对象
            var tmDate = new Date(timestamp * 1000); // 参数时间戳转换成的日期对象

            var Y = tmDate.getFullYear(),
                m = tmDate.getMonth() + 1,
                d = tmDate.getDate();
            var H = tmDate.getHours(),
                i = tmDate.getMinutes(),
                s = tmDate.getSeconds();

            if (timestampDiff < 60) { // 一分钟以内
                return Pub.getLang('just');
            } else if (timestampDiff < 3600) { // 一小时前之内
                return Math.floor(timestampDiff / 60) + Pub.getLang('minutes_ago');
            } else if (curDate.getFullYear() == Y && curDate.getMonth() + 1 == m && curDate.getDate() == d) {
                return Pub.getLang('today') + zeroize(H) + ':' + zeroize(i);
            } else {
                var newDate = new Date((curTimestamp - 86400) * 1000); // 参数中的时间戳加一天转换成的日期对象
                if (newDate.getFullYear() == Y && newDate.getMonth() + 1 == m && newDate.getDate() == d) {
                    return Pub.getLang('yesterday') + zeroize(H) + ':' + zeroize(i);
                } else if (curDate.getFullYear() == Y) {
                    return zeroize(m) + Pub.getLang('month') + zeroize(d) + Pub.getLang('day1') + ' ' + zeroize(H) + ':' + zeroize(i);
                } else {
                    return Y + Pub.getLang('year') + zeroize(m) + Pub.getLang('month') + zeroize(d) + Pub.getLang('day1') + ' ' + zeroize(H) + ':' + zeroize(i);
                }
            }
        },
        /**
         * 类型(Y-m-d H:i:s)时间转换时间戳
         **/
        toUnix: function(time) {
            var tmpDatetime = time.replace(/:/g, '-');
            tmpDatetime = tmpDatetime.replace(/ /g, '-');
            var arr = tmpDatetime.split("-");
            var now = new Date(Date.UTC(arr[0], arr[1] - 1, arr[2], arr[3] - 8, arr[4], arr[5]));
            return parseInt(now.getTime());
        },
        /**
         * 时间戳时间转换时间戳(毫秒)
         **/
        toTime: function(times) {
            var time = new Date(parseInt(times));
            var y = time.getFullYear();
            var m = time.getMonth() + 1;
            m = m < 10 ? "0" + m : m;
            var d = time.getDate();
            d = d < 10 ? '0' + d : d;
            var h = time.getHours();
            h = h < 10 ? '0' + h : h;
            var mi = time.getMinutes();
            mi = mi < 10 ? '0' + mi : mi;
            var s = time.getSeconds();
            s = s < 10 ? '0' + s : s;
            return y + '-' + m + '-' + d + ' ' + h + ':' + mi + ':' + s;
        },
        toTimeMin: function(times) {
            var time = new Date(parseInt(times));
            var y = time.getFullYear();
            var m = time.getMonth() + 1;
            m = m < 10 ? "0" + m : m;
            var d = time.getDate();
            d = d < 10 ? '0' + d : d;
            var h = time.getHours();
            h = h < 10 ? '0' + h : h;
            var mi = time.getMinutes();
            mi = mi < 10 ? '0' + mi : mi;
            var s = time.getSeconds();
            s = s < 10 ? '0' + s : s;
            return y + '-' + m + '-' + d + ' ' + h + ':' + mi;
        },
        /**
         * 切换皮肤
         **/
        changeSkin: function() {
            var skin = $api.getStorage('skin');
            var curCss = $api.attr($api.byId('skin'), 'href');
            var newCss = '';
            if (skin) {
                newCss = curCss.split('skin/')[0] + 'skin/' + skin + '/css/main.css';
            } else {
                newCss = curCss.split('skin/')[0] + 'skin/' + 'default/css/main.css';
            }
            this.attr($api.byId('skin'), 'href', newCss);
        },
        /**
         * 设置app状态栏(type:可选值'dark,light', color:颜色(默认透明))
         **/
        setStatusBar: function(type, color) {
            api.setStatusBarStyle({
                style: type || 'dark',
                color: color || 'transparent'
            });
        },
        changeStatusBar: function() {
            this.setStatusBar('light');
        },
        /**
         * keyback 关闭页面
         **/
        keybackClose: function(isStatus) {
            api.addEventListener({
                name: 'keyback'
            }, function(ret, err) {
                if (isStatus && isStatus != 'undefined') {
                    Pub.setStatusBar();
                } else {
                    Pub.setStatusBar();
                }
                api.closeWin();
            });
            api.addEventListener({
                name: 'viewdisappear'
            }, function(ret, err) {
                if (isStatus && isStatus != 'undefined') {
                    Pub.setStatusBar();
                } else {
                    Pub.setStatusBar();
                }
            });

        },
        /**
         * 点击返回退出APP
         **/
        exitApp: function() {
            var ci = 0;
            var time1, time2;
            api.addEventListener({
                name: 'keyback'
            }, function(ret, err) {
                if (ci == 0) {
                    time1 = new Date().getTime();
                    ci = 1; 
                    api.toast({
                        msg: Pub.getLang('return_exit')
                    });
                } else if (ci == 1) {
                    time2 = new Date().getTime();
                    if (time2 - time1 < 3000) {
                        api.closeWidget({
                            id: api.appId,
                            retData: {
                                name: 'closeWidget'
                            },
                            silent: true
                        });
                    } else {
                        ci = 0; 
                        api.toast({
                            msg: Pub.getLang('return_exit')
                        });
                    }
                }
            });
        },
        randomStr: function() {
            return Math.random().toString(36).substr(2) + new Date().getTime();
        },
        /**
         * 创建二维码
         **/
        createQrcode: function(url, callback, type) {
            var FNScanner = api.require('FNScanner');
            var randomString = Math.random().toString(36).substr(2);
            FNScanner.encodeImg({
                content: url,
                saveToAlbum: false,
                saveImg: {
                    path: 'fs://' + (type || 'qrcode') + randomString + '.jpg',
                    w: 300,
                    h: 300
                }
            }, function(ret, err) {
                if (ret.status) {
                    if (callback && typeof callback == 'function') {
                        callback(ret.imgPath);
                    }
                }
            });
        },
        /**
         * 搜索参数
         **/
        getUrlParams: function(url) {
            var pattern = /(\w+)=(\w+)/ig // 定义正则表达式
            var parames = {} // 定义数组
            url.replace(pattern, function(a, b, c) {
                parames[b] = c
            })
            return parames // 返回这个数组
        },
        /**
         *在光标位置插入内容
         **/
        insertContent: function(content) {
            if (!content) { //如果插入的内容为空则返回
                return;
            }
            var sel = null;
            if (document.selection) { //IE9以下
                sel = document.selection;
                sel.createRange().pasteHTML(content);
            } else {
                sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    var range = sel.getRangeAt(0); //获取选择范围
                    range.devareContents(); //删除选中的内容
                    var el = document.createElement("div"); //创建一个空的div外壳
                    el.innerHTML = content; //设置div内容为我们想要插入的内容。
                    var frag = document.createDocumentFragment(); //创建一个空白的文档片段，便于之后插入dom树

                    var node = el.firstChild;
                    var lastNode = frag.appendChild(node);
                    range.insertNode(frag); //设置选择范围的内容为插入的内容
                    var contentRange = range.cloneRange(); //克隆选区
                    contentRange.setStartAfter(lastNode); //设置光标位置为插入内容的末尾
                    contentRange.collapse(true); //移动光标位置到末尾
                    sel.removeAllRanges(); //移出所有选区
                    sel.addRange(contentRange); //添加修改后的选区
                }
            }
        },
        /**
         * 打开href链接的窗口, 使用时必须有'.open-view',属性href不带html后缀
         **/
        openHref: function() {
            var _this = this;
            $('.open-view').on('click', function() {
                var thisHref = $(this).attr('href');
                var isLogin = $(this).attr('is-login');
                var isSlide = $(this).attr('is-slide');
                var id = $(this).attr('data-id');
                var token = $api.getStorage('token');
                var pageParams = {};
                var isSlideBack = true;
                if (id) {
                    pageParams.id = id
                }
                if (isSlide) {
                    isSlideBack = false;
                } else {
                    isSlideBack = true;
                }
                console.log(JSON.stringify(pageParams))
                if (isLogin && !token) {
                    _this.msg('请先登录');
                    setTimeout(function() {
                        var wins = JSON.stringify(api.windows());
                        $api.rmStorage('uid');
                        $api.rmStorage('token');
                        if (wins.indexOf('login') == -1 && wins.indexOf('register') == -1 && wins.indexOf('forget') == -1) {
                            _this.openView('widget://html/login/login_win', {
                                slidBackEnabled: false
                            });
                        }
                    }, 1000);
                    return false;
                } else {
                    _this.openView(thisHref, {
                        pageParam: pageParams,
                        slidBackEnabled: isSlideBack
                    });
                    return false;
                }
            });
        },
        /**
         * 正则表达式验证
         */
        regex: {
            rgNotnull: /[\w\W]+/, // 不能为空！
            rgCharacterLimit: /^[\w\W]{6,16}$/, // 6到16位任意字符！
            rgNum: /^\d+$/, // 数字！
            rgChinese: /[\u4E00-\u9FA5\uF900-\uFA2D]/,
            rgNumLimit: /^\d{6,16}$/, // 6到16位数字！
            rgNoString: /^[\u4E00-\u9FA5\uf900-\ufa2d\w\.\s]+$/, // 特殊字符！
            rgStringLimit: /^[\u4E00-\u9FA5\uf900-\ufa2d\w\.\s]{6,18}$/, // 6到18位字符！
            rgPost: /^[0-9]{6}$/, // 请填写邮政编码！
            // rgMobile: /^1[34578]\d{9}$/, // 手机号码！
            rgEmail: /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/, // 邮箱地址格式!
            rgPhone: /^(\d{3,4}-)?\d{7,8}$/, // 电话或传真！
            rgUrl: /^(\w+:\/\/)?\w+(\.\w+)+.*$/, //网址
            rgMobile: /^1[3456789]\d{9}$/, // 手机号码！
            rgPassword: /^(?![\d]+$)(?![a-zA-Z]+$)(?![^\da-zA-Z]+$).{8,20}$/, // 8-20位包含字母特殊字符数字密码
            rgPayPassword: /^\d{6}$/, // 6位纯数字密码
            rgIdCard: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, //身份证号码
            rgEmotion: /\[.+?\]/g, // 匹配[表情]
            rgLetterCap: /^[A-Z]+$/, // 匹配大写字母
        },
        _dateTime: function() {
            Date.prototype.format = function(fmt) {
                var _this = this;
                var lang = $api.getStorage('lang');
                var langObj = {};
                if (lang == 'en') {
                    langObj = {
                        sunday: 'Sunday',
                        monday: 'Monday',
                        tuesday: 'Tuesday',
                        wednesday: 'Wednesday',
                        thursday: 'Thursday',
                        friday: 'Friday',
                        saturday: 'Saturday',
                        beforeDawn: 'BeforeDawn',
                        morning: 'Morning',
                        noon: 'Noon',
                        afternoon: 'Afternoon',
                        night: 'Night',
                    }
                } else {
                    langObj = {
                        sunday: '周日',
                        monday: '周一',
                        tuesday: '周二',
                        wednesday: '周三',
                        thursday: '周四',
                        friday: '周五',
                        saturday: '周六',
                        beforeDawn: '凌晨',
                        morning: '早上',
                        noon: '中午',
                        afternoon: '下午',
                        night: '晚上',
                    }
                }
                var o = {
                    "y+": this.getFullYear(),
                    "M+": this.getMonth() + 1,
                    "d+": this.getDate(),
                    "H+": this.getHours(),
                    "m+": this.getMinutes(),
                    "s+": this.getSeconds(),
                    "S+": this.getMilliseconds(),
                    "q+": Math.floor(this.getMonth() / 3) + 1,
                    "h+": (function() {
                        var hour = _this.getHours() % 12;
                        return hour == 0 ? 12 : hour;
                    })(),
                    "E+": (function() {
                        var week = {
                            "0": "Sunday",
                            "1": "Monday",
                            "2": "Tuesday",
                            "3": "Wednesday",
                            "4": "Thursday",
                            "5": "Friday",
                            "6": "Saturday"
                        };
                        return week[_this.getDay() + ""];
                    })(),
                    /*
                    "e+": (function(){
                      var week = {"0":"Sun","1":"Mon","2":"Tue","3":"Wed","4":"Thu","5":"Fri","6":"Sat"};
                      return week[this.getDay()+""];
                    })(),
                    */
                    "x1": (function() {
                        var week = {
                            "0": langObj.sunday,
                            "1": langObj.monday,
                            "2": langObj.tuesday,
                            "3": langObj.wednesday,
                            "4": langObj.thursday,
                            "5": langObj.friday,
                            "6": langObj.saturday
                        };
                        return week[_this.getDay() + ""];
                    })(),
                    "x2": (function() {
                        var hour = [langObj.beforeDawn, langObj.morning, langObj.afternoon, langObj.night];
                        var h = _this.getHours();
                        if (h == 12) return langObj.noon;
                        return hour[parseInt(h / 6)];
                    })(),
                }
                for (var k in o) {
                    if (new RegExp("(" + k + ")", "g").test(fmt)) {
                        var len = RegExp.$1.length;
                        fmt = fmt.replace(RegExp.$1, len == 1 ? o[k] : ("00" + o[k]).substr(-len));
                    }
                }
                return fmt;
            }
            Date.prototype.toWeiXinString = function() {
                var lang = $api.getStorage('lang');
                var langObj = {};
                if (lang == 'en') {
                    langObj = {
                        yesterday: 'Yesterday',
                        beforeYesterday: 'BeforeYesterday',
                        beforeDawn: 'BeforeDawn',
                        morning: 'Morning',
                        noon: 'Noon',
                        afternoon: 'Afternoon',
                        night: 'Night',
                        month: ' Month ',
                    }
                } else {
                    langObj = {
                        yesterday: '昨天',
                        beforeYesterday: '前天',
                        beforeDawn: '凌晨',
                        morning: '早上',
                        noon: '中午',
                        afternoon: '下午',
                        night: '晚上',
                        month: '月',
                    }
                }
                var str;
                var now = new Date();
                var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                var beforeYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
                var monday = new Date(today);
                monday.setDate(today.getDate() - (today.getDay() ? today.getDay() - 1 : 6));
                //注意：date初始化默认是按本地时间初始的，但打印默认却是按GMT时间打印的，也就是说打印出的不是本地现在的时间
                //LocaleString的打印也有点问题，"0点"会被打印为"上午12点"
                if (this.getTime() > today.getTime()) {
                    str = "";
                } else if (this.getTime() > yesterday.getTime()) {
                    str = langObj.yesterday;
                } else if (this.getTime() > beforeYesterday.getTime()) {
                    str = langObj.beforeYesterday;
                }
                // else if (this.getTime() > monday.getTime()) {
                //     var week = {
                //         "0": "周日",
                //         "1": "周一",
                //         "2": "周二",
                //         "3": "周三",
                //         "4": "周四",
                //         "5": "周五",
                //         "6": "周六"
                //     };
                //     str = week[this.getDay() + ""];
                // }
                else {
                    var hour = [langObj.beforeDawn, langObj.morning, langObj.afternoon, langObj.night];
                    var h = this.getHours();
                    if (h == 12) str = langObj.noon;
                    else str = hour[parseInt(h / 6)];
                    str = this.format("MM" + langObj.month + "dd ") + str;
                }
                str += this.format("HH:mm");
                return str;
            }
        },
        setLang: function() {
            var _this = this;
            $('[set-lang]').each(function() {
                var me = $(this);
                var a = me.attr('set-lang').split(':');
                var p = a[0]; //文字放置位置
                var m = a[1]; //文字的标识

                //用户选择语言后保存在cookie中，这里读取cookie中的语言版本
                var lan = $api.getStorage('lang');

                //选取语言文字
                switch (lan) {
                    case 'zh':
                        var t = zh[m]; //这里cn[m]中的cn是上面定义的json字符串的变量名，m是json中的键，用此方式读取到json中的值
                        break;
                    case 'en':
                        var t = en[m];
                        break;
                    case 'cht':
                        var t = cht[m];
                        break;
                    case 'jp':
                        var t = jp[m];
                        break;
                    case 'kor':
                        var t = kor[m];
                        break;
                    default:
                        var t = zh[m];
                }

                //如果所选语言的json中没有此内容就选取其他语言显示
                if (t == undefined)
                    t = zh[m];
                if (t == undefined)
                    t = en[m];
                if (t == undefined)
                    t = cht[m];
                if (t == undefined)
                    t = jp[m];
                if (t == undefined)
                    t = kor[m];

                if (t == undefined)
                    return true; //如果还是没有就跳出

                //文字放置位置有（html,val等，可以自己添加）
                switch (p) {
                    case 'html':
                        me.html(t);
                        break;
                    case 'text':
                        me.text(t);
                        break;
                    case 'placeholder':
                        me.attr('placeholder', t);
                        break;
                    case 'val':
                        me.val(t);
                        break;
                    case 'value':
                        me.val(t);
                        break;
                    default:
                        me.html(t);
                }

            });
        },
        getLang: function(m) {
            //获取文字
            var lan = $api.getStorage('lang'); //语言版本
            //选取语言文字
            switch (lan) {
                case 'zh':
                    var t = zh[m];
                    break;
                case 'en':
                    var t = en[m];
                    break;
                case 'cht':
                    var t = cht[m];
                    break;
                case 'jp':
                    var t = jp[m];
                    break;
                case 'kor':
                    var t = kor[m];
                    break;
                default:
                    var t = zh[m];
            }

            //如果所选语言的json中没有此内容就选取其他语言显示
            if (t == undefined)
                t = zh[m];
            if (t == undefined)
                t = en[m];
            if (t == undefined)
                t = cht[m];
            if (t == undefined)
                t = jp[m];
            if (t == undefined)
                t = kor[m];

            if (t == undefined)
                t = m; //如果还是没有就返回他的标识
            return t;
        },
        setTabText: function() {
            api.setTabBarItemAttr({
                index: 0,
                text: Pub.getLang('chat'),
            });
            api.setTabBarItemAttr({
                index: 1,
                text: Pub.getLang('mail_list'),
            });
            api.setTabBarItemAttr({
                index: 2,
                text: Pub.getLang('find'),
            });
            api.setTabBarItemAttr({
                index: 3,
                text: Pub.getLang('mine'),
            });
        },
        showNickname: function(item){
          if(item.nickname === null){
            return item.uname;
          }else{
            return item.nickname;
          }
        },
        imageManage: function(img){
          if (!img) {
              return false;
          } else if (img == null) {
              return false;
          } else if (img.length < 10) {
              return false;
          } else {
              if(img.indexOf("http")==-1){
                return this.imgHost + img;
              }else{
                return img;
              }
          }
        }
    }
    public._dateTime();
    public.setLang();
    window.Pub = public;

})(window);
