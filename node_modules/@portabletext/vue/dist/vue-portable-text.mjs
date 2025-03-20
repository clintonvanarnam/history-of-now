import { h as k, defineComponent as W, openBlock as F, createBlock as H } from "vue";
function S(e, n) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    n && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), t.push.apply(t, r);
  }
  return t;
}
function D(e) {
  for (var n = 1; n < arguments.length; n++) {
    var t = arguments[n] != null ? arguments[n] : {};
    n % 2 ? S(Object(t), !0).forEach(function(r) {
      q(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : S(Object(t)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function q(e, n, t) {
  return (n = R(n)) in e ? Object.defineProperty(e, n, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[n] = t, e;
}
function R(e) {
  var n = z(e, "string");
  return typeof n == "symbol" ? n : n + "";
}
function z(e, n) {
  if (typeof e != "object" || !e)
    return e;
  var t = e[Symbol.toPrimitive];
  if (t !== void 0) {
    var r = t.call(e, n || "default");
    if (typeof r != "object")
      return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (n === "string" ? String : Number)(e);
}
function x(e) {
  return e._type === "span" && "text" in e && typeof e.text == "string" && (typeof e.marks > "u" || Array.isArray(e.marks) && e.marks.every((n) => typeof n == "string"));
}
function P(e) {
  return (
    // A block doesn't _have_ to be named 'block' - to differentiate between
    // allowed child types and marks, one might name them differently
    typeof e._type == "string" && // Toolkit-types like nested spans are @-prefixed
    e._type[0] !== "@" && // `markDefs` isn't _required_ per say, but if it's there, it needs to be an array
    (!("markDefs" in e) || !e.markDefs || Array.isArray(e.markDefs) && // Every mark definition needs to have an `_key` to be mappable in child spans
    e.markDefs.every((n) => typeof n._key == "string")) && // `children` is required and needs to be an array
    "children" in e && Array.isArray(e.children) && // All children are objects with `_type` (usually spans, but can contain other stuff)
    e.children.every((n) => typeof n == "object" && "_type" in n)
  );
}
function A(e) {
  return P(e) && "listItem" in e && typeof e.listItem == "string" && (typeof e.level > "u" || typeof e.level == "number");
}
function E(e) {
  return e._type === "@list";
}
function N(e) {
  return e._type === "@span";
}
function U(e) {
  return e._type === "@text";
}
const B = ["strong", "em", "code", "underline", "strike-through"];
function V(e, n, t) {
  if (!x(e) || !e.marks)
    return [];
  if (!e.marks.length)
    return [];
  const r = e.marks.slice(), o = {};
  return r.forEach((i) => {
    o[i] = 1;
    for (let c = n + 1; c < t.length; c++) {
      const a = t[c];
      if (a && x(a) && Array.isArray(a.marks) && a.marks.indexOf(i) !== -1)
        o[i]++;
      else
        break;
    }
  }), r.sort((i, c) => G(o, i, c));
}
function G(e, n, t) {
  const r = e[n], o = e[t];
  if (r !== o)
    return o - r;
  const i = B.indexOf(n), c = B.indexOf(t);
  return i !== c ? i - c : n.localeCompare(t);
}
function J(e) {
  var n, t;
  const {
    children: r
  } = e, o = (n = e.markDefs) != null ? n : [];
  if (!r || !r.length)
    return [];
  const i = r.map(V), c = {
    _type: "@span",
    children: [],
    markType: "<unknown>"
  };
  let a = [c];
  for (let b = 0; b < r.length; b++) {
    const _ = r[b];
    if (!_)
      continue;
    const w = i[b] || [];
    let l = 1;
    if (a.length > 1)
      for (l; l < a.length; l++) {
        const u = ((t = a[l]) == null ? void 0 : t.markKey) || "", f = w.indexOf(u);
        if (f === -1)
          break;
        w.splice(f, 1);
      }
    a = a.slice(0, l);
    let s = a[a.length - 1];
    if (s) {
      for (const u of w) {
        const f = o == null ? void 0 : o.find((m) => m._key === u), y = f ? f._type : u, d = {
          _type: "@span",
          _key: _._key,
          children: [],
          markDef: f,
          markType: y,
          markKey: u
        };
        s.children.push(d), a.push(d), s = d;
      }
      if (x(_)) {
        const u = _.text.split(`
`);
        for (let f = u.length; f-- > 1; )
          u.splice(f, 0, `
`);
        s.children = s.children.concat(u.map((f) => ({
          _type: "@text",
          text: f
        })));
      } else
        s.children = s.children.concat(_);
    }
  }
  return c.children;
}
function Q(e, n) {
  const t = [];
  let r;
  for (let o = 0; o < e.length; o++) {
    const i = e[o];
    if (i) {
      if (!A(i)) {
        t.push(i), r = void 0;
        continue;
      }
      if (!r) {
        r = O(i, o, n), t.push(r);
        continue;
      }
      if (X(i, r)) {
        r.children.push(i);
        continue;
      }
      if ((i.level || 1) > r.level) {
        const c = O(i, o, n);
        if (n === "html") {
          const a = r.children[r.children.length - 1], b = D(D({}, a), {}, {
            children: [...a.children, c]
          });
          r.children[r.children.length - 1] = b;
        } else
          r.children.push(c);
        r = c;
        continue;
      }
      if ((i.level || 1) < r.level) {
        const c = t[t.length - 1], a = c && L(c, i);
        if (a) {
          r = a, r.children.push(i);
          continue;
        }
        r = O(i, o, n), t.push(r);
        continue;
      }
      if (i.listItem !== r.listItem) {
        const c = t[t.length - 1], a = c && L(c, {
          level: i.level || 1
        });
        if (a && a.listItem === i.listItem) {
          r = a, r.children.push(i);
          continue;
        } else {
          r = O(i, o, n), t.push(r);
          continue;
        }
      }
      console.warn("Unknown state encountered for block", i), t.push(i);
    }
  }
  return t;
}
function X(e, n) {
  return (e.level || 1) === n.level && e.listItem === n.listItem;
}
function O(e, n, t) {
  return {
    _type: "@list",
    _key: `${e._key || `${n}`}-parent`,
    mode: t,
    level: e.level || 1,
    listItem: e.listItem,
    children: [e]
  };
}
function L(e, n) {
  const t = n.level || 1, r = n.listItem || "normal", o = typeof n.listItem == "string";
  if (E(e) && (e.level || 1) === t && o && (e.listItem || "normal") === r)
    return e;
  if (!("children" in e))
    return;
  const i = e.children[e.children.length - 1];
  return i && !x(i) ? L(i, n) : void 0;
}
function K(e) {
  let n = "";
  return e.children.forEach((t) => {
    U(t) ? n += t.text : N(t) && (n += K(t));
  }), n;
}
const Y = /^\s/, Z = /\s$/;
function we(e) {
  const n = Array.isArray(e) ? e : [e];
  let t = "";
  return n.forEach((r, o) => {
    if (!P(r))
      return;
    let i = !1;
    r.children.forEach((c) => {
      x(c) ? (t += i && t && !Z.test(t) && !Y.test(c.text) ? " " : "", t += c.text, i = !1) : i = !0;
    }), o !== n.length - 1 && (t += `

`);
  }), t;
}
const ee = "html";
function te(e, n) {
  const { block: t, list: r, listItem: o, marks: i, types: c, ...a } = n;
  return {
    ...e,
    block: I(e, n, "block"),
    list: I(e, n, "list"),
    listItem: I(e, n, "listItem"),
    marks: I(e, n, "marks"),
    types: I(e, n, "types"),
    ...a
  };
}
function I(e, n, t) {
  const r = n[t], o = e[t];
  return typeof r == "function" || r && typeof o == "function" ? r : r ? {
    ...o,
    ...r
  } : o;
}
const p = (e) => (n, { slots: t }) => {
  var r;
  return k(e, (r = t.default) == null ? void 0 : r.call(t));
}, ne = ({ value: e }, { slots: n }) => {
  var t;
  return k("a", { href: e == null ? void 0 : e.href }, (t = n.default) == null ? void 0 : t.call(n));
}, re = { textDecoration: "underline" }, ie = {
  code: p("code"),
  em: p("em"),
  link: ne,
  "strike-through": p("del"),
  strong: p("strong"),
  underline: (e, { slots: n }) => {
    var t;
    return k("span", { style: re }, (t = n.default) == null ? void 0 : t.call(n));
  }
}, le = {
  number: p("ol"),
  bullet: p("ul")
}, oe = p("li"), T = (e, n) => `[@portabletext/vue] Unknown ${e}, specify a component for it in the \`components.${n}\` prop`, C = (e) => T(`block type "${e}"`, "types"), se = (e) => T(`mark type "${e}"`, "marks"), ce = (e) => T(`block style "${e}"`, "block"), ue = (e) => T(`list style "${e}"`, "list"), ae = (e) => T(`list item style "${e}"`, "listItem");
function fe(e) {
  console.warn(e);
}
const j = { display: "none" }, ye = ({
  value: e,
  isInline: n
}) => {
  const t = C(e._type);
  return n ? k("span", { style: j }, t) : k("div", { style: j }, t);
}, pe = ({ markType: e }, { slots: n }) => {
  var t;
  return k("span", { class: `unknown__pt__mark__${e}` }, (t = n.default) == null ? void 0 : t.call(n));
}, ke = p("p"), he = p("ul"), de = p("li"), me = () => k("br"), be = {
  normal: p("p"),
  blockquote: p("blockquote"),
  h1: p("h1"),
  h2: p("h2"),
  h3: p("h3"),
  h4: p("h4"),
  h5: p("h5"),
  h6: p("h6")
}, M = {
  types: {},
  block: be,
  marks: ie,
  list: le,
  listItem: oe,
  hardBreak: me,
  unknownType: ye,
  unknownMark: pe,
  unknownList: he,
  unknownListItem: de,
  unknownBlockStyle: ke
}, ve = (e, n = !1) => (t) => {
  if (n) {
    const { value: r, ...o } = t;
    return k(e, { ...o, ...r });
  }
  return k(e, { ...t.value });
}, ge = (e, n) => {
  function t(l) {
    const { node: s, index: u, isInline: f } = l, y = s._key || `node-${u}`;
    return E(s) ? i(s, u, y) : A(s) ? o(s, u, y) : N(s) ? c(s, u, y) : r(s) ? w(s, u, y, f) : P(s) ? a(s, u, y, f) : U(s) ? b(s, y) : _(s, u, y, f);
  }
  function r(l) {
    return l._type in e.types;
  }
  function o(l, s, u) {
    const f = $({ node: l, index: s, isInline: !1, renderNode: t }), y = e.listItem, m = (typeof y == "function" ? y : y[l.listItem]) || e.unknownListItem;
    if (m === e.unknownListItem) {
      const g = l.listItem || "bullet";
      n(ae(g), {
        type: g,
        nodeType: "listItemStyle"
      });
    }
    let h = f.children;
    if (l.style && l.style !== "normal") {
      const { listItem: g, ...v } = l;
      h = t({
        node: v,
        index: s,
        isInline: !1,
        renderNode: t
      });
    }
    return k(
      m,
      {
        key: u,
        value: l,
        index: s,
        isInline: !1,
        renderNode: t
      },
      () => h
    );
  }
  function i(l, s, u) {
    const f = l.children.map(
      (h, g) => t({
        node: h._key ? h : { ...h, _key: `li-${s}-${g}` },
        index: g,
        isInline: !1,
        renderNode: t
      })
    ), y = e.list, m = (typeof y == "function" ? y : y[l.listItem]) || e.unknownList;
    if (m === e.unknownList) {
      const h = l.listItem || "bullet";
      n(ue(h), {
        nodeType: "listStyle",
        type: h
      });
    }
    return k(
      m,
      {
        key: u,
        value: l,
        index: s,
        isInline: !1,
        renderNode: t
      },
      () => f
    );
  }
  function c(l, s, u) {
    const { markDef: f, markType: y, markKey: d } = l, m = e.marks[y] || e.unknownMark, h = l.children.map(
      (g, v) => t({ node: g, index: v, isInline: !0, renderNode: t })
    );
    return m === e.unknownMark && n(se(y), {
      nodeType: "mark",
      type: y
    }), k(
      m,
      {
        key: u,
        text: K(l),
        value: f,
        markType: y,
        markKey: d,
        renderNode: t
      },
      () => h
    );
  }
  function a(l, s, u, f) {
    const { _key: y, children: d, ...m } = $({
      node: l,
      index: s,
      isInline: f,
      renderNode: t
    }), h = m.node.style || "normal", v = (typeof e.block == "function" ? e.block : e.block[h]) || e.unknownBlockStyle;
    return v === e.unknownBlockStyle && n(ce(h), {
      nodeType: "blockStyle",
      type: h
    }), k(v, { key: u, ...m, value: m.node, renderNode: t }, () => d);
  }
  function b(l, s) {
    if (l.text === `
`) {
      const u = e.hardBreak;
      return u ? k(u, { key: s }) : `
`;
    }
    return l.text;
  }
  function _(l, s, u, f) {
    const y = {
      value: l,
      isInline: f,
      index: s,
      renderNode: t
    };
    n(C(l._type), {
      nodeType: "block",
      type: l._type
    });
    const d = e.unknownType;
    return k(d, { key: u, ...y });
  }
  function w(l, s, u, f) {
    const y = {
      value: l,
      isInline: f,
      index: s,
      renderNode: t
    }, d = e.types[l._type];
    return d ? k(d, { key: u, ...y }) : void 0;
  }
  return t;
};
function $(e) {
  const { node: n, index: t, isInline: r, renderNode: o } = e, c = J(n).map(
    (a, b) => o({ node: a, isInline: !0, index: b, renderNode: o })
  );
  return {
    _key: n._key || `block-${t}`,
    children: c,
    index: t,
    isInline: r,
    node: n
  };
}
const Ie = /* @__PURE__ */ W({
  __name: "vue-portable-text",
  props: {
    value: {},
    components: {},
    onMissingComponent: { type: [Function, Boolean], default: () => fe },
    listNestingMode: {}
  },
  setup(e) {
    function n() {
    }
    const t = e, r = () => {
      const o = t.onMissingComponent || n, i = Array.isArray(t.value) ? t.value : [t.value], c = Q(i, t.listNestingMode || ee), a = t.components ? te(M, t.components) : M, b = ge(a, o);
      return c.map(
        (w, l) => b({ node: w, index: l, isInline: !1, renderNode: b })
      );
    };
    return (o, i) => (F(), H(r));
  }
});
export {
  Ie as PortableText,
  M as defaultComponents,
  ve as flattenProps,
  te as mergeComponents,
  we as toPlainText
};
