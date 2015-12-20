#!/usr/bin/env python
import json
import os
import time

import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import define, options

# For using print() to log nicely
from tornado.log import enable_pretty_logging
enable_pretty_logging()

define("port", default=8888, help="run on the given port", type=int)
public_root = os.path.join(os.path.dirname(__file__), 'public')


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.redirect('/index.html')

def main():
    tornado.options.parse_command_line()

    handlers = [
        (r'/', MainHandler),
        (r'/(.*)', tornado.web.StaticFileHandler, {'path': public_root}),
    ]

    application = tornado.web.Application(handlers)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.current().start()

if __name__ == '__main__':
    main()