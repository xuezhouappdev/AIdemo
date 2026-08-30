(function () {
  "use strict";

  const banner = document.createElement("div");
  banner.setAttribute("role", "note");
  banner.textContent = "外部功能演示｜页面数据为合成示例，不代表真实业务信息";
  Object.assign(banner.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    zIndex: "9999",
    maxWidth: "360px",
    padding: "9px 13px",
    color: "#ffffff",
    background: "rgba(15, 47, 79, .94)",
    border: "1px solid rgba(147, 197, 253, .72)",
    boxShadow: "0 10px 28px rgba(15, 47, 79, .22)",
    fontFamily: "方正兰亭黑, Source Han Sans SC, PingFang SC, sans-serif",
    fontSize: "12px",
    lineHeight: "1.5",
    pointerEvents: "none",
  });
  document.body.appendChild(banner);
})();
