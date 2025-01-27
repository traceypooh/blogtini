import { cfg } from './blogtini.js'

function find_form() {
  return document.querySelector('bt-post-full')?.shadowRoot?.querySelector('.new-comment')
}

function comment_setup() {
  const form = find_form()
  if (!form) {
    // eslint-disable-next-line no-console
    console.log('comment form not found')
    return
  }

  form.querySelector('#comment-form-submit').addEventListener('click', () => {
    form.classList.add('loading')
    form.querySelector('#comment-form-submit').classList.add('hidden') // hide "submit"
    form.querySelector('#comment-form-submitted').classList.remove('hidden') // show "submitted"

    // Construct form action URL form JS to avoid spam
    const { api } = cfg.staticman
    const gitProvider = cfg.git_provider
    const username = cfg.user
    const { repo } = cfg
    const { branch } = cfg.staticman
    const url = ['https:/', api, 'v3/entry', gitProvider, username, repo, branch, 'comments'].join('/')

    // Convert form fields to a JSON-friendly string
    const formObj = Object.fromEntries(new FormData(form))
    const xhrObj = { fields: {}, options: {} }
    Object.entries(formObj).forEach(([key, value]) => {
      const a = key.indexOf('[')
      const b = key.indexOf('reCaptcha')
      if (a === -1) { // key = "g-recaptcha-response"
        xhrObj[key] = value
      } else if (a === 6 || (a === 7 && b === -1)) { // key = "fields[*]", "options[*]"
        xhrObj[key.slice(0, a)][key.slice(a + 1, -1)] = value
      } else { // key = "options[reCaptcha][*]"
        // define xhrObj.options.reCaptcha if it doesn't exist
        xhrObj.options.reCaptcha = xhrObj.options.reCaptcha || {}
        xhrObj.options.reCaptcha[key.slice(b + 11, -1)] = value
      }
    })
    const formData = JSON.stringify(xhrObj)  // some API don't accept FormData objects

    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const { status } = xhr
        if (status >= 200 && status < 400) {
          // eslint-disable-next-line no-use-before-define
          showAlert(form, 'success')
          // eslint-disable-next-line no-use-before-define
          setTimeout(() => { clearForm() }, 3000) // display success message for 3s
          form.classList.remove('loading')
        } else {
          // eslint-disable-next-line no-use-before-define
          showAlert(form, 'failed')
          form.classList.remove('loading')
        }
      }
    }
    xhr.send(formData)
  })

  // record reply target when one of the "reply" buttons is pressed
  document.querySelector('bt-post-full').shadowRoot.querySelectorAll('bt-comment').forEach((e) => {
    e.shadowRoot.querySelector('.comment-reply-btn').addEventListener('click', (evt) => {
      // eslint-disable-next-line no-use-before-define
      resetReplyTarget()
      let cmt = evt.currentTarget
      while (!cmt.matches('.comment')) // find the comment containing the clicked "reply" button
        cmt = cmt.parentNode
      form.querySelector('input[name="fields[replyID]"]').value = cmt.getAttribute('id')
      const replyName = cmt.querySelector('.comment-author').innerText

      // display reply name
      form.querySelector('.reply-notice').classList.remove('hidden')
      form.querySelector('.reply-name').innerText = replyName
    })
  })

  // handle removal of reply target when '×' is pressed
  // eslint-disable-next-line no-use-before-define
  form.querySelector('.reply-close-btn').addEventListener('click', resetReplyTarget)

  // clear form when reset button is clicked
  // eslint-disable-next-line no-use-before-define
  form.querySelector('#comment-form-reset').addEventListener('click', clearForm)
}


function showAlert(form, msg) {
  if (msg === 'success') {
    form.querySelector('.submit-success').classList.remove('hidden')  // show submit success message
    form.querySelector('.submit-failed').classList.add('hidden') // hide submit failed message
  } else {
    form.querySelector('.submit-success').classList.add('hidden') // hide submit success message
    form.querySelector('.submit-failed').classList.remove('hidden')  // show submit failed message
  }
  form.querySelector('#comment-form-submit').classList.remove('hidden') // show "submit"
  form.querySelector('#comment-form-submitted').classList.add('hidden')  // hide "submitted"
}

function resetReplyTarget() {
  const form = find_form()
  form.querySelector('.reply-notice .reply-name').innerText = ''
  form.querySelector('.reply-notice').classList.add('hidden') // hide reply target display
  // empty all hidden fields whose name starts from "reply"
  // eslint-disable-next-line no-return-assign
  Array.from(form.elements).filter((e) => e.name.indexOf('fields[reply') === 0).forEach((e) => e.value = '')
}

// empty all text & hidden fields but not options
function clearForm() {
  resetReplyTarget()
  const form = find_form()
  form.querySelector('.submit-success').classList.add('hidden') // hide submission status
  form.querySelector('.submit-failed').classList.add('hidden') // hide submission status
}

comment_setup()

export default comment_setup
