# wbig.gs

Personal portal for Wes Biggs, served by GitHub Pages at https://wbig.gs.

Plain static HTML/CSS/JS, so there's no build step.

- `data.js` holds the content: project categories, contributions, and the personal CHANGELOG. To show a repo's social preview image on its card, give the repo an `image` field pointing at a file in `assets/og/`.
- `app.js` renders everything and adds the effects. It also pulls live star counts and push dates from the GitHub API. Any new public repo that isn't in `data.js` shows up automatically under "Fresh from the lab".
- `c64.js` is a small C64 BASIC V2-style interpreter for the boot screen. Visitors `LOAD"WES",8,1` and `RUN` to enter, or it types that for them after 10 seconds. It also handles `LOAD"$",8`, `LIST`, `10 PRINT "HI":GOTO 10`, `POKE 53280,x` and `SYS 64738`. Esc acts as RUN/STOP.
- `CNAME` holds the custom domain.

Run it locally with `python3 -m http.server`, then open http://localhost:8000.
