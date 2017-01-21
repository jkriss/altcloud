# altcloud

Altcloud is a web server with some niceties build in so that you can create real applications without any backend code or external services.

The idea is to set up an altcloud server on something like a [Digital Ocean instance](https://digitalocean.com) or a [C.H.I.P.](https://getchip.com/) and run multiple sites off of that single server.

Altcloud is powered by simple configuration files and uses the local filesystem for storage. [It doesn't scale, and that's just fine](https://medium.com/@jkriss/anti-capitalist-human-scale-software-and-why-it-matters-5936a372b9d).

This implementation of the altcloud server is written in node.js, but the specification is platform and language agnostic.

**DISCLAIMER: this is beta software. Please don't trust it just yet.**

## Features

Currently, altcloud supports:

- static files serving
- YAML front matter
- layouts
- Markdown
- friendly urls
- virtual hosts
- usernames and passwords
- basic auth
- cookie-based sessions
- token-based authentication
- path-based access rules
- PUT and DELETE operations (when authorized)
- JSON collections

Coming soon:
- Automatic SSL via Let's Encrypt

## Setup

    npm install -g altcloud

Then create (or go to) the root directory for your server. You'll want to generate keys for token signing and create a user.

    altcloud-keys
    altcloud-add-user your-username your-password >> .passwords

That will create a public and private key under `.keys` and add a username and hashed password to `.passwords`.

(If you're only using the static file server and not authenticating users, you can skip this step.)

## Feature documentation

### Static file serving

This one is easy: any file within your root folder will be served by the server, with the exception of `.keys/private.key` (which will never be served) and special files like `.access`, `.passwords`, and `.tokens` (which by default are not served, but that can be overriden using access rules).

### YAML front matter

YAML front matter is a handy way of specifying metadata in a text file. It looks something like this:

    ---
    layout: layout.html
    ---

    Regular file contents go here!

That top part, separated by `---`, is YAML front matter. We use this for things like layouts.

All files with an `html`, `md`, or `markdown` extension will be scanned for front matter.

### Layouts

If there's a layout specified in the YAML front matter, the contents of the layout file will be used as the "shell", with variables from the front matter passed along, and the contents of the requested file available as `content`, and the current user as `currentUser`.

Here's an example. If you have this file saved as `layout.html`:

    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>{{ title }}</title>
        </style>
      </head>
      <body>

        <h1>{{ title }}</h1>
        <h2>{{ author }}</h2>

        {{ content }}

      </body>
    </html>

...and the following saved as `post.html`:

    ---
    layout: layout.html
    title: Example Post
    author: Jesse Kriss
    ---

    <p>This is a boring example post.</p>

...then that will be rendered as:

    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Example Post</title>
        </style>
      </head>
      <body>

        <h1>Example Post</h1>
        <h2>Jesse Kriss</h2>

        <p>This is a boring example post.</p>

      </body>
    </html>

Note: the contents of the requested file are injected directly, without additional variable replacement. (You can't use front matter variables in the main content.)

### Markdown

[Markdown](https://en.wikipedia.org/wiki/Markdown) is a handy way to write lightly formatted html. If you have a file with a suffix of `md` or `markdown`, that will be converted into html.

Markdown files can have YAML front matter, and work with layouts.

### Friendly urls

You can leave the suffix off of html, md, and markdown files. That is, a request for `/post` will return the rendered result of `/post.html` if no `post` file is present. Also, `/` will server up `index.html`, `index.md`, or `index.markdown`.

Requests for directories without a trailing slash will redirect to the slash version (e.g. `/some-dir` -> `/some-dir/`) and serve up the index page, if present.

### Virtual hosts

Like the good/bad old days of Apache, altcloud supports virtual hosts. This means you can run multiple domains with a single server process and configuration.

Let's say you have the following directory structure:

    /site1
      1.txt
    /site2
      2.txt
    top-level.txt

If you run `altcloud` in that top level directory, you will be able to reach `http://localhost:3000/top-level.txt`, `http://localhost:3000/site1/1.txt`, and `http://localhost:3000/site2/2.txt`, but also `http://site1.localhost:3000/1.txt` and `http://site2.localhost:3000/2.txt`.

If you're running this on a server that has `*.example.com` set up for it in DNS, then you can reach `https://site1.example.com/1.txt` and `https://site2.example.com/2.txt`.

Virtual hosts can be specified by their full hostname, too, so you don't have to have everything on the same top level domain.

    /site1.com
      1.txt
    /site2.com
      2.txt

### Usernames and passwords

Usernames and passwords are stored in a `.passwords` file in the root directory, kind of like the `.htpasswd` files that Apache uses for basic auth.

This is a YAML file where each entry is `username: hashedPassword`. We use bcrypt for password hashing.

The easiest way to add a user is with the `altcloud-add-user` command:

    altcloud-add-user some-username some-password >> .passwords

Please make a note of the password you provide via the command line, since it cannot be extracted from the hashed version stored in the `.passwords` file.

The `.passwords` file must be in the root directory for the server, not in subdirectories (even if they're virtual hosts). All sites served by a given altcloud server will have the same users and passwords.

### Basic auth

Once a username and password pair is present in `.passwords`, those credentials can be provided via basic auth. Altcloud will not prompt for credentials, however, so this is most useful for command line tools like curl.

### Cookie-based sessions

The most comment way to authenticate is by POSTing `username` and `password` to the special `/login` endpoint. This can be as a regular form post, or json.

The simplest method is to have a form like this (typically at `/login.html`, but that's up to you):

    <form method="POST" action="/login">
      <input type="text" name="username"></input>
      <input type="password" name="password"></input>
      <button type="submit">Log in</button>
    </form>

If login is successful, the altcloud server will set a session cookie and redirect to `/`.

To log out, either navigate to `/logout`, or do an HTTP GET for `/logout` via ajax. That will clear the session cookie.

#### Cookie details

The session cookie is [JSON web token](https://jwt.io/), signed (and verified) using the keys in `.keys`. For security reasons, it is not available via javascript.

To make life easier, altcloud also sets a cookie with JSON-formatted user information (currently just username) named `_acu`. (You'll need to parse the JSON in your javascript code, since cookies are stored as strings.) This cookie is not used for authentication.

`TODO: add example handler for failed login`

### Token-based authentication

Sometimes it's handy to be able to authenticate with a single token, provided as a querystring parameter. (This is especially useful for webhooks.)

You can generate a token for this purpose by running the `altcloud-add-token` command:

    altcloud-add-token some-username >> .tokens

This will add a line to the YAML-formatted `.tokens` file of the form `token: username`.

Then you can make requests like '/some-path?token=token-value' and authenticate that way.

### Path-based access rules

This is the key to making altcloud flexible enough to be interesting, even without backend code.

The access files are inspired by Apache's `.htaccess` files, but follow a different format and approach.

Any directory in your altcloud server path can contain a `.access` file. It's a YAML file listing url path patterns and associated rules.

Here's an example:

    /secret.txt:
      read: user1

    /another-secret.txt:
      read: [user1, user2]

This, as you'd expect, means that only user1 can view `/secret.txt`, but both user1 and user2 can read `/another-secret.txt`.

You can also use the special role `authenticated`, which will apply to anyone who is logged in.

    /members-only:
      read: authenticated

It's also possible to use variables in the paths. A segment of a path (between slashes) is specified by `:variable` and a wildcard match (anything *including* slashes) is specified by `*variable`. Then, in the rules, you can use `$variable`.

This lets us do things like create per-user spaces. For instance:

    ~:user/*splat:
      read: $user

...means that user1 can read /~user1/secret.txt or /~user1/subfolder/secret.txt, but nobody else can.

### PUT and DELETE operations

PUT and DELETE are disallowed by default, but can be explicitly allowed via access rules. Building on the previous example:

    ~:user/*splat:
      read: authenticated
      write: $user
      delete: $user

This means that each user can write to (and delete from) their own ~username directory, but authenticated users can view anything in that directory.

You've probably realized that with these permissions, each user could also edit their own `.access` files within their user subdirectories and determine what's allowed within their space.

### JSON collections

It's often handy to return multiple data files with a single request. If a path is marked as a collection, then that path will return a json file containing the file names and contents for all the files in that directory.

For example:

    messages/:user.json:
      read: authenticated
      write: $user
      delete: $user

    messages.json:
      collection: true

This access file means that each user can write messages into their user-specific list of messages, and they can all be fetched together at `/messages.json`.

That is, if `messages/user1.json` contains `[{ "content" : "hi!" }]` and `messages/user2.json` contains `[{ "content" : "hey!" }]`, then `/messages.json` will return

    {
      "messages/user1.json": [{ "content" : "hi!" }],
      "messages/user2.json": [{ "content" : "hey!" }]
    }

### Automatic SSL via Let's Encrypt

**Coming soon**

You'll always want to use SSL in production, since the session cookies (and tokens, and basic auth creds) are unprotected otherwise.

Happily, the amazing [Let's Encrypt](https://letsencrypt.org/) project means we can get SSL certificates for free, and automatically.

You'll want a `.config` file in your root directory that looks something like this:

    letsencrypt:
      email: youremail@example.com

## Running

    npm install -g altcloud
    altcloud .

You can also specify the port, e.g. `altcloud -p 8888`, or use the debug flag to see all logs (`altcloud --debug`).

## Installing on Digital Ocean

Starting from Ubuntu 16.04:

    # install node
    curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
    sudo apt-get install -y nodejs build-essential

    # create a user for altcloud
    adduser --disabled-password --gecos ""  altcloud

    # let node run on low numbered ports (like 80, 443)
    setcap cap_net_bind_service=+ep `readlink -f \`which node\``

    # install altcloud
    npm i -g altcloud

Then you'll want to set it up as a service. Copy `config/altcloud.server` to `/etc/systemd/system/altcloud.service`.

    # create a webroot directory as the altcloud user
    su altcloud
    cd ~
    mkdir webroot

    # create the keys
    altcloud-keys

    # switch back to root and enable the service
    exit
    systemctl enable altcloud
    systemctl start altcloud


