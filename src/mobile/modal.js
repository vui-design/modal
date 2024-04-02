(function(root, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory(require("jquery"));
  }
  else if (typeof define === "function" && define.amd) {
    define(["jquery"], factory);
  }
  else {
    var old = root.modal;
    var modal = factory(root.jQuery || root.$);

    // 如果是通过script标签引入，则额外提供一个重命名方法，以解决与其他库或插件命名冲突的问题
    modal.noConflict = function() {
      if (root.modal === modal) {
        root.modal = old;
      }

      return modal;
    };

    root.modal = modal;
  }
})(this, function(jQuery) {
  var objProto = Object.prototype;
  var funProto = Function.prototype;

  var getPrototypeOf = Object.getPrototypeOf;
  var isArray = Array.isArray;

  var objToString = objProto.toString;
  var hasOwnProperty = objProto.hasOwnProperty;
  var funToString = funProto.toString;

  // --------------------------------------------------------------------------------
  // 工具函数
  var utils = {};

  // 如果value是一个字符串，则返回true
  utils.isString = function(value) {
    return objToString.call(value) === "[object String]";
  };

  // 如果value是一个数值，则返回true
  utils.isNumber = function(value) {
    return objToString.call(value) === "[object Number]";
  };

  // 如果value是一个布尔值，则返回true
  utils.isBoolean = function(value) {
    return value === true || value === false || objToString.call(value) === "[object Boolean]";
  };

  // 如果value是一个函数，则返回true
  utils.isFunction = function(value) {
    return objToString.call(value) === "[object Function]" || typeof value === "function";
  };

  // 如果value是一个数组，则返回true
  utils.isArray = isArray || function(value) {
    return objToString.call(value) === "[object Array]";
  };

  // 如果value是一个对象，则返回true
  utils.isObject = function(value) {
    return !!value && typeof value === "object";
  };

  // 如果value是一个纯对象，则返回true
  utils.isPlainObject = function(value) {
    if (!value || objToString.call(value) !== "[object Object]") {
      return false;
    }

    var prototype = getPrototypeOf(value);

    if (prototype === null) {
      return true;
    }

    var constructor = hasOwnProperty.call(prototype, "constructor") && prototype.constructor;

    return typeof constructor === "function" && funToString.call(constructor) === funToString.call(Object);
  };

  // 如果是ie浏览器，则返回相应的版本号，否则返回false
  utils.ie = (!!window.ActiveXObject || "ActiveXObject" in window) ? ((navigator.userAgent.toLowerCase().match(/msie\s(\d+)/) || [])[1] || "11") : false;

  // 空函数，用于默认的回调函数
  utils.noop = function() {};

  // --------------------------------------------------------------------------------
  // 基础配置
  var defaults = {};

  // 基础索引
  defaults.index = 0;

  // 默认配置
  defaults.options = {
    // 遮罩，默认为0.75透明度的黑色遮罩
    backdrop: 0.75,
    // 点击遮罩关闭
    clickBackdropToClose: false,
    // 固定定位
    fixed: true,
    // 层叠顺序
    zIndex: 10000,
    // 坐标，默认水平垂直居中
    offset: "centered",
    // 是否为定制弹窗，定制弹窗将不显示标题、操作按钮及关闭按钮
    customized: false,
    // 自定义样式类名
    className: "",
    // 是否显示标题
    showTitle: true,
    // 标题，如果不想显示标题，设置为false即可
    title: "友情提示",
    // 内容
    content: "",
    // 内边距
    padding: "",
    // 图标
    icon: false,
    // 是否显示取消按钮
    showBtnCancel: true,
    // 取消按钮文本
    cancelText: "取消",
    // 取消按钮点击事件回调函数
    cancel: utils.noop,
    // 是否显示确定按钮
    showBtnOk: true,
    // 确定按钮文本
    okText: "确定",
    // 确定按钮点击事件回调函数
    ok: utils.noop,
    // 自定义按钮
    btns: [],
    // 是否显示关闭按钮
    showBtnClose: true,
    // 打开事件回调函数
    open: utils.noop,
    // 关闭事件回调函数
    close: utils.close,
    // 停留时长，单位毫秒；默认不会自动关闭
    duration: 0,
    // 打开动画&关闭动画
    animations: ["bounceIn", "bounceOut"],
    // 阻止默认的关闭行为，点击关闭按钮、取消按钮或确认按钮时，默认会自动关闭弹窗，可设置此属性为true取消默认行为
    preventDefault: false
  };

  // --------------------------------------------------------------------------------
  // 实例集合
  var instances = {};

  // 用于存储所有的弹框实例，以index作为key存储
  instances.all = {

  };

  // 用于存储所有含有id选项的弹框实例，以id作为key存储
  instances.unique = {

  };

  // --------------------------------------------------------------------------------
  // 构造函数
  var Modal = function(options) {
    // 
    var me = this;

    // 设置索引
    me.index = ++defaults.index;
    // 扩展基础配置
    me.options = jQuery.extend(true, {}, defaults.options, options);
    // 用于存储弹框遮罩DOM对象引用
    me.backdrop = null;
    // 用于存储弹框DOM对象引用
    me.modal = null;

    // 重设backdrop属性
    if (utils.isString(me.options.backdrop)) {
      me.options.backdrop = [0.75, me.options.backdrop];
    }
    else if (utils.isNumber(me.options.backdrop)) {
      me.options.backdrop = [me.options.backdrop, "#000"];
    }

    // 重设zIndex属性
    me.options.zIndex = me.options.zIndex + me.index;

    // 重设className属性
    if (me.options.customized) {
      me.options.className = me.options.className ? ("ui-modal-customized " + me.options.className) : "ui-modal-customized";
    }

    // 重设showTitle属性
    if (me.options.customized) {
      me.options.showTitle = false;
    }

    // 重设showBtnCancel、showBtnOk属性
    if (me.options.customized) {
      me.options.showBtnCancel = false;
      me.options.showBtnOk = false;
    }

    // 重设btns配置
    if (me.options.customized) {
      me.options.btns = [];
    }

    // 重设btnClose属性
    if (me.options.customized) {
      me.options.showBtnClose = false;
    }

    // 打开弹框
    me.open();

    // 注册事件处理程序
    me.addEventListener();
  };

  // 打开弹框
  Modal.prototype.open = function() {
    // 
    var me = this;
    var body = jQuery("body");

    // 创建弹框
    var template = me.template();

    me.options.backdrop && body.append(template[0]);
    body.append(template[1]);

    // 存储弹窗背景、弹窗DOM对象引用
    me.backdrop = me.options.backdrop ? jQuery("#ui-modal-backdrop" + me.index) : null;
    me.modal = jQuery("#ui-modal" + me.index);

    // 设置坐标
    me.offset();

    // 
    var open = function() {
      // 执行打开回调函数
      if (utils.isFunction(me.options.open)) {
        me.options.open.call(me);
      }

      // 当duration大于0时，延迟duration毫秒后自动关闭
      if (me.options.duration > 0) {
        setTimeout(function() {
          me.close();
        }, me.options.duration);
      }
    };

    // 未设置打开动画时，则直接打开
    if (!me.options.animations[0]) {
      open();
    }
    // 反之先应用打开动画，再打开
    else {
      var animation = "ui-modal-animation ui-modal-animation-" + me.options.animations[0];
      var event = "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend";

      me.modal.addClass(animation).one(event, function() {
        me.modal.removeClass(animation);
        open();
      });
    }
  };

  // 关闭弹框
  Modal.prototype.close = function() {
    // 
    var me = this;

    // 
    var close = function() {
      // 销毁DOM元素
      me.backdrop && me.backdrop.remove();
      me.modal.remove();

      // 执行关闭回调函数
      if (utils.isFunction(me.options.close)) {
        me.options.close.call(me);
      }
    };

    // 未设置关闭动画时，则直接关闭
    if (!me.options.animations[1]) {
      close();
    }
    // 反之先应用关闭动画，再关闭
    else {
      var animation = "ui-modal-animation ui-modal-animation-" + me.options.animations[1];
      var event = "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend";

      me.modal.addClass(animation).one(event, function() {
        me.modal.removeClass(animation);
        close();
      });
    }
  };

  // 构建html模板
  Modal.prototype.template = function() {
    // 
    var me = this;

    // 弹窗背景
    var htmlBackdrop = "";

    if (me.options.backdrop) {
      htmlBackdrop = "<div id=\"ui-modal-backdrop" + me.index + "\" class=\"ui-modal-backdrop\" style=\"z-index: " + me.options.zIndex + "; opacity: " + me.options.backdrop[0] + "; background-color: " + me.options.backdrop[1] + ";\"></div>";
    }

    // 弹窗
    var html = "";

    html += "<div id=\"ui-modal" + me.index + "\" class=\"ui-modal" + (me.options.className ? (" " + me.options.className) : "") + "\" style=\"position: " + (me.options.fixed ? "fixed" : "absolute") + "; z-index: " + me.options.zIndex + ";\">";

    if (me.options.showTitle) {
      if (utils.isString(me.options.title)) {
        html += "<div class=\"ui-modal-header\">" + me.options.title + "</div>";
      }
      else if (utils.isPlainObject(me.options.title)) {
        html += "<div class=\"ui-modal-header\" style=\"" + me.options.title.style + "\">" + me.options.title.text + "</div>";
      }
    }

    html += "<div class=\"ui-modal-body\"" + (me.options.padding ? " style=\"padding: " + me.options.padding + "\"" : "") + ">";
    html += "<div class=\"ui-modal-content" + (me.options.icon ? " ui-modal-content-with-icon" : "") + "\">";

    if (me.options.icon) {
      html += "<i class=\"ui-modal-icon ui-modal-icon-" + me.options.icon + "\" />";
    }

    html += me.options.content;
    html += "</div>";
    html += "</div>";

    if (me.options.btns.length > 0 || me.options.showBtnCancel || me.options.showBtnOk) {
      html += "<div class=\"ui-modal-footer\">";

      if (me.options.btns.length > 0) {
        for (var index = 0, length = me.options.btns.length; index < length; index++) {
          html += "<button type=\"button\" class=\"ui-modal-btn ui-modal-btn-custom\" data-modal-role=\"custom\" data-index=\"" + index + "\">" + me.options.btns[index].text + "</button>";
        }
      }

      if (me.options.showBtnCancel) {
        html += "<button type=\"button\" class=\"ui-modal-btn ui-modal-btn-cancel\" data-modal-role=\"cancel\">" + me.options.cancelText + "</button>";
      }

      if (me.options.showBtnOk) {
        html += "<button type=\"button\" class=\"ui-modal-btn ui-modal-btn-ok\" data-modal-role=\"ok\">" + me.options.okText + "</button>";
      }

      html += "</div>";
    }

    if (me.options.showBtnClose) {
      html += "<button type=\"button\" class=\"ui-modal-btn-close\" data-modal-role=\"close\"></button>";
    }

    html += "</div>";

    return [htmlBackdrop, html];
  };

  // 设置坐标
  Modal.prototype.offset = function() {
    // 
    var me = this;
    var viewport = jQuery(window);
    var width = me.modal.outerWidth();
    var height = me.modal.outerHeight();
    var offsetTop = (viewport.height() - height) / 2;
    var offsetLeft = (viewport.width() - width) / 2;

    // 自定义坐标
    if (utils.isArray(me.options.offset)) {
      offsetTop = me.options.offset[0] || offsetTop;
      offsetLeft = me.options.offset[1] || offsetLeft;
    }
    // 停靠在顶部
    else if (me.options.offset === "top") {
      offsetTop = 0;
    }
    // 停靠在底部
    else if (me.options.offset === "bottom") {
      offsetTop = viewport.height() - height;
    }
    // 停靠在左侧
    else if (me.options.offset === "left") {
      offsetLeft = 0;
    }
    // 停靠在右侧
    else if (me.options.offset === "right") {
      offsetLeft = viewport.width() - width;
    }
    // 停靠在左上角
    else if (me.options.offset === "top left") {
      offsetTop = 0;
      offsetLeft = 0;
    }
    // 停靠在右上角
    else if (me.options.offset === "top right") {
      offsetTop = 0;
      offsetLeft = viewport.width() - width;
    }
    // 停靠在左下角
    else if (me.options.offset === "bottom left") {
      offsetTop = viewport.height() - height;
      offsetLeft = 0;
    }
    // 停靠在右下角
    else if (me.options.offset === "bottom right") {
      offsetTop = viewport.height() - height;
      offsetLeft = viewport.width() - width;
    }
    // 单独设置距离顶部距离
    else if (me.options.offset !== "centered") {
      offsetTop = me.options.offset;
    }

    // 
    if (!me.options.fixed) {
      offsetTop = viewport.scrollTop() + parseFloat(offsetTop);
      offsetLeft = viewport.scrollLeft() + parseFloat(offsetLeft);
    }

    // 
    me.modal.css({
      top: offsetTop,
      left: offsetLeft
    });
  };

  // 注册事件处理程序
  Modal.prototype.addEventListener = function() {
    // 
    var me = this;
    var viewport = jQuery(window);

    // 窗口大小改变时，重新设置坐标
    viewport.on("resize", function() {
      me.offset();
    });

    // 注册弹窗遮罩点击事件处理程序
    if (me.options.backdrop && me.options.clickBackdropToClose) {
      me.backdrop.on("click", function() {
        if (utils.isFunction(me.options.cancel)) {
          me.options.cancel.call(me, "backdrop");
        }

        if (!me.options.preventDefault) {
          me.close();
        }
      });
    }

    // 注册关闭按钮点击事件处理程序
    me.modal.on("click", "[data-modal-role='close']", function() {
      if (utils.isFunction(me.options.cancel)) {
        me.options.cancel.call(me, "close");
      }

      if (!me.options.preventDefault) {
        me.close();
      }
    });

    // 注册自定义按钮点击事件处理程序
    me.modal.on("click", "[data-modal-role='custom']", function() {
      var index = jQuery(this).data("index");
      var btn = me.options.btns[index];

      if (utils.isFunction(btn.callback)) {
        btn.callback.call(me, "custom");
      }

      if (!me.options.preventDefault) {
        me.close();
      }
    });

    // 注册取消按钮点击事件处理程序
    me.modal.on("click", "[data-modal-role='cancel']", function() {
      if (utils.isFunction(me.options.cancel)) {
        me.options.cancel.call(me, "cancel");
      }

      if (!me.options.preventDefault) {
        me.close();
      }
    });

    // 注册确定按钮点击事件处理程序
    me.modal.on("click", "[data-modal-role='ok']", function() {
      if (utils.isFunction(me.options.ok)) {
        me.options.ok.call(me, "ok");
      }

      if (!me.options.preventDefault) {
        me.close();
      }
    });
  };

  // --------------------------------------------------------------------------------
  // 内置方法
  var modal = {};

  // 打开一个新的弹框
  modal.open = function(options) {
    // 具有相同id选项的弹框，同时只能打开一个
    var id = options.id;

    if (id && instances.unique[id]) {
      return instances.unique[id];
    }

    // 打开一个新的弹框
    var instance = new Modal(options);

    // 
    instances.all[instance.index] = instance;

    // 
    if (instance.options.id) {
      instances.unique[instance.options.id] = instance;
    }

    // 
    return instance;
  };

  // 根据索引关闭指定弹框
  modal.close = function(index) {
    // 如果弹框不存在，则返回不处理
    if (!instances.all[index]) {
      return;
    }

    // 执行关闭操作
    var me = instances.all[index];

    me.close();

    delete instances.all[me.index];

    if (me.options.id) {
      delete instances.unique[me.options.id];
    }
  };

  // 关闭所有指定类型的弹框
  modal.closeAll = function(type) {
    for (var index in instances.all) {
      var me = instances.all[index];

      if (!type || me.options.type === type) {
        me.close();
      }
    }
  };

  // 仿系统alert对话框
  modal.alert = function(content, ok) {
    // 默认配置
    var defaults = {
      type: "alert",
      className: "ui-modal-alert",
      showBtnCancel: false,
      showBtnClose: false
    };

    // 自定义配置
    var options = {};

    if (utils.isString(content)) {
      options.content = content;
    }
    else if (utils.isPlainObject(content)) {
      options = content;
    }

    if (utils.isFunction(ok)) {
      options.ok = ok;
    }

    // 打开弹框，并返回弹窗实例
    return this.open(jQuery.extend(true, {}, defaults, options));
  };

  // 仿系统confirm对话框
  modal.confirm = function(content, ok, cancel) {
    // 默认配置
    var defaults = {
      type: "confirm",
      className: "ui-modal-confirm",
      showBtnClose: false
    };

    // 自定义配置
    var options = {};

    if (utils.isString(content)) {
      options.content = content;
    }
    else if (utils.isPlainObject(content)) {
      options = content;
    }

    if (utils.isFunction(ok)) {
      options.ok = ok;
    }

    if (utils.isFunction(cancel)) {
      options.cancel = cancel;
    }

    // 打开弹框，并返回弹窗实例
    return this.open(jQuery.extend(true, {}, defaults, options));
  };

  // 仿系统prompt对话框
  modal.prompt = function(title, ok, cancel) {
    // 默认配置
    var defaults = {
      type: "prompt",
      className: "ui-modal-prompt",
      showBtnClose: false
    };

    // 自定义配置
    var options = {};

    if (utils.isString(title)) {
      options.title = title;
    }
    else if (utils.isPlainObject(title)) {
      options = title;
    }

    if (options.defaultValue) {
      options.content = "<input type=\"text\" class=\"ui-modal-input\" value=\"" + options.defaultValue + "\" />";

      delete options.defaultValue;
    }
    else {
      options.content = "<input type=\"text\" class=\"ui-modal-input\" />";
    }

    options.ok = function(type) {
      var input = this.modal.find(".ui-modal-input");
      var value = input.val();

      return utils.isFunction(ok) ? ok.call(this, type, value) : true;
    };

    options.cancel = function(type) {
      return utils.isFunction(cancel) ? cancel.call(this, type, "") : true;
    };

    options.open = function() {
      var input = this.modal.find(".ui-modal-input");

      input.focus();
    };

    // 打开弹框，并返回弹窗实例
    return this.open(jQuery.extend(true, {}, defaults, options));
  };

  // 消息框
  modal.msg = function(content, close) {
    // 关闭之前所有打开的msg类型弹窗
    this.closeAll("msg");

    // 默认配置
    var defaults = {
      type: "msg",
      backdrop: false,
      className: "ui-modal-msg",
      showTitle: false,
      showBtnCancel: false,
      showBtnOk: false,
      showBtnClose: false,
      duration: 3000
    };

    // 自定义配置
    var options = {};

    if (utils.isString(content)) {
      options.content = content;
    }
    else if (utils.isPlainObject(content)) {
      options = content;
    }

    if (utils.isFunction(close)) {
      options.close = close;
    }

    // 打开弹框，并返回弹窗实例
    return this.open(jQuery.extend(true, {}, defaults, options));
  };

  // 加载框
  modal.loading = function(icon) {
    // 默认配置
    var defaults = {
      type: "loading",
      className: "ui-modal-loading",
      showTitle: false,
      showBtnCancel: false,
      showBtnOk: false,
      showBtnClose: false,
      animations: ["fadeIn", "fadeOut"]
    };

    // 自定义配置
    var options = {};

    if (utils.isString(icon)) {
      options.icon = icon;
    }
    else if (utils.isPlainObject(icon)) {
      options = icon;
    }

    if (options.icon) {
      options.content = "<i class=\"ui-modal-svg ui-modal-svg-" + options.icon + "\" />";

      delete options.icon;
    }
    else {
      options.content = "<i class=\"ui-modal-svg ui-modal-svg-bars\" />";
    }

    // 打开弹框，并返回弹窗索引
    return this.open(jQuery.extend(true, {}, defaults, options));
  };

  // --------------------------------------------------------------------------------
  // 返回modal对象供外部使用
  return modal;
});