/* @ds-bundle: {"format":3,"namespace":"VoltaiDesignSystem_7885c8","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconBadge","sourcePath":"components/core/IconBadge.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"MetricStat","sourcePath":"components/core/MetricStat.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"550fdbae2eb0","components/core/Badge.jsx":"297685800e4a","components/core/Button.jsx":"9c11374e7af7","components/core/Card.jsx":"6280e1235b9a","components/core/IconBadge.jsx":"67580b41e26c","components/core/IconButton.jsx":"d719c088100c","components/core/MetricStat.jsx":"8706bece44d1","components/core/Tag.jsx":"4c54b88e29af"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.VoltaiDesignSystem_7885c8 = window.VoltaiDesignSystem_7885c8 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.v-avatar{
  display:inline-flex; align-items:center; justify-content:center; flex:none;
  border-radius:var(--radius-circle); overflow:hidden;
  background:var(--ink-900); color:var(--paper-050);
  font-family:var(--font-mono); font-weight:var(--fw-medium); letter-spacing:0.02em;
  border:1px solid var(--border);
}
.v-avatar img{ width:100%; height:100%; object-fit:cover; }
.v-avatar--sm{ width:28px; height:28px; font-size:11px; }
.v-avatar--md{ width:38px; height:38px; font-size:13px; }
.v-avatar--lg{ width:52px; height:52px; font-size:16px; }
.v-avatar--square{ border-radius:var(--radius-sm); }
`;
function inject() {
  if (typeof document === "undefined") return;
  if (document.getElementById("v-avatar-css")) return;
  const s = document.createElement("style");
  s.id = "v-avatar-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
inject();
function Avatar({
  src,
  name = "",
  size = "md",
  square = false,
  className = "",
  ...rest
}) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const cls = ["v-avatar", `v-avatar--${size}`, square ? "v-avatar--square" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    title: name || undefined
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : initials || "—");
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.v-badge{
  display:inline-flex; align-items:center; gap:5px;
  font-family:var(--font-mono); font-weight:var(--fw-medium);
  font-size:var(--text-2xs); letter-spacing:0.08em; text-transform:uppercase;
  height:20px; padding:0 8px; border-radius:var(--radius-pill);
  border:1px solid transparent; white-space:nowrap;
}
.v-badge--neutral{ background:var(--surface-fill); color:var(--text-muted); border-color:var(--border); }
.v-badge--volt{ background:var(--accent); color:var(--text-on-accent); }
.v-badge--volt-soft{ background:var(--accent-tint); color:var(--accent); border-color:var(--accent-ring); }
.v-badge--ink{ background:var(--ink-900); color:var(--paper-050); }
.v-badge--success{ background:rgba(47,158,107,.14); color:var(--status-success); border-color:rgba(47,158,107,.3); }
.v-badge--warning{ background:rgba(216,147,42,.14); color:var(--status-warning); border-color:rgba(216,147,42,.3); }
.v-badge--danger{ background:rgba(194,58,38,.14); color:var(--status-danger); border-color:rgba(194,58,38,.3); }
.v-badge--info{ background:rgba(61,131,194,.14); color:var(--status-info); border-color:rgba(61,131,194,.3); }
.v-badge__dot{ width:5px; height:5px; border-radius:50%; background:currentColor; }
`;
function inject() {
  if (typeof document === "undefined") return;
  if (document.getElementById("v-badge-css")) return;
  const s = document.createElement("style");
  s.id = "v-badge-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
inject();
function Badge({
  children,
  tone = "neutral",
  dot = false,
  className = "",
  ...rest
}) {
  const cls = ["v-badge", `v-badge--${tone}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "v-badge__dot"
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.v-btn{
  --_bg: var(--accent); --_fg: var(--text-on-accent); --_bd: transparent;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-family:var(--font-sans); font-weight:var(--fw-medium);
  letter-spacing:0.01em; white-space:nowrap; cursor:pointer; user-select:none;
  border:1px solid var(--_bd); background:var(--_bg); color:var(--_fg);
  border-radius:var(--radius-md); transition:background var(--dur-fast) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard),
    transform var(--dur-instant) var(--ease-standard);
}
.v-btn:focus-visible{ outline:var(--ring-width) solid var(--focus-ring); outline-offset:var(--ring-offset); }
.v-btn:active{ transform:translateY(0.5px); }
.v-btn[disabled]{ opacity:.45; cursor:not-allowed; pointer-events:none; }

/* sizes */
.v-btn--sm{ height:var(--control-sm); padding:0 12px; font-size:var(--text-xs); border-radius:var(--radius-sm); }
.v-btn--md{ height:var(--control-md); padding:0 16px; font-size:var(--text-sm); }
.v-btn--lg{ height:var(--control-lg); padding:0 22px; font-size:var(--text-base); }

