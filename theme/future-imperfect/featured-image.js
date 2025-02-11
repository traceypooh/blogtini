import { unsafeHTML } from 'https://esm.ext.archive.org/lit@3.2.1/directives/unsafe-html.js'
import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'
import {
  url2post, cfg, state, urlify, PR, imgurl,
} from '../../index.js'


customElements.define('featured-image', class extends LitElement {
  static get properties() {
    return {
      url: { type: String },
      mini: { type: Boolean },
      single: { type: Boolean },
    }
  }

  render() {
    const post = url2post(this.url)

    let src = ''
    let alt = ''
    let blur
    let stretch = cfg.image_stretch ?? ''

    if (post.featured) {
      // eslint-disable-next-line max-len
      // xxx original: {{- $src = (path.Join "img" (cond (eq .Params.featuredpath "date") (.Page.Date.Format "2006/01") (.Params.featuredpath)) .Params.featured) | relURL -}}
      src = imgurl(post, false, true)
      alt = post.featuredalt
      stretch = (post.featuredstretch ?? '').toLowerCase()
      blur = post.removeBlur ?? (cfg.remove_blur ?? '')
    } else if (post.images) {
      src = `${state.top_dir}${post.images[0].src}` // xxx use imgurl
      alt = post.images[0].alt
      stretch = (post.images[0].stretch ?? '').toLowerCase()
      blur = post.images[0].removeBlur ?? (cfg.remove_blur ?? '')
    } else if (cfg.img_site) {
      src = `${state.top_dir}${cfg.img_site}`
      blur = post.removeBlur ?? (cfg.remove_blur ?? '')
    } else {
      return ''
    }

    // eslint-disable-next-line no-nested-ternary
    const cls = (stretch === 'vertical' || stretch === 'v'
      ? 'class="stretchV"'
      // eslint-disable-next-line no-nested-ternary
      : (stretch === 'horizontal' || stretch === 'h'
        ? 'class="stretchH"'
        : (stretch === 'cover' || stretch === 'c'
          ? 'class="cover"'
          : '')))

    return html`
    <a href="${urlify(post.url)}"
      class="image ${this.mini ? 'mini' : ''} ${this.single ? 'single' : ''}"
      ${blur ? '' : `style="--bg-image: url('${src}')"`}>
      <img src="${src}" alt="${alt}" ${cls}>
    </a>
    ${unsafeHTML(PR`<center>${post.featuredcaption}</center>`)}`
  }

  static get styles() {
    return css`
.image {
  border: 0;
  display: grid;
  place-items: center;
  margin: 0 -1em 1em -1em;
  overflow: hidden;
  padding-bottom: 33%;
  -webkit-transform: perspective(1000px);
  -ms-transform: perspective(1000px);
  transform: perspective(1000px);
}
.image.mini {
  margin: 0;
}
img {
  position: absolute;
  max-height: 100%;
  transition: transform 0.35s ease-in-out;
}
img.stretchV {
  height: 100%;
}
img.stretchH {
  width: 100%;
}
img.cover {
  object-fit: cover;
  width: 100%;
}
.image[style]::before {
  content: "";
  position: absolute;
  background-image: var(--bg-image);
  background-size: 100% 100%;
  height: 100%;
  width: 100%;
  -webkit-filter: blur(8px);
  filter: blur(8px);
  -webkit-transform: scale(1.1);
  -ms-transform: scale(1.1);
  transform: scale(1.1);
}
.image:hover img {
  -webkit-transform: scale(1.05);
  -ms-transform: scale(1.05);
  transform: scale(1.05);
}

/* OVERRIDES TO FUTURE IMPERFECT ORIGINAL THEME */

/* https://codepen.io/burtclan/pen/mLqxC */
.image {
  box-shadow: inset 0 0 10px 5px;
  position: relative;
  color: #666; /*xxx*/
  padding-bottom: 0; /* override 33% from future imperfect 2022 update */
}
.image:before {
  content: "";
  display: block;
  padding-bottom: calc(100% / 2.35); /* enforce a styley 2.35:1 cinematic aspect ratio */
}
.image:after {
  /* gray blur on edges */
  box-shadow: inset 0 0 10px 5px;
  content: "";
  position: absolute;
  display: block;
  overflow: hidden;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-collapse: separate;
}
img {
  height: auto;
  width: 100%;
  object-fit: cover;
  object-position: center;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
}

img[src*="#bottom"] {
  object-position: bottom;
}

img[src*="#top"] {
  object-position: top;
}


/* OK now when we're showing a full single post, let the image height be fully natural */
/* ie: reverse our customizations above.  Also don't do the edge blurring. */
.image.single {
  box-shadow: none;
  height: auto;
}
.image.single img {
  position: relative;
}
.image.single:after,
.image.single:before {
  display: none;
}

img {
  filter: grayscale(var(--img-grayscale-filter));
}
`
  }
})
