# Credits & licenses

blogtini's own code is MIT, & its own theme designs are CC BY 4.0 -- see [LICENSE](LICENSE).
Everything below is someone else's work, which blogtini includes under its own license.  Each one's license
file sits next to it; each theme credits its source in its footer, too.  Thank you, all!  (2026-11-07)


## Themes
| theme(s) | from | license | its license file |
|---|---|---|---|
| editorial, massively, phantom, striped, forty, strata, helios, strongly typed, hyperspace | [HTML5 UP](https://html5up.net) templates, by AJ (@ajlkn) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | `theme/<name>/LICENSE.txt` |
| future imperfect (& grid, built on it) | [Hugo Future Imperfect Slim](https://github.com/pacollins/hugo-future-imperfect-slim) (Patrick Collins), a port of [HTML5 UP](https://html5up.net/future-imperfect)'s Future Imperfect | CC BY 3.0 | `theme/future-imperfect/LICENSE.txt` |
| terminal | [Terminal](https://github.com/panr/hugo-theme-terminal), a Hugo theme by panr | MIT | `theme/terminal/LICENSE.md` |
| librarian (built on) | [Tufte CSS](https://github.com/edwardtufte/tufte-css) (Dave Liepmann) | MIT | `theme/librarian/LICENSE-tufte-css.txt` |

**CC BY 3.0 asks for credit:** every HTML5 UP port's footer says "Design: *Name* by HTML5 UP", w/ a link --
keep it.  (future imperfect's footer is `config.yml` `attribution:` -- if your site changes it, keep crediting
HTML5 UP & Hugo Future Imperfect Slim.)


## Fonts & icons
All self-hosted (no font CDNs).

| font | used by | license | its license file |
|---|---|---|---|
| Source Sans Pro, Merriweather, Open Sans, Arvo | HTML5 UP ports | [SIL OFL 1.1](https://openfontlicense.org) | `theme/html5up/fonts/LICENSE-*.txt` |
| Open Sans Condensed, Roboto Slab | HTML5 UP ports | Apache 2.0 | `theme/html5up/fonts/LICENSE-*.txt` |
| Raleway, Source Sans Pro | future imperfect | SIL OFL 1.1 | `theme/future-imperfect/fonts/LICENSE-*.txt` |
| Font Awesome Free (5.15.4 & 5.10.1) | most themes | icons [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), fonts SIL OFL 1.1, code MIT | atop its css (`theme/html5up/fontawesome/css/`, `theme/future-imperfect/css.js`), & `theme/future-imperfect/fonts/LICENSE-font-awesome.txt` |
| ET Book | librarian | MIT | `theme/librarian/fonts/LICENSE-et-book.txt` |
| Courier Prime | librarian, dossier | SIL OFL 1.1 | `theme/librarian/fonts/LICENSE-courier-prime.txt` |
| Special Elite | dossier | Apache 2.0 | `theme/dossier/fonts/LICENSE-special-elite.txt` |
| Allerta Stencil | dossier | SIL OFL 1.1 | `theme/dossier/fonts/LICENSE-allerta-stencil.txt` |
| Fira Code | terminal | SIL OFL 1.1 | `theme/terminal/assets/fonts/LICENSE-fira-code.txt` |


## Libraries
Loaded at runtime from the Internet Archive's esm.sh mirror ([esm.archive.org](https://esm.archive.org)), not
copied in: [lit](https://lit.dev) (BSD-3-Clause), [showdown](https://github.com/showdownjs/showdown) (MIT),
[lunr](https://lunrjs.com) (MIT), [js-yaml](https://github.com/nodeca/js-yaml) (MIT),
[dayjs](https://day.js.org) (MIT), [highlight.js](https://highlightjs.org) (BSD-3-Clause),
[redefine-custom-elements](https://github.com/caridy/redefine-custom-elements) (MIT).
The build, under Node, also uses [jsdom](https://github.com/jsdom/jsdom) (MIT).


## Adding something
A new theme, font or library?  Add its license file next to it, credit it in the theme's footer (if its
license asks), & add a row here.
