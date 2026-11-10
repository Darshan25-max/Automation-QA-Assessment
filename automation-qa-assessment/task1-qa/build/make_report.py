import base64, html, pathlib
SH = pathlib.Path(__file__).resolve().parent.parent / "screenshots"
def img(name, cap, w="100%"):
    b = base64.b64encode((SH / name).read_bytes()).decode()
    return f'<figure><img src="data:image/png;base64,{b}" style="max-width:{w}"><figcaption>{html.escape(cap)} <i>({name})</i></figcaption></figure>'

BUGS = [
 dict(id="BUG-01", sev="Critical", title="Saving the Settings page silently overwrites the user's password; an EMPTY password then logs in",
  area="Settings / Auth",
  steps=["Open <code>http://localhost:3000/#/register</code> and create user <code>carol</code> / <code>carol@example.com</code> / <code>Passw0rd!</code>.",
         "Open Settings (<code>#/settings</code>). Change only the Bio field. Leave the Password field blank. Click <b>Update Settings</b>.",
         "Log out. Try to log in with <code>Passw0rd!</code> (the original password).",
         "Send <code>POST /api/users/login</code> with <code>{\"user\":{\"email\":\"carol@example.com\",\"password\":\"\"}}</code> (the UI login form blocks passwords shorter than 5 characters, so use curl/Postman)."],
  exp="Password is unchanged when the Password field is left blank. Original password still works; an empty password is rejected.",
  act="HTTP 200 on save. Afterwards the original password returns 422 &quot;Wrong email/password combination&quot; (user locked out) and an <b>empty</b> password returns 200 with a valid token (anyone who knows the email can sign in).",
  cause="<code>backend/controllers/user.js</code> uses <code>if (password !== undefined || password !== \"\")</code>. This condition is always true, so a blank password from the Settings form is bcrypt-hashed and stored. The condition should use <code>&amp;&amp;</code>.",
  shots=[("29_settings_bio_only.png","Only the Bio is changed, Password left blank"),("40_evidence_password_overwrite.png","Live API evidence: original password rejected, empty password accepted after the save")]),
 dict(id="BUG-02", sev="High", title="Changing the e-mail address breaks the session: every later action fails with &quot;User not found&quot;",
  area="Settings / Session",
  steps=["Register and log in as any user.","Open Settings, change the Email to a new unique address, click <b>Update Settings</b> (succeeds).","Without logging out, change the Bio and save again; then try to publish a new article."],
  exp="Both later actions succeed (or the app issues a fresh token for the new e-mail).",
  act="The 2nd Settings save returns 404 &quot;User not found&quot; and the Settings page shows <b>no error at all</b> (the edit is silently lost); publishing an article fails with the same red error and the form is not submitted. The navbar still shows the user as logged in. Only logout + login fixes it.",
  cause="The JWT identifies the user by e-mail and the backend looks the user up by the e-mail inside the token (<code>middleware/verifyToken.js</code>). The update endpoint returns the <i>old</i> token after changing the e-mail, so the next request looks up an e-mail that no longer exists.",
  shots=[("27_settings_after_email_change.png","Settings page after the 2nd save: bio shows as saved but no error is displayed (API returned 404)"),("28_publish_after_email_change.png","Publishing an article after the e-mail change")]),
 dict(id="BUG-03", sev="High", title="Duplicate usernames are accepted (sign-up and Settings)",
  area="Sign-up / Settings",
  steps=["Register <code>qa_alice</code> with <code>alice@example.com</code>.","Log out. Register again with username <code>qa_alice</code> and a different e-mail <code>alice2@example.com</code>.","(Optional) In Settings of another user, change the username to an existing one and save."],
  exp="Second sign-up is rejected (&quot;username already taken&quot;), as the RealWorld spec requires unique usernames.",
  act="Second account is created (HTTP 201) and the user is logged in. Two users now share one username, which is the key used in profile URLs (<code>#/profile/&lt;username&gt;</code>) and author links. Settings also accepts renaming to an existing username (HTTP 200).",
  cause="<code>controllers/users.js</code> only checks for an existing <i>e-mail</i>; the <code>User</code> model has no <code>unique</code> constraint on <code>username</code>.",
  shots=[("07_signup_duplicate_username.png","Duplicate username: sign-up succeeded and redirected to home"),("41_evidence_duplicate_accounts.png","Live API/DB evidence")]),
 dict(id="BUG-04", sev="High", title="Duplicate e-mails accepted via Settings and via different letter case at sign-up",
  area="Settings / Sign-up",
  steps=["Create users <code>alice@example.com</code> and <code>bob@example.com</code>.","Log in as alice, open Settings, set Email to <code>bob@example.com</code>, save.","Also try signing up with <code>ALICE@EXAMPLE.COM</code>."],
  exp="Both are rejected with an &quot;e-mail already exists&quot; error.",
  act="Settings returns 200 and the database now has two users with <code>bob@example.com</code>; a login for that e-mail returned only one of them (<code>bob</code>). <code>ALICE@EXAMPLE.COM</code> sign-up returns 201 (second account for the same mailbox).",
  cause="Uniqueness is checked only at sign-up with a case-sensitive exact match; <code>updateUser</code> has no check at all and the column has no unique index.",
  shots=[("26_settings_email_taken_by_other_user.png","Settings accepted an e-mail already used by another account"),("41_evidence_duplicate_accounts.png","DB rows showing the duplicates")]),
 dict(id="BUG-05", sev="Medium", title="Weak passwords accepted at sign-up; sign-up and login rules disagree, so the account cannot log in through the UI",
  area="Sign-up / Login validation",
  steps=["Open <code>#/register</code>, sign up with password <code>abc</code> (or a single character).","Log out, open <code>#/login</code>, enter the same e-mail and <code>abc</code>, click Login."],
  exp="Either sign-up rejects the weak password, or login accepts whatever sign-up accepted.",
  act="Sign-up succeeds with a 1-character password. The login form shows the browser message &quot;Please lengthen this text to 5 characters or more&quot; and sends no request, so the user can never sign in from the UI (the API accepts the same credentials with 200).",
  cause="The login input has <code>minlength=5</code> but the sign-up input and the backend have no length or strength rule.",
  shots=[("08_signup_one_char_password.png","Sign-up accepted a 1-character password"),("08b_short_password_cannot_login.png","Login form blocks the same password")]),
 dict(id="BUG-06", sev="Medium", title="Whitespace-only input accepted; an article with an empty slug is created and cannot be opened, edited or deleted",
  area="Create article / Sign-up",
  steps=["Log in. Open <code>#/editor</code>.","Type three spaces in Title, Description and Body. Click <b>Publish Article</b>.","Open Global Feed and click the blank entry."],
  exp="Validation error (&quot;title can't be blank&quot;). No article is created.",
  act="HTTP 201 and the app navigates to <code>#/article/</code> which shows &quot;404 Not Found&quot;. A blank entry stays in the Global Feed; its link is <code>#/article/</code>, and PUT/DELETE on <code>/api/articles/</code> return 404, so the author cannot remove it from the UI. Sign-up also accepts a whitespace-only username (HTTP 201).",
  cause="The browser <code>required</code> attribute and the server check (<code>!username</code>) only reject empty strings, not whitespace. <code>slugify()</code> trims the title, producing the slug <code>\"\"</code>.",
  shots=[("12a_whitespace_only_form.png","Whitespace-only form"),("12_article_whitespace_only.png","Result of Publish: 404 page"),("35_home_feed_blank_article.png","Blank entry in Global Feed")]),
 dict(id="BUG-07", sev="Medium", title="Over-long input and malformed requests return HTTP 500 and expose internal error text",
  area="Error handling",
  steps=["Sign up with a 300-character username (UI: <code>#/register</code>), or publish an article with a 300-character title.","API: <code>GET /api/articles?limit=-1</code>, <code>?limit=abc</code>, <code>GET /api/user</code> with header <code>Authorization: Token garbage</code>, and <code>POST /api/users/login</code> with body <code>{bad json</code>."],
  exp="4xx responses (400/401/422) with a user-friendly message such as &quot;Username must be at most 50 characters&quot;.",
  act="All return HTTP 500. The UI prints raw database text: <i>value too long for type character varying(255)</i>. Other responses leak internals: <i>column &quot;nan&quot; does not exist</i>, <i>jwt malformed</i>, <i>LIMIT must not be negative</i>.",
  cause="No input-length or query-parameter validation; <code>middleware/errorHandler.js</code> turns every unknown exception into 500 and returns <code>error.message</code> to the client.",
  shots=[("09_signup_long_username.png","UI shows raw DB error for a 300-character username"),("42_evidence_http_500_errors.png","API calls that return 500")]),
 dict(id="BUG-08", sev="Medium", title="Tags with 1-2 characters (e.g. &quot;qa&quot;, &quot;js&quot;) are silently dropped",
  area="Create/Edit article",
  steps=["Open <code>#/editor</code>, fill the form, type tags <code>react qa</code> (or <code>js</code>), click Publish.","Look at the tags on the article page / reload it."],
  exp="All entered tags are stored, or the user is told a tag is invalid.",
  act="Only <code>react</code> is shown; <code>qa</code> is gone with no message. Via API the create response still lists <code>[\"qa\",\"js\",\"react\",\"ab\"]</code> but a later GET returns only <code>[\"react\"]</code>, so the API response does not match what was saved.",
  cause="<code>controllers/articles.js</code> creates a new tag only when <code>tag.length &gt; 2</code> (checked before <code>trim()</code>), and the response echoes the request's <code>tagList</code> instead of what was stored.",
  shots=[("10_editor_filled.png","Tags typed in the editor"),("11_article_created.png","Article page: only 'react' remains"),("43_evidence_tags_dropped.png","API: create response vs stored tags")]),
 dict(id="BUG-09", sev="Low", title="Non-Latin titles produce meaningless slugs and false &quot;Title already exists&quot; errors",
  area="Create article",
  steps=["Publish an article titled <code>東京ニュース</code>.","Publish another article titled <code>大阪グルメ記</code>."],
  exp="Both articles are created with distinct, readable URLs.",
  act="The first gets the URL <code>#/article/------</code>. The second, a different title of the same length, is rejected with &quot;Title already exists..&quot;. Titles such as <code>Español: ¿Qué tal?</code> become <code>espa-ol---qu--tal-</code>.",
  cause="<code>helpers.js</code> slugify is <code>trim().toLowerCase().replace(/\\W|_/g, \"-\")</code>; <code>\\W</code> matches every non-ASCII character, and uniqueness is enforced on the slug rather than a separate unique id.",
  shots=[("36a_japanese_title_slug_dashes.png","First Japanese title: URL is only dashes"),("36_unicode_title_collision.png","Second, different title is rejected")]),
 dict(id="BUG-10", sev="Low", title="Login errors reveal whether an e-mail is registered (account enumeration)",
  area="Login / Security",
  steps=["On <code>#/login</code> enter a registered e-mail with a wrong password (6+ characters).","Repeat with an unregistered e-mail."],
  exp="Same generic message in both cases, e.g. &quot;Invalid e-mail or password&quot;.",
  act="Registered e-mail: 422 &quot;Wrong email/password combination&quot;. Unregistered: 404 &quot;Email not found sign in first&quot;. Sign-up also says &quot;Email already exists&quot;. An attacker can build a list of valid accounts.",
  cause="<code>signIn</code> in <code>controllers/users.js</code> throws two different errors (NotFound vs Validation) for the two cases.",
  shots=[("04_login_wrong_password.png","Registered e-mail, wrong password"),("05_login_unknown_email.png","Unregistered e-mail")]),
]
SEV_COL = {"Critical":"#b71c1c","High":"#e65100","Medium":"#f9a825","Low":"#2e7d32"}

