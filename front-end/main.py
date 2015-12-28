#!/usr/bin/env python
import json
import os
import time

#database imports
import psycopg2 #python+postrgres
import momoko #wrapper for psycopg2
import redis #for storing the text stuff

import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import define, options
from tornado.escape import json_encode
from tornado import gen

# For using print() to log nicely
from tornado.log import enable_pretty_logging
enable_pretty_logging()

define("port", default=8888, help="run on the given port", type=int)
public_root = os.path.join(os.path.dirname(__file__), 'public')

def videoRowToJson(row):
    return {
        "vid": row[0],
        "title": row[1],
        "username": "djprof", #ToDo: FIX THIS!!!
        "video_url": row[2],
        "audio_url": row[3],
        "text_url": row[4],
        "rating": row[5],
        "thumbnail": "www.jamesburnside.com/", #ToDo: ADD THIS TO DATABASE
        "difficulty": row[6],
        "length": row[7],
        "type": row[8],
        "category": row[9],
        "language": row[10],
        "comments":  #ToDo: THIS AS WELL!!!
        [
            {"djprof": "Greatest interview in all existance"},
            {"djprof": "Me again, just rewatched it, this was so good!"},
            {"jb12459": "@djprof, not too bad I guess..."}
        ]
    };


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('public/index.html')


class BaseHandler(tornado.web.RequestHandler):
    @property
    def db(self):
        return self.application.db

class Interview(BaseHandler):
    @gen.coroutine
    def get(self):
        vid = self.get_argument('vid', True)
        cursor = yield self.db.execute("SELECT * FROM videos WHERE vid="+vid)
        videojson = json_encode(videoRowToJson(cursor.fetchone()))
        print(videojson)

        self.render('public/interview.html', interviewdata = videojson)


class GetInterviews(BaseHandler):
    @gen.coroutine
    def get(self):
        # query database
        cursor = yield self.db.execute("SELECT * FROM videos;")
        results = cursor.fetchall();

        # stick results in json to send to client
        interviews = [];
        for row in results:
            interview = videoRowToJson(row)
            interviews.append(interview)

        self.write(json_encode(interviews))

def main():
    tornado.options.parse_command_line()

    handlers = [
        (r'/', MainHandler),
        (r'/interview.html', Interview),
        (r'/api/getinterviews', GetInterviews),
        (r'/(.*)', tornado.web.StaticFileHandler, {'path': public_root}),
    ]

    application = tornado.web.Application(handlers)
    ioloop = tornado.ioloop.IOLoop.current()

    dbpassword = os.environ.get('DATABASEPASSWORD')
    redishost = os.environ.get('REDISHOST')

    application.db = momoko.Pool(
        dsn='dbname=interviewroulettedb user=jb12459 password='+dbpassword+' host=inerviewroulletedb.cyj8bhtufy5o.us-east-1.rds.amazonaws.com port=5432',
        size=1,
        ioloop=ioloop
    )

    r = redis.StrictRedis(host=redishost, port=6379, db=0)
    r.rpush("test", "val")

    future = application.db.connect()
    ioloop.add_future(future, lambda f: ioloop.stop())
    ioloop.start()
    future.result()

    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    ioloop.start()

if __name__ == '__main__':
    main()
