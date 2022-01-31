---
title: Vscode in Browser - for Mobile and More
date: 2021-04-19
categories:
  - coding
  - technical
tags:
  - coding
  - vscode
  - geek
  - iphone
  - linux
  - technical
featured: vscode-in-browser.jpg
---

Add VSCode (and its builtin terminal) to your mobile devices!  Edit your code and projects from a browser, backed by a modest virtual machine that hosts your code files and directories.

Inspirations:
- [VSCode on iPad post](https://www.freshblurbs.com/blog/2020/05/03/vscode-ipad-development.html)
- [apple patent: iphone or ipad convertor to laptop](https://appleinsider.com/articles/17/03/23/apple-investigating-accessory-that-turns-iphone-ipad-into-full-fledged-touchscreen-laptop)
- [code-server setup guide](https://github.com/cdr/code-server/blob/main/docs/guide.md)


## Prerequisites
- A VM/server with 1GB+ RAM, 2 cores+.  ($10/month digital ocean ubuntu VM is fine for this).

## Setup code-server
Setup code-server on a VM of your choice.
```bash
wget -qO- https://raw.githubusercontent.com/cdr/code-server/main/install.sh | bash -ex
```

_( you could switch the `~/.config/code-server/config.yaml` file `bind-addr` to `0.0.0.0:8080`,
and then access it over `http://[IP ADDRESS]:8080/` )_

**However!** I'd _strongly recommend_ `https://`, done in minutes (below), if you own a domain
and can add an `A` record with something like `code.DOMAIN` pointing to your IP ADDRESS.

Don't have a domain name?

Get one free at [Freenom](https://www.freenom.com/en/index.html?lang=en) :)


## Setup https access
Install `caddy` (go-based) with built-in lets encrypt and more.
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/cfg/gpg/gpg.155B6D79CA56EA34.key' |sudo apt-key add -
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/cfg/setup/config.deb.txt?distro=debian&version=any-version' |sudo tee -a /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

edit `/etc/caddy/Caddyfile`

change this config line from `:80` to your DNS name, and uncomment the `reverse_proxy` line:
```text
# To use your own domain name (with automatic HTTPS), first make
# sure your domain's A/AAAA DNS records are properly pointed to
# this machine's public IP, then replace the line below with your
# domain name.
code.DOMAIN

# Another common task is to set up a reverse proxy:
reverse_proxy localhost:8080
```

reload caddy
```bash
sudo systemctl reload caddy
```

## Start browsing!
https://[code.DOMAIN]

enter password from your VM's server file: `~/.config/code-server/config.yaml`


## Other
You can restart your `code-server` at any time, if needed for some reason, via:

`sudo systemctl restart code-server@$USER`