RCA = ("Bug BUG-01 is caused by a single wrong boolean operator in the <code>updateUser</code> function of <code>backend/controllers/user.js</code>. "
 "The code intends to hash and save the password only when the client sent a non-empty one, and it was written as <code>password !== undefined || password !== \"\"</code>. "
 "Because a value can never be both <code>undefined</code> and an empty string at the same time, at least one side is always true, so the whole condition is always true. "
 "The React Settings form always sends the <code>password</code> field, and it is an empty string when the user does not type a new one. "
 "That empty string is therefore passed to bcrypt, hashed, and stored in place of the real password hash whenever any profile field is saved. "
 "I confirmed this by testing: the original password stopped working after a bio-only save, and an empty password then returned HTTP 200 with a token. "
 "A likely reason it was missed is that a test which only checks that the update returns 200 would still pass, because the damage only shows up when someone logs in again after a profile update. "
 "The fix is to use <code>&amp;&amp;</code> (or simply <code>if (password)</code>), and also to reject empty passwords in the login endpoint. "
 "To prevent regressions, add an automated test that updates a profile without a password and then asserts that the old password still logs in.")

COVER = [
 ("Sign-up: valid user","Pass"),("Sign-up: empty fields (browser <code>required</code>)","Pass (client-side only)"),("Sign-up: invalid e-mail <code>abc</code>","Pass (blocked by browser)"),
 ("Sign-up: duplicate e-mail (exact)","Pass (422 shown)"),("Sign-up: duplicate username","<b>Fail</b> BUG-03"),("Sign-up: weak / 1-char password","<b>Fail</b> BUG-05"),
 ("Sign-up: 300-char username","<b>Fail</b> BUG-07"),("Sign-up: whitespace-only username","<b>Fail</b> BUG-06"),("Sign-up: e-mail differing by case","<b>Fail</b> BUG-04"),
 ("Login: valid credentials","Pass"),("Login: wrong password / unknown e-mail","Pass (rejected) / <b>Fail</b> BUG-10 (message leaks)"),("Login: empty fields","Pass (browser validation, no request sent)"),
 ("Session persists after page reload","Pass"),("Logout clears stored user and navbar","Pass"),("Protected routes (<code>#/editor</code>, <code>#/settings</code>) when logged out","Pass (redirect to home)"),
 ("Create article: valid, with markdown","Pass"),("Create article: empty fields","Pass (browser validation)"),("Create article: whitespace-only","<b>Fail</b> BUG-06"),
 ("Create article: duplicate title","Pass (422 shown; copy has a trailing &quot;..&quot;)"),("Create article: 300-char title","<b>Fail</b> BUG-07"),("Create article: HTML/script in title, description, body, comment","Pass (escaped; no script ran)"),
 ("Create article: unicode / emoji title","Pass (renders) / <b>Fail</b> BUG-09 (slug)"),("Create article: tags 1-2 chars","<b>Fail</b> BUG-08"),
 ("Edit own article (title/body), tags prefilled","Pass (note: URL slug changes with title)"),("Edit/Delete article as another user via API","Pass (403)"),("Edit/Delete without token via API","Pass (401)"),
 ("Delete own article (confirm dialog, redirect, URL then 404)","Pass"),("Comment: add, empty rejected, delete by non-author (403)","Pass"),
 ("Settings: update bio","<b>Fail</b> BUG-01 (side effect)"),("Settings: change e-mail","<b>Fail</b> BUG-02, BUG-04"),("Settings: change username to an existing one","<b>Fail</b> BUG-03"),
 ("Non-existent article / profile / route","Pass (404 page)"),("Pagination (<code>limit</code>/<code>offset</code>) valid values","Pass"),("Pagination invalid values","<b>Fail</b> BUG-07"),
]
MINOR = [
 "Error copy has stray punctuation: &quot;Email already exists.. try logging in&quot;, &quot;Title already exists.. &quot;.",
 "The 404 page is rendered outside the app layout, so the navbar disappears and the user only has &quot;Go to home page&quot; (<code>38_404_page_no_navbar.png</code>).",
 "Editing a title changes the article URL; the old URL immediately returns 404 (bookmarks and shared links break).",
 "A user can follow themselves (<code>POST /api/profiles/&lt;own-name&gt;/follow</code> returns 200 with <code>following:true</code>).",
 "Sign-up has no client-side password minimum while login does (see BUG-05); no show-password toggle or password hint anywhere.",
]

