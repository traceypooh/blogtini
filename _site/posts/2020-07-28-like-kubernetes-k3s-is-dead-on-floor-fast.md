---
title: 🌮 Techo Tuesday 🌮Like Kubernetes? k3s is dead-on-floor Fast
date: 2020-07-28
categories:
  - technical
  - techo tuesday
  - coding
tags:
  - coding
  - geek
  - kubernetes
  - k3s
  - docker
  - crictl
  - traefik
  - gitlab
  - rancher
  - https
featured: k3s.jpg
featuredcaption: one-shot install in less than one minute
---
_things turning me on this week_ <br/>
_☕enjoy with a hot cupa java/script_ <br/>
# k3s from Rancher

I've been using `kubeadm`, professionally, for a few years now.
It's been very good.  At [Internet Archive](https://archive.org), we run everything "on-premise".
So using AMZN S3, Google GKE, Azure or similar, are out for us.
After a few "perfect storm" of issues in the last 90 days, I started researching on the web, and in devops Slack communities of 15k to 100k engineers, I started looking into `k3s`.

The current _conventional wisdom_ on `k3s` from [Rancher Labs](https://rancher.com) is that it's small, lightweight, and great/ideal for devices with minimal RAM/CPU, "Internet of Things", raspberry PIs, and more.

However, I'm here to tell you, it seems _fantastic_ for more than just that.

[k3s](https://k3s.io/), not unlike [nomad](https://www.nomadproject.io/), plays a _very cute_ trick.  In it's "one-shot" installer:
```bash
curl -sfL https://get.k3s.io | sh -
```
-- which indeed will be up in seconds, it leverages a single (presently ~50MB) binary single executable (to `/usr/local/bin/k3s`)

But it doesn't end there.  Going with their wonderful "one shot" installer vibe, you _don't need_ `docker` installed, or `kubectl`.  They simply symlink `kubectl` to their binary (and implement full [CNCF](https://www.cncf.io/) verified compatibility) and implement `crictl` API for docker building and deployment.  All with one binary!  (And they _also_ auto-detect and systemd setup a daemon to auto-restart on reboot, etc.)

## Don't Blink

It comes up _so fast_ and ready to go, it's a bit hard to believe!  Give it a try on a virtual machine you have access to.  They have a single "uninstall and remove all traces" script they print out during the install that ... you guessed it, takes only seconds to run.


## So _what's the catch?_

There isn't one, really.  But I _did_ find a few minor things I needed to do to "drop-in replace" with [GitLab](https://gitlab.com) and their full ["Auto DevOps" CI/CD](https://docs.gitlab.com/ee/topics/autodevops/) pipelines (which we use extensively at my work).

Minor things:
- need to change GitLab's annotation from default `nginx ingress` to [traefik](https://containo.us/traefik/) loadbalancer - which is what comes with `k3s`
- remove a GitLab default secret (for https) that doesn't get used with `traefik` and causes auto-https (via `traefik` built-in [lets encrypt](https://letsencrypt.org/) ) to fail
- _as of now_ there's a "one-shot" issue with setting up the admin email address for the lets encrypt part of `traefik`


## Right, so....
I (_continue to_) keep archive.org's
[installers for `kubernetes` and `nomad` installers updated here](https://gitlab.com/internetarchive) via the [kre8](https://gitlab.com/internetarchive/kre8) and [nomad](https://gitlab.com/internetarchive/nomad) repositories.

Here are my notes on GitLab + k3s + k8s full CI/CD:
- [k3s.md](https://gitlab.com/internetarchive/kre8/-/blob/master/README.md)


## Prerequisites:
- `ssh`-able unix node you have `sudo` on
- __wildcard DNS__ pointer to the IP address of your 1st node.  you can, alternatively, temporarily edit your laptop `/etc/hosts` and point some nice internet public url hostnames to your 1st node IP address.


## Helpful links/scripts I maintain actively:
- https://gitlab.com/internetarchive/kre8 -- repo and code used to create and interact with k3s-based kubernetes clusters
- https://gitlab.com/internetarchive/kre8/-/blob/master/README.md -- notes on minor tweaks to `k3s` installer for those interested in https/lets encrypt
- https://gitlab.com/internetarchive/kre8/-/blob/master/k3s-ci.yml -- CI/CD setup and tweaks (some required; some I prefer) to GitLab's Auto DevOps


Give `k3s` a try!
