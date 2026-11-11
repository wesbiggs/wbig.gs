/*
 * A tiny C64 BASIC V2-flavored machine for the boot screen.
 * Not an emulator (real ones need Commodore's ROMs) -- an improvised interpreter
 * that knows enough to LOAD"WES",8,1 and RUN, plus the classics:
 *   PRINT ? GOTO GOSUB RETURN IF..THEN FOR..NEXT LET END STOP REM
 *   POKE (53280 border, 53281 background, 646 text) SYS (2061 run, 64738 reset)
 *   LIST RUN NEW CLR LOAD"$",8
 * Esc acts as RUN/STOP.
 */
window.C64 = (() => {
  "use strict";
  const COLS = 40, ROWS = 25;
  const PAL = ["#000000", "#ffffff", "#68372b", "#70a4b2", "#6f3d86", "#588d43", "#352879", "#b8c76f",
    "#6f4f25", "#433900", "#9a6759", "#444444", "#6c6c6c", "#9ad284", "#6c5eb5", "#959595"];
  const FILES = ["WBIG.GS", "WBIGGS", "WES"];
  const DIRECTORY = [
    [0, '"WBIG.GS PORTAL  " WB 2A'],
    [1, '   "WES"              PRG'],
    [7, '   "WBIGGS"           PRG'],
    [33, '  "WBIG.GS"          PRG'],
    [664, "BLOCKS FREE."],
  ];
  const BANNER = ["", "  **** WBIG.GS 64 PORTAL BASIC V2 ****", "", " 64K RAM SYSTEM  38911 IDEAS FREE", ""];
  const LOADER = new Map([[10, "SYS2061"]]);

  class BErr extends Error {}
  const SYN = () => new BErr("SYNTAX");
  const TM = () => new BErr("TYPE MISMATCH");
  const END = 1, BREAK = 2, LAUNCH = 3, RESET = 4;

  const fmtNum = (n) => {
    if (!Number.isFinite(n)) throw new BErr("OVERFLOW");
    let t = String(Number(n.toPrecision(9))).toUpperCase().replace(/^(-?)0\./, "$1.");
    return (n >= 0 ? " " : "") + t;
  };
  const petscii = (n) => (n === 147 ? "\f" : n === 13 ? "\n" : n >= 32 && n < 127 ? String.fromCharCode(n).toUpperCase() : "");

  function splitStmts(t) {
    const out = [];
    let cur = "", q = false;
    for (const c of t) {
      if (c === '"') q = !q;
      if (c === ":" && !q && !/^\s*REM/.test(cur)) { out.push(cur); cur = ""; } else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim()).filter(Boolean);
  }

  function create({ screen, crt, input, form, onLaunch, onHint }) {
    let lines = [""];
    let program = new Map();
    let vars = {};
    let run = null;
    let timer = 0;
    let dead = false;
    const hint = (h) => onHint && onHint(h);

    /* ── screen ── */
    const wrap = (l) => { const o = []; for (let i = 0; i < l.length; i += COLS) o.push(l.slice(i, i + COLS)); return o.length ? o : [""]; };
    const escH = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const buffer = () => normalize(input.value);
    function normalize(v) { return v.replace(/[“”„″]/g, '"').replace(/[‘’]/g, "'").toUpperCase(); }
    function render() {
      if (dead) return;
      const rows = [];
      lines.slice(0, -1).forEach((l) => rows.push(...wrap(l)));
      const prompt = !run;
      const last = lines[lines.length - 1] + (prompt ? buffer() : "");
      const lastRows = wrap(last);
      if (prompt && last.length && last.length % COLS === 0) lastRows.push("");
      rows.push(...lastRows);
      const vis = rows.slice(-ROWS).map(escH);
      if (prompt) vis[vis.length - 1] += '<span class="cur"></span>';
      screen.innerHTML = vis.join("\n");
    }
    function print(s) {
      for (const ch of String(s)) {
        if (ch === "\f") lines = [""];
        else if (ch === "\n") lines.push("");
        else lines[lines.length - 1] += ch;
      }
      if (lines.length > 200) lines = lines.slice(-100);
    }
    const println = (s = "") => print(s + "\n");
    const fresh = () => { if (lines[lines.length - 1] !== "") print("\n"); };
    const ready = () => { fresh(); println("READY."); };
    const col = () => lines[lines.length - 1].length % COLS;

    function poke(a, v) {
      v = Math.floor(v) & 255;
      if (a === 53280) crt.style.background = PAL[v & 15];
      else if (a === 53281) screen.parentElement.style.background = PAL[v & 15];
      else if (a === 646) screen.parentElement.style.color = PAL[v & 15];
    }

    function reset() {
      crt.style.background = ""; screen.parentElement.style.background = ""; screen.parentElement.style.color = "";
      program = new Map(); vars = {}; lines = [""];
      BANNER.forEach((l) => println(l));
      println("READY.");
    }

    /* ── expressions ── */
    const FNS = [
      ["CHR$", (a) => petscii(num(a))], ["STR$", (a) => fmtNum(num(a))], ["VAL", (a) => parseFloat(str(a)) || 0],
      ["ASC", (a) => (str(a).charCodeAt(0) || 0)], ["LEN", (a) => str(a).length], ["RND", () => Math.random()],
      ["INT", (a) => Math.floor(num(a))], ["ABS", (a) => Math.abs(num(a))], ["SQR", (a) => Math.sqrt(num(a))],
      ["SIN", (a) => Math.sin(num(a))], ["COS", (a) => Math.cos(num(a))], ["SGN", (a) => Math.sign(num(a))],
    ];
    function num(a) { if (typeof a !== "number") throw TM(); return a; }
    function str(a) { if (typeof a !== "string") throw TM(); return a; }

    function evaluate(s) {
      let i = 0;
      const ws = () => { while (s[i] === " ") i++; };
      const peek = (t) => { ws(); return s.startsWith(t, i); };
      const eat = (t) => (peek(t) ? ((i += t.length), true) : false);
      const expr = () => { let a = andE(); while (eat("OR")) a = num(a) | num(andE()); return a; };
      const andE = () => { let a = cmp(); while (eat("AND")) a = num(a) & num(cmp()); return a; };
      function cmp() {
        let a = add();
        for (;;) {
          const op = ["<=", ">=", "<>", "=", "<", ">"].find(peek);
          if (!op) return a;
          i += op.length;
          const b = add();
          if (typeof a !== typeof b) throw TM();
          a = { "=": a === b, "<>": a !== b, "<": a < b, ">": a > b, "<=": a <= b, ">=": a >= b }[op] ? -1 : 0;
        }
      }
      function add() {
        let a = mul();
        for (;;) {
          if (eat("+")) { const b = mul(); if (typeof a !== typeof b) throw TM(); a = a + b; }
          else if (eat("-")) a = num(a) - num(mul());
          else return a;
        }
      }
      function mul() {
        let a = pow();
        for (;;) {
          if (eat("*")) a = num(a) * num(pow());
          else if (eat("/")) { const b = num(pow()); if (b === 0) throw new BErr("DIVISION BY ZERO"); a = num(a) / b; }
          else return a;
        }
      }
      const pow = () => { let a = unary(); while (eat("^")) a = Math.pow(num(a), num(unary())); return a; };
      const unary = () => (eat("-") ? -num(unary()) : eat("+") ? unary() : eat("NOT") ? ~num(unary()) : atom());
      function atom() {
        ws();
        if (s[i] === '"') {
          const j = s.indexOf('"', i + 1);
          const v = s.slice(i + 1, j < 0 ? s.length : j);
          i = j < 0 ? s.length : j + 1;
          return v;
        }
        const m = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/.exec(s.slice(i));
        if (m) { i += m[0].length; return parseFloat(m[0]); }
        if (eat("(")) { const v = expr(); if (!eat(")")) throw SYN(); return v; }
        for (const [name, fn] of FNS) {
          if (peek(name + "(")) { i += name.length + 1; const v = fn(expr()); if (!eat(")")) throw SYN(); return v; }
        }
        if (eat("TI$")) return new Date().toTimeString().slice(0, 8).replace(/:/g, "");
        const v = /^[A-Z][A-Z0-9]*\$?/.exec(s.slice(i));
        if (v) { i += v[0].length; return v[0] in vars ? vars[v[0]] : v[0].endsWith("$") ? "" : 0; }
        throw SYN();
      }
      const v = expr();
      ws();
      if (i < s.length) throw SYN();
      return v;
    }

    /* splits "A;B,C" at top level, keeping separators */
    function printItems(s) {
      const items = [];
      let cur = "", q = false, d = 0;
      for (const c of s) {
        if (c === '"') q = !q;
        if (!q && c === "(") d++;
        if (!q && c === ")") d--;
        if (!q && !d && (c === ";" || c === ",")) { items.push([cur, c]); cur = ""; } else cur += c;
      }
      items.push([cur, ""]);
      return items;
    }

    /* ── program control ── */
    const compileProgram = () => [...program.keys()].sort((a, b) => a - b).map((n) => ({ num: n, stmts: splitStmts(program.get(n)) }));
    function jumpTo(n) {
      if (!run.isProg) { run.code = compileProgram(); run.isProg = true; }
      const idx = run.code.findIndex((l) => l.num === n);
      if (idx < 0) throw new BErr("UNDEF'D STATEMENT");
      run.li = idx; run.si = 0;
    }
    function list() {
      [...program.keys()].sort((a, b) => a - b).forEach((n) => println(n + " " + program.get(n)));
    }
    function match(pattern, name) {
      const re = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\?/g, ".").replace(/\*.*$/, ".*") + "$");
      return re.test(name);
    }

    function load(rest) {
      const m = /^\s*(?:"([^"]*)"?)?\s*(?:,\s*(\d+))?\s*(?:,\s*(\d+))?\s*$/.exec(rest);
      if (!m) throw SYN();
      const name = (m[1] || "").trim(), dev = m[2] ? +m[2] : 1;
      if (dev === 1) {
        run.queue.push(() => println(""), () => println("PRESS PLAY ON TAPE"), 1600,
          () => println("?DEVICE NOT PRESENT  ERROR"),
          () => hint('No tape drive here. Add <kbd>,8</kbd> for the disk drive: <kbd>LOAD"WES",8,1</kbd>'));
        return;
      }
      if (dev !== 8) throw new BErr("DEVICE NOT PRESENT");
      if (!name) throw new BErr("MISSING FILE NAME");
      run.queue.push(() => println(""), () => println("SEARCHING FOR " + name), 700);
      if (name === "$") {
        run.queue.push(() => println("LOADING"), 400, () => { program = new Map(DIRECTORY); hint("Type <kbd>LIST</kbd> to see the directory."); });
      } else if (FILES.some((f) => match(name, f))) {
        run.queue.push(() => println("LOADING"), 1000, () => { program = new Map(LOADER); vars = {}; hint("Loaded. Now type <kbd>RUN</kbd>."); });
      } else {
        run.queue.push(() => println("?FILE NOT FOUND  ERROR"),
          () => hint('Try <kbd>"WES"</kbd>, <kbd>"WBIGGS"</kbd>, <kbd>"WBIG.GS"</kbd> or <kbd>"*"</kbd>, or <kbd>LOAD"$",8</kbd> for the directory.'));
      }
    }

    function exec(stmt, line) {
      const kw = (k) => stmt.startsWith(k) ? ((stmt = stmt.slice(k.length).trim()), true) : false;
      if (kw("REM")) return;
      if (kw("PRINT") || kw("?")) {
        for (const [e, s] of printItems(stmt)) {
          if (e.trim()) {
            const v = evaluate(e.trim());
            print(typeof v === "number" ? fmtNum(v) + " " : v);
          }
          if (s === ",") print(" ".repeat(10 - (col() % 10)));
        }
        if (!/[;,]\s*$/.test(stmt)) print("\n");
        return;
      }
      if (kw("GOTO")) return jumpTo(num(evaluate(stmt)));
      if (kw("GOSUB")) {
        run.subs.push({ code: run.code, isProg: run.isProg, li: run.li, si: run.si });
        return jumpTo(num(evaluate(stmt)));
      }
      if (kw("RETURN")) {
        const r = run.subs.pop();
        if (!r) throw new BErr("RETURN WITHOUT GOSUB");
        Object.assign(run, r);
        return;
      }
      if (kw("IF")) {
        const m = /^(.*?)THEN(.*)$/.exec(stmt) || /^(.*?)(GOTO.*)$/.exec(stmt);
        if (!m) throw SYN();
        if (!num(evaluate(m[1].trim()))) { run.li++; run.si = 0; return; }
        const then = m[2].trim();
        if (/^\d+$/.test(then)) return jumpTo(+then);
        return then ? exec(then, line) : undefined;
      }
      if (kw("FOR")) {
        const m = /^([A-Z][A-Z0-9]*)\s*=(.*?)TO(.*?)(?:STEP(.*))?$/.exec(stmt);
        if (!m) throw SYN();
        vars[m[1]] = num(evaluate(m[2].trim()));
        run.fors = run.fors.filter((f) => f.v !== m[1]);
        run.fors.push({ v: m[1], end: num(evaluate(m[3].trim())), step: m[4] ? num(evaluate(m[4].trim())) : 1, li: run.li, si: run.si, code: run.code, isProg: run.isProg });
        return;
      }
      if (kw("NEXT")) {
        const v = stmt.split(",")[0].trim();
        let k = run.fors.length - 1;
        if (v) while (k >= 0 && run.fors[k].v !== v) k--;
        if (k < 0) throw new BErr("NEXT WITHOUT FOR");
        const f = run.fors[k];
        run.fors.length = k + 1;
        vars[f.v] += f.step;
        if (f.step >= 0 ? vars[f.v] <= f.end : vars[f.v] >= f.end) { run.code = f.code; run.isProg = f.isProg; run.li = f.li; run.si = f.si; }
        else run.fors.pop();
        return;
      }
      if (kw("END")) return END;
      if (kw("STOP")) return BREAK;
      if (kw("POKE")) {
        const [a, v] = printItems(stmt).map(([e]) => num(evaluate(e.trim())));
        if (v === undefined) throw SYN();
        return poke(a, v);
      }
      if (kw("SYS")) {
        const a = num(evaluate(stmt));
        if (a === 64738) return RESET;
        if (a === 2061) return LAUNCH;
        return;
      }
      if (kw("LIST")) return list();
      if (kw("NEW")) { program = new Map(); vars = {}; return END; }
      if (kw("CLR")) { vars = {}; return; }
      if (kw("RUN")) {
        vars = {}; run.fors = []; run.subs = [];
        run.code = compileProgram(); run.isProg = true; run.li = 0; run.si = 0;
        if (stmt) jumpTo(num(evaluate(stmt)));
        return;
      }
      if (kw("LOAD")) return load(stmt);
      kw("LET");
      const a = /^([A-Z][A-Z0-9]*\$?)\s*=(.*)$/.exec(stmt);
      if (a) {
        const v = evaluate(a[2].trim());
        if (a[1].endsWith("$") !== (typeof v === "string")) throw TM();
        vars[a[1]] = v;
        return;
      }
      throw SYN();
    }

    function finish() { if (run && run.hinted) hint(null); run = null; ready(); render(); }

    function pump() {
      if (dead || !run) return;
      let budget = 40;
      while (run && budget-- > 0) {
        if (run.brk) { fresh(); const n = run.code[run.li]?.num; println("BREAK" + (run.isProg && n != null ? " IN " + n : "")); return finish(); }
        if (run.queue.length) {
          const q = run.queue.shift();
          if (typeof q === "number") { render(); timer = setTimeout(pump, q); return; }
          q();
          continue;
        }
        const line = run.code[run.li];
        if (!line) return finish();
        if (run.si >= line.stmts.length) { run.li++; run.si = 0; continue; }
        const stmt = line.stmts[run.si++];
        try {
          const r = exec(stmt, line);
          if (r === END) return finish();
          if (r === BREAK) { run.brk = true; continue; }
          if (r === RESET) { run = null; reset(); render(); return; }
          if (r === LAUNCH) { run = null; render(); onLaunch(); return; }
        } catch (e) {
          if (!(e instanceof BErr)) throw e;
          fresh();
          println("?" + e.message + "  ERROR" + (line.num != null && run.isProg ? " IN " + line.num : ""));
          return finish();
        }
      }
      render();
      timer = setTimeout(pump, 16);
    }

    function enter(text) {
      text = normalize(text);
      print(text + "\n");
      const t = text.trim();
      if (!t) return render();
      const m = /^(\d+)\s*(.*)$/.exec(t);
      if (m) {
        if (m[2]) program.set(+m[1], m[2]); else program.delete(+m[1]);
        return render();
      }
      run = { code: [{ num: null, stmts: splitStmts(t) }], isProg: false, li: 0, si: 0, fors: [], subs: [], queue: [] };
      const isLoader = program.size === 1 && program.get(10) === "SYS2061";
      if (/^(RUN|GOTO)/.test(t) && program.size && !isLoader) { run.hinted = true; hint("Running. Press <kbd>Esc</kbd> (RUN/STOP) or Return to break."); }
      pump();
    }

    /* ── input ── */
    function onSubmit(e) {
      e.preventDefault();
      if (run) { run.brk = true; return; }
      const v = input.value;
      input.value = "";
      enter(v);
    }
    function onKey(e) { if (e.key === "Escape" && run) { e.preventDefault(); run.brk = true; } }
    form.addEventListener("submit", onSubmit);
    input.addEventListener("input", render);
    input.addEventListener("keydown", onKey);

    reset();
    render();

    return {
      busy: () => !!run,
      render,
      type(ch) { input.value += ch; render(); },
      submit() { onSubmit(new Event("submit")); },
      destroy() {
        dead = true; clearTimeout(timer);
        form.removeEventListener("submit", onSubmit);
        input.removeEventListener("input", render);
        input.removeEventListener("keydown", onKey);
        input.value = "";
      },
    };
  }

  return { create };
})();