css = """
@page { size: A4; margin: 16mm 14mm; }
body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#222;line-height:1.4}
h1{font-size:22pt;margin:0 0 4px}h2{font-size:14pt;border-bottom:2px solid #333;padding-bottom:3px;margin-top:22px}h3{font-size:11.5pt;margin:0}
table{border-collapse:collapse;width:100%;margin:6px 0}th,td{border:1px solid #bbb;padding:4px 6px;vertical-align:top;font-size:9pt;text-align:left}th{background:#eee}
code{background:#f1f1f1;padding:0 3px;font-size:8.8pt}
.bug{border:1px solid #999;margin:14px 0;padding:10px;page-break-inside:avoid-page}
.sev{color:#fff;padding:1px 8px;border-radius:3px;font-weight:bold;font-size:9pt}
figure{margin:8px 0;text-align:center;page-break-inside:avoid}figure img{border:1px solid #aaa;max-height:260px;width:auto}figcaption{font-size:8pt;color:#555}
ol{margin:3px 0 3px 18px;padding:0}.k{font-weight:bold}.note{background:#fff8e1;border-left:4px solid #f9a825;padding:6px 10px;margin:8px 0}
"""
out = [f"<html><head><meta charset='utf-8'><style>{css}</style></head><body>"]
out.append("<h1>Website QA Report</h1><div><b>Task 1 &ndash; Automation &amp; QA Developer Take-Home</b><br>Tester: Darshan &nbsp;|&nbsp; Date: 10 Nov 2026</div>")
out.append("<h2>1. Scope and test environment</h2>")
out.append("""<div class='note'><b>Important disclosure.</b> The public demo <code>https://demo.realworld.io/</code> could not be reached from the environment where this testing was executed (every request to it, and to other hosted RealWorld demos, failed at network level). The assignment allows &quot;a suitable working RealWorld implementation&quot;, so all testing below was run against a <b>self-hosted copy</b> of a public RealWorld (&quot;Conduit&quot;) implementation. Every bug was found by running the tests described here; none are copied from the repository's issue tracker. Results apply to this implementation and may differ on the hosted demo.</div>""")
out.append("""<table><tr><th style='width:28%'>Item</th><th>Detail</th></tr>
<tr><td>Application under test</td><td>TonyMckes/conduit-realworld-example-app (React + Vite frontend, Express + Sequelize + PostgreSQL 16 backend), commit <code>5e127d8</code></td></tr>
<tr><td>URLs</td><td>Frontend <code>http://localhost:3000/#/</code> (hash routing), API <code>http://localhost:3001/api</code></td></tr>
<tr><td>Browser / tools</td><td>Chromium (Playwright) driving the real UI; <code>curl</code>/fetch for API-level checks; <code>psql</code> to inspect the database</td></tr>
<tr><td>Method</td><td>Black-box UI testing for each flow (sign-up, login, create, edit, delete, logout, comments, settings), then API probing for validation, authorization and error handling. Each scenario was run on a clean database or with unique accounts, and failures were re-run in isolation before being reported. Source code was read only afterwards, to explain the suspected cause.</td></tr>
<tr><td>Not covered</td><td>Hosted demo, other browsers, mobile layout, accessibility audit, load/performance, favorites/follow UI flows (API only).</td></tr></table>""")
out.append("<h2>2. Summary</h2>")
out.append(f"<p>{len(BUGS)} genuine defects were found: 1 Critical, 3 High, 4 Medium, 2 Low. Authorization checks (edit/delete by another user, unauthenticated calls) and output escaping behaved correctly.</p>")
out.append("<table><tr><th>ID</th><th>Severity</th><th>Title</th><th>Area</th></tr>")
for b in BUGS: out.append(f"<tr><td>{b['id']}</td><td><span class='sev' style='background:{SEV_COL[b['sev']]}'>{b['sev']}</span></td><td>{b['title']}</td><td>{b['area']}</td></tr>")
out.append("</table><p style='font-size:8.5pt'><b>Severity:</b> Critical = security/data compromise; High = core function broken or data integrity violated; Medium = wrong behaviour with a workaround; Low = cosmetic or hardening.</p>")
out.append("<h2>3. Test coverage</h2><table><tr><th>Test</th><th>Result</th></tr>")
for t,r in COVER: out.append(f"<tr><td>{t}</td><td>{r}</td></tr>")
out.append("</table>")
out.append("<h2>4. Detailed bug reports</h2>")
for b in BUGS:
    out.append(f"<div class='bug'><h3>{b['id']} &mdash; {b['title']}</h3><p><span class='sev' style='background:{SEV_COL[b['sev']]}'>{b['sev']}</span> &nbsp; Area: {b['area']}</p>")
    out.append("<div class='k'>Steps to reproduce</div><ol>"+"".join(f"<li>{s}</li>" for s in b['steps'])+"</ol>")
    out.append(f"<div><span class='k'>Expected:</span> {b['exp']}</div><div><span class='k'>Actual:</span> {b['act']}</div><div><span class='k'>Suspected cause:</span> {b['cause']}</div>")
    for n,c in b['shots']: out.append(img(n,c))
    out.append("</div>")
out.append("<h2>5. Root cause analysis &ndash; BUG-01 (password overwritten on Settings save)</h2><p>"+RCA+"</p>")
out.append("<h2>6. Other observations (minor)</h2><ul>"+"".join(f"<li>{m}</li>" for m in MINOR)+"</ul>")
out.append("<h2>7. Reproducing this testing</h2><p>Scripts used are in <code>task1-qa/test-scripts/</code> (Playwright) with setup notes in <code>task1-qa/SETUP.md</code>. Screenshots are in <code>task1-qa/screenshots/</code>.</p></body></html>")
(pathlib.Path(__file__).parent / "report.html").write_text("\n".join(out), encoding="utf-8")
