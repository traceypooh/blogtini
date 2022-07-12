# blogtini

live at:  https://traceypooh.github.io/blogtini/


## Local development
### Option 1
`safari` is nice, you can run the site locally by just
- Developer Tools enabled
- `Develop` menu
  - check `Disable Cross-Origin Restrictions` during development
  - reload html page
  - uncheck `Disable Cross-Origin Restrictions` when done

### Option 2
(any basic static file webserver will do):
```bash
cd _site
( sleep 3; open http://localhost:8000 ) &
python3 -m http.server
```
