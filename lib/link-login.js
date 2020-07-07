const Path = require("path");
const express = require("express");
const cookieAuth = require("./cookie-auth");
const defaultLogger = require("./default-logger");
const defaultSettings = require("./default-settings");

module.exports = function (options) {
  const logger = defaultLogger(options);
  const app = express();

  const cookies = cookieAuth(options);

  app.get("/admin/link", function (req, res) {
    const isAdmin =
      req.user && options.admins && options.admins.indexOf(req.user) !== -1;
    logger.info("is", req.user, "an admin?", isAdmin);
    if (!isAdmin) return res.sendStatus(401);

    const user = req.query.user || req.user;
    const hours = 24;
    const token = cookies.makeToken(user, {
      exp: Math.floor(Date.now() / 1000) + hours * 60 * 60,
    });
    res.send({ link: "/auth/link?token=" + token, user: user });
  });

  app.get("/auth/link", function (req, res) {
    logger.info("-- logging in with link");
    const token = req.query.token;
    if (token) {
      cookies.validateToken(token, function (err, validToken) {
        if (validToken) {
          logger.info(
            "valid token in link, setting session cookie for",
            validToken.sub
          );
          cookies.setCookie(res, validToken.sub);
        } else {
          logger.info("token in link not valid, ignoring");
        }
        res.redirect(req.query.redirect || "/");
      });
    } else {
      logger.info("No token present in query string, redirecting");
    }
    res.redirect(req.query.redirect || "/");
  });

  return app;
};
