// Commit history of the GitHub repo in the focused terminal, as a timeline.
// Key: cmd-shift-g -> mod.open:github-timeline (keys.json).
import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { closeOverlay, exec, focused, panes, props, spaces, theme } from "herdr";

// gh api hands back the commits; the jq keeps only what the rows draw.
const JQ = `[.[] | {sha: .sha[0:7], msg: (.commit.message | split("\\n")[0]), author: .commit.author.name, date: .commit.author.date, login: .author.login, url: .html_url}]`;

// The focused pane's folder and machine, as the Issues panel finds them.
function location() {
  const f = focused();
  const space = spaces().find((s) => s.id === f?.space) ?? spaces().find((s) => s.active);
  const pane = f?.pane ? panes().find((p) => p.pane === f.pane) : null;
  const on = f?.pane === null ? (f.terminal?.includes("/") ? f.terminal.split("/")[0] : null) : space?.machine ?? null;
  return { cwd: pane?.cwd || f?.cwd || space?.folder || null, on };
}

// "41 minutes ago", as the Issues panel reads.
function ago(iso) {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) { const m = Math.round(s / 60); return `${m} minute${m === 1 ? "" : "s"} ago`; }
  if (s < 86400) { const h = Math.round(s / 3600); return `${h} hour${h === 1 ? "" : "s"} ago`; }
  const d = Math.floor(s / 86400);
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  const m = Math.floor(d / 30);
  return m < 12 ? `${m} month${m === 1 ? "" : "s"} ago` : `${Math.floor(m / 12)}y ago`;
}

function dayLabel(d) {
  if (isNaN(d)) return "Unknown date";
  const today = new Date(), yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric",
    ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}) });
}

// Newest first, split into calendar days.
function group(commits) {
  const out = [];
  for (const c of commits) {
    const d = new Date(c.date);
    const key = isNaN(d) ? "unknown" : d.toDateString();
    const last = out[out.length - 1];
    if (!last || last.key !== key) out.push({ key, label: dayLabel(d), commits: [c] });
    else last.commits.push(c);
  }
  return out;
}

export default class GithubTimeline extends View {
  init(_props, cx) {
    this.overlay = props()?.overlay;
    this.handle = cx.focus_handle();
    this.repo = null;
    this.commits = [];
    this.loading = true;
    this.error = null;
    this.load(cx);
  }

  key(e, cx) {
    if (e.key === "escape") { closeOverlay(this.overlay); cx.stop_propagation(); }
  }

  load(cx) {
    this.loading = true;
    this.error = null;
    const { cwd, on } = location();
    cx.spawn(async (cx) => {
      try {
        if (!this.repo && cwd) {
          const r = await exec("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"], { cwd, on }).catch(() => null);
          if (r?.code === 0) this.repo = r.stdout.trim();
        }
        if (!this.repo) { this.error = "No GitHub repo detected for the focused terminal. Focus a terminal inside a GitHub repository and press Super+Shift+G again."; return; }
        const r = await exec("gh", ["api", `repos/${this.repo}/commits?per_page=60`, "-q", JQ], { on }).catch(() => null);
        if (r?.code !== 0) throw new Error((r?.stderr || r?.stdout || "gh api failed").trim());
        const commits = JSON.parse(r.stdout);
        this.commits = Array.isArray(commits) ? commits : [];
      } catch (e) {
        this.error = String(e?.message ?? e);
      } finally {
        this.loading = false;
        cx.notify();
      }
    });
  }

  refresh(cx) {
    this.repo = null;
    this.commits = [];
    this.load(cx);
    cx.notify();
  }

  open(url) {
    if (url) exec("xdg-open", [url]).catch(() => {});
  }

  btn(id, label, t, onClick) {
    return h_flex().id(id).h(30).px(10).gap(6).flex_none().items_center().rounded(7)
      .border_1().border_color(t.border).text_size(12).text_color(t.muted).cursor_pointer()
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => { cx.stop_propagation(); onClick(cx); })
      .child(label);
  }

  header(t) {
    return h_flex().px(18).pt(14).pb(12).gap(10).items_center().border_b(1).border_color(t.border)
      .child(v_flex().flex_1().min_w(0).gap(2)
        .child(div().text_size(15).font_semibold().truncate().child(this.repo ?? "GitHub timeline"))
        .child(div().text_size(11).text_color(t.dim).child(this.repo ? "Recent commits" : "Commit history of the focused terminal's repo")))
      .when(Boolean(this.repo), (e) => e
        .child(this.btn("gh-open", "Open on GitHub", t, () => this.open(`https://github.com/${this.repo}`))))
      .child(this.btn("gh-refresh", "Refresh", t, (cx2) => this.refresh(cx2)))
      .child(div().id("gh-close").size(30).flex_none().flex().items_center().justify_center().rounded(7)
        .text_size(14).text_color(t.muted).cursor_pointer()
        .hover((s) => s.bg(t.hover).text_color(t.foreground))
        .on_click(() => closeOverlay(this.overlay)).child("✕"));
  }

  note(t, text) {
    return v_flex().flex_1().items_center().justify_center().px(24)
      .child(div().text_size(12).text_color(t.muted).text_center().child(text));
  }

  commit(c, t) {
    const who = c.login ? `${c.author ?? c.login} (@${c.login})` : c.author ?? "unknown";
    return h_flex().id(`c-${c.sha}`).gap(10).items_start().rounded(8).px(6).py(6)
      .cursor_pointer().hover((s) => s.bg(t.hover))
      .on_click(() => this.open(c.url))
      // The rail: a dot for this commit, then a line down to the next one.
      .child(v_flex().w(12).flex_none().items_center().pt(4)
        .child(div().size(7).rounded(4).bg(t.accent))
        .child(div().w(1).h(26).bg(t.border)))
      .child(v_flex().flex_1().min_w(0).gap(3)
        .child(h_flex().gap(8).items_center().min_w(0)
          .child(div().flex_none().px(6).py(2).rounded(5).bg(t.raised).text_size(11).text_color(t.muted).child(c.sha))
          .child(div().flex_1().min_w(0).truncate().text_size(13).child(c.msg || "(no message)")))
        .child(h_flex().gap(6).items_center().text_size(11).text_color(t.dim)
          .child(div().truncate().child(who))
          .child(div().flex_none().child("·"))
          .child(div().flex_none().child(ago(c.date)))));
  }

  body(t) {
    if (this.loading && !this.commits.length) return this.note(t, "Loading commits…");
    if (this.error) return v_flex().flex_1().items_center().justify_center().gap(8).px(24)
      .child(div().font_semibold().text_color(t.muted).child("No commits to show"))
      .child(div().text_size(12).text_color(t.dim).text_center().child(this.error));
    if (!this.commits.length) return this.note(t, "No commits on this repository's default branch.");
    return v_flex().id("gh-commits").flex_1().min_h(0).overflow_y_scrollbar().px(18).py(10)
      .children(group(this.commits).flatMap((g) => [
        h_flex().pt(10).pb(4).gap(8).items_center()
          .child(div().text_size(11).font_semibold().text_color(t.dim).child(g.label.toUpperCase()))
          .child(div().h(1).flex_1().bg(t.border)),
        ...g.commits.map((c) => this.commit(c, t)),
      ]));
  }

  render() {
    const t = theme();
    return v_flex().id("gh-timeline").size_full().track_focus(this.handle)
      .on_key_down((e, cx) => this.key(e, cx))
      .rounded(12).overflow_hidden().bg(t.background).border_1().border_color(t.border)
      .text_color(t.foreground).text_size(13)
      .child(this.header(t))
      .child(this.body(t));
  }
}
