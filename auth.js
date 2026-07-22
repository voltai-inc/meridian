/* ============================================================================
   Voltai toolkit — client-side auth layer (no server, no database).

   · Accounts come from two sources, merged by email:
       – SEED_ACCOUNTS   (accounts.js — read-only, bundled with the deploy)
       – sign-ups        (localStorage, per browser)
   · The current session is a single email persisted in localStorage.
   · Including this script on a page GUARDS it: signed-out visitors are sent to
     login.html. The login page sets window.__AUTH_PAGE = true to opt out.

   This is a lightweight gate for a static Vercel deploy — NOT real security.
   Passwords are only base64-obfuscated at rest, never sent anywhere.
   ============================================================================ */
(function () {
  "use strict";

  var USERS_KEY = "voltai_users";       // sign-ups saved in this browser
  var SESSION_KEY = "voltai_session";   // email of the signed-in user
  var LOGIN_PAGE = "login.html";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function hash(s) { try { return btoa(unescape(encodeURIComponent(s))); } catch (e) { return String(s); } }

  function seedAccounts() { return (typeof SEED_ACCOUNTS !== "undefined" && Array.isArray(SEED_ACCOUNTS)) ? SEED_ACCOUNTS : []; }
  function localUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch (e) { return []; } }
  function saveLocalUsers(list) { try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch (e) {} }

  // Seed accounts may carry a plaintext `password`; normalize to a `pass` hash.
  function normalize(u) {
    if (u && u.pass) return u;
    if (u && u.password != null) { var o = {}; for (var k in u) o[k] = u[k]; o.pass = hash(u.password); delete o.password; return o; }
    return u;
  }
  // All known users, local sign-ups overriding seed accounts by email.
  function allUsers() {
    var map = {};
    seedAccounts().forEach(function (u) { u = normalize(u); if (u && u.email) map[u.email.toLowerCase()] = u; });
    localUsers().forEach(function (u) { u = normalize(u); if (u && u.email) map[u.email.toLowerCase()] = u; });
    return Object.keys(map).map(function (k) { return map[k]; });
  }
  function findUser(email) {
    email = (email || "").trim().toLowerCase();
    var list = allUsers();
    for (var i = 0; i < list.length; i++) if (list[i].email.toLowerCase() === email) return list[i];
    return null;
  }

  var Auth = {
    isAuthed: function () { return !!localStorage.getItem(SESSION_KEY); },
    currentUser: function () {
      var email = localStorage.getItem(SESSION_KEY);
      if (!email) return null;
      return findUser(email) || { email: email, name: email.split("@")[0] };
    },
    signIn: function (email, password) {
      var u = findUser(email);
      if (!u) return { ok: false, error: "No account found for that email." };
      if (u.pass !== hash(password)) return { ok: false, error: "Incorrect password." };
      localStorage.setItem(SESSION_KEY, u.email);
      return { ok: true, user: u };
    },
    signUp: function (name, email, password) {
      name = (name || "").trim(); email = (email || "").trim();
      if (!name) return { ok: false, error: "Enter your name." };
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
      if ((password || "").length < 6) return { ok: false, error: "Password must be at least 6 characters." };
      if (findUser(email)) return { ok: false, error: "An account with that email already exists." };
      var user = { name: name, email: email, pass: hash(password) };
      var list = localUsers(); list.push(user); saveLocalUsers(list);
      localStorage.setItem(SESSION_KEY, email);
      return { ok: true, user: user };
    },
    signOut: function () { localStorage.removeItem(SESSION_KEY); location.href = LOGIN_PAGE; },

    // ── page guard + nav enhancement ──────────────────────────────────────
    guard: function () {
      if (window.__AUTH_PAGE) return;                 // login page opts out
      if (!this.isAuthed()) { location.replace(LOGIN_PAGE); return; }
      var self = this;
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { self.mountMenu(); });
      else this.mountMenu();
    },
    mountMenu: function () {
      var u = this.currentUser(); if (!u) return;
      var initial = (u.name || u.email || "U").trim().charAt(0).toUpperCase();
      // Sidebar layout (index / pipeline-analysis): reuse the .user footer.
      var userEl = document.querySelector("aside .user") || document.querySelector(".user");
      if (userEl) {
        userEl.innerHTML =
          '<span class="dot">' + esc(initial) + '</span>' +
          '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(u.email) + '">' + esc(u.email) + '</span>' +
          '<button type="button" onclick="Auth.signOut()" title="Sign out" style="border:none;background:none;color:inherit;cursor:pointer;font-size:12px;text-decoration:underline;padding:0">Sign out</button>';
        userEl.style.display = "flex"; userEl.style.alignItems = "center"; userEl.style.gap = "9px";
        return;
      }
      // Top-nav layout (site-selection / site-intelligence / power-signoff / procurement).
      var topnav = document.querySelector("nav.top") || document.querySelector("nav");
      if (topnav) {
        var wrap = document.createElement("span");
        wrap.style.cssText = "display:inline-flex;align-items:center;gap:9px;margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#5b646e";
        wrap.innerHTML =
          '<span title="' + esc(u.email) + '" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(u.email) + '</span>' +
          '<button type="button" onclick="Auth.signOut()" style="cursor:pointer;font-size:11px;color:#5b646e;background:#fff;border:1px solid #d2dae2;border-radius:5px;padding:5px 10px;font-family:inherit">Sign out</button>';
        topnav.appendChild(wrap);
      }
    }
  };

  window.Auth = Auth;
  Auth.guard();
})();