/* variants */
.v-btn--primary{ --_bg:var(--accent); --_fg:var(--text-on-accent); }
.v-btn--primary:hover{ --_bg:var(--accent-hover); }
.v-btn--primary:active{ --_bg:var(--accent-press); }

.v-btn--secondary{ --_bg:var(--ink-900); --_fg:var(--paper-050); }
.v-btn--secondary:hover{ --_bg:var(--ink-700); }

.v-btn--outline{ --_bg:transparent; --_fg:var(--text-strong); --_bd:var(--border-strong); }
.v-btn--outline:hover{ --_bg:var(--surface-fill); --_bd:var(--text-faint); }

.v-btn--ghost{ --_bg:transparent; --_fg:var(--text-body); }
.v-btn--ghost:hover{ --_bg:var(--surface-fill); --_fg:var(--text-strong); }

.v-btn--block{ width:100%; }
.v-btn svg{ width:1.05em; height:1.05em; flex:none; }
`;
function inject() {
  if (typeof document === "undefined") return;
  if (document.getElementById("v-button-css")) return;
  const s = document.createElement("style");
  s.id = "v-button-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
inject();
function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  leadingIcon = null,
  trailingIcon = null,
  type = "button",
  className = "",
  ...rest
}) {
  const cls = ["v-btn", `v-btn--${variant}`, `v-btn--${size}`, block ? "v-btn--block" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: cls
  }, rest), leadingIcon, children != null && /*#__PURE__*/React.createElement("span", null, children), trailingIcon);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.v-card{
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--radius-lg); color:var(--text-body);
}
.v-card--pad-sm{ padding:var(--space-4); }
.v-card--pad-md{ padding:var(--space-6); }
.v-card--pad-lg{ padding:var(--space-8); }
.v-card--raised{ box-shadow:var(--shadow-md); border-color:transparent; }
.v-card--interactive{ cursor:pointer; transition:border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard); }
.v-card--interactive:hover{ border-color:var(--text-faint); box-shadow:var(--shadow-sm); }
[data-theme="dark"] .v-card--raised{ box-shadow:var(--shadow-void-md); }
[data-theme="dark"] .v-card--interactive:hover{ box-shadow:var(--shadow-void-sm); }
`;
function inject() {
  if (typeof document === "undefined") return;
  if (document.getElementById("v-card-css")) return;
  const s = document.createElement("style");
  s.id = "v-card-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
inject();
function Card({
  children,
  padding = "md",
  raised = false,
  interactive = false,
  as: Tag = "div",
  className = "",
  ...rest
}) {
  const cls = ["v-card", `v-card--pad-${padding}`, raised ? "v-card--raised" : "", interactive ? "v-card--interactive" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.v-iconbadge{
  display:inline-flex; align-items:center; justify-content:center;
  border-radius:var(--radius-circle); flex:none;
  border:1px solid var(--border-strong); color:var(--text-strong); background:transparent;
}
.v-iconbadge--sm{ width:36px; height:36px; }
.v-iconbadge--md{ width:52px; height:52px; }
.v-iconbadge--lg{ width:72px; height:72px; }
.v-iconbadge--volt{ border-color:var(--accent); color:var(--accent); }
.v-iconbadge--solid{ background:var(--ink-900); color:var(--paper-050); border-color:var(--ink-900); }
.v-iconbadge--volt-solid{ background:var(--accent); color:var(--text-on-accent); border-color:var(--accent); }
.v-iconbadge svg{ width:42%; height:42%; stroke-width:1.6; }
`;
function inject() {
  if (typeof document === "undefined") return;
  if (document.getElementById("v-iconbadge-css")) return;
  const s = document.createElement("style");
  s.id = "v-iconbadge-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
inject();
function IconBadge({
  children,
  size = "md",
  tone = "default",
  className = "",
  ...rest
}) {
  const cls = ["v-iconbadge", `v-iconbadge--${size}`, tone !== "default" ? `v-iconbadge--${tone}` : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), children);
}
Object.assign(__ds_scope, { IconBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconBadge.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.v-iconbtn{
  display:inline-flex; align-items:center; justify-content:center;
  background:transparent; color:var(--text-body); cursor:pointer;
  border:1px solid transparent; border-radius:var(--radius-md);
  transition:background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard);
}
.v-iconbtn:hover{ background:var(--surface-fill); color:var(--text-strong); }
.v-iconbtn:active{ transform:translateY(0.5px); }
.v-iconbtn:focus-visible{ outline:var(--ring-width) solid var(--focus-ring); outline-offset:var(--ring-offset); }
.v-iconbtn[disabled]{ opacity:.45; pointer-events:none; }
.v-iconbtn--sm{ width:var(--control-sm); height:var(--control-sm); }
.v-iconbtn--md{ width:var(--control-md); height:var(--control-md); }
.v-iconbtn--lg{ width:var(--control-lg); height:var(--control-lg); }
.v-iconbtn--outline{ border-color:var(--border-strong); }
.v-iconbtn--solid{ background:var(--ink-900); color:var(--paper-050); }
.v-iconbtn--solid:hover{ background:var(--ink-700); color:var(--paper-050); }
.v-iconbtn svg{ width:1.15em; height:1.15em; }
`;
function inject() {
  if (typeof document === "undefined") return;
  if (document.getElementById("v-iconbtn-css")) return;
  const s = document.createElement("style");
  s.id = "v-iconbtn-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
inject();
function IconButton({
  children,
  size = "md",
  variant = "ghost",
  label,
  className = "",
  ...rest
}) {
  const cls = ["v-iconbtn", `v-iconbtn--${size}`, `v-iconbtn--${variant}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    "aria-label": label,
    title: label
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/MetricStat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.v-metric{ display:flex; flex-direction:column; gap:6px; }
.v-metric__value{
  font-family:var(--font-display); font-weight:var(--fw-medium);
  color:var(--text-strong); letter-spacing:-0.02em; line-height:1; font-size:var(--text-4xl);
}
.v-metric--sm .v-metric__value{ font-size:var(--text-2xl); }
.v-metric--lg .v-metric__value{ font-size:var(--text-5xl); }
.v-metric__value .v-metric__unit{ color:var(--accent); }
.v-metric__label{
  font-family:var(--font-mono); font-size:var(--text-2xs); font-weight:var(--fw-medium);
  letter-spacing:0.14em; text-transform:uppercase; color:var(--text-muted);
}
.v-metric__sub{ font-family:var(--font-sans); font-size:var(--text-sm); color:var(--text-body); max-width:34ch; }
`;
function inject() {
  if (typeof document === "undefined") return;
  if (document.getElementById("v-metric-css")) return;
  const s = document.createElement("style");
  s.id = "v-metric-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
inject();
function MetricStat({
  value,
  unit,
  label,
  sub,
  size = "md",
  className = "",
  ...rest
}) {
  const cls = ["v-metric", `v-metric--${size}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "v-metric__value"
  }, value, unit && /*#__PURE__*/React.createElement("span", {
    className: "v-metric__unit"
  }, unit)), label && /*#__PURE__*/React.createElement("div", {
    className: "v-metric__label"
  }, label), sub && /*#__PURE__*/React.createElement("div", {
    className: "v-metric__sub"
  }, sub));
}
Object.assign(__ds_scope, { MetricStat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/MetricStat.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.v-tag{
  display:inline-flex; align-items:center; gap:6px;
  font-family:var(--font-sans); font-size:var(--text-xs); font-weight:var(--fw-medium);
  color:var(--text-body); background:var(--surface); border:1px solid var(--border-strong);
  height:24px; padding:0 8px; border-radius:var(--radius-sm);
}
.v-tag--selected{ background:var(--accent-tint); border-color:var(--accent-ring); color:var(--accent); }
.v-tag__x{ display:inline-flex; cursor:pointer; opacity:.6; margin-right:-2px; }
.v-tag__x:hover{ opacity:1; }
.v-tag__x svg{ width:13px; height:13px; }
.v-tag__dot{ width:7px; height:7px; border-radius:2px; flex:none; }
`;
function inject() {
  if (typeof document === "undefined") return;
  if (document.getElementById("v-tag-css")) return;
  const s = document.createElement("style");
  s.id = "v-tag-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
inject();
function Tag({
  children,
  selected = false,
  color,
  onRemove,
  className = "",
  ...rest
}) {
  const cls = ["v-tag", selected ? "v-tag--selected" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), color && /*#__PURE__*/React.createElement("span", {
    className: "v-tag__dot",
    style: {
      background: color
    }
  }), children, onRemove && /*#__PURE__*/React.createElement("span", {
    className: "v-tag__x",
    role: "button",
    "aria-label": "Remove",
    onClick: onRemove
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconBadge = __ds_scope.IconBadge;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.MetricStat = __ds_scope.MetricStat;

__ds_ns.Tag = __ds_scope.Tag;

})();
