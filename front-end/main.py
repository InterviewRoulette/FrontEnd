#!/usr/bin/env python
import json
import os
import time
import subprocess

#database imports
import psycopg2 #python+postrgres
import momoko #wrapper for psycopg2
import redis #for storing the text stuff

import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket

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
    # URGHHH cant pass these with the blob data so just setting
    # as global variables, can't do multiple interviews tho then
    # will he really test that? maybe...
    username = ""
    interview_title = ""
    v_blob_count = 0
    a_blob_count = 0

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

class AddInterview(BaseHandler):
    @gen.coroutine
    def post(self):
        self.write("lol u got mail m8")

class RecordInterviewText(tornado.websocket.WebSocketHandler):
    def open(self):
        print("websocket open")

    def on_message(self, message):
        self.write_message(u"lol ur talking crap:"+message)

    def on_close(self):
        print("bai sockets")

class VideoHandler(BaseHandler):
    def post(self):
        blob = self.request.body
        videofilename = BaseHandler.interview_title+'_'+str(BaseHandler.v_blob_count)+'.webm'
        directory = os.path.join('intermediates/'+BaseHandler.username)

        #txt file with all blobs in it
        with open(directory+"/"+interview_title+".txt", "a") as f:
            f.write("file '"+videofilename+"'\n")

        #write blob to file
        f = open(directory+'/'+videofilename, 'w')
        f.write(blob)

        #inc blob count
        BaseHandler.v_blob_count+=1

class AudioHandler(BaseHandler):
    def post(self):
        blob = self.request.body

        audiofilename = BaseHandler.interview_title+'_'+str(BaseHandler.a_blob_count)+'.webm'
        directory = os.path.join('intermediates/'+BaseHandler.username)

        with open(directory+"/"+interview_title+".txt", "a") as f:
            f.write("file '"+audiofilename+"'\n")

        f = open(directory+'/'+audiofilename, 'w')
        f.write(blob)

        BaseHandler.a_blob_count+=1

class HelloHandler(BaseHandler):
    def post(self):
        print("Hello - let's start recording our interview")
        jsonstr = json.loads(self.request.body)
        BaseHandler.username = jsonstr['username']
        BaseHandler.interview_title = jsonstr['title']

        directory = os.path.join('intermediates/'+BaseHandler.username)
        if not os.path.exists(directory):
            os.makedirs(directory)

class GoodbyeHandler(BaseHandler):
    def post(self):
        print("Goodbye - lets mergy the video")
        intermediatedirectory = os.path.join('intermediates/'+BaseHandler.username+'/')
        videotxtfile = intermediatedirectory+'/'+BaseHandler.interview_title+'.txt'
        subprocess.call('ffmpeg -f concat -i '+videotxtfile+' -c copy front-end/public/outputs/'+BaseHandler.interview_title+'.webm', shell=True);


def main():
    tornado.options.parse_command_line()

    handlers = [
        (r'/', MainHandler),
        (r'/interview.html', Interview),
        (r'/api/getinterviews', GetInterviews),
        (r'/api/interviews/add', AddInterview),
        (r'/api/interviews/record', RecordInterviewText),

        (r'/api/interviews/blobpiece/video', VideoHandler),
        (r'/api/interviews/blobpiece/audio', AudioHandler),
        (r'/api/interviews/blobpiece/started', HelloHandler),
        (r'/api/interviews/blobpiece/finished', GoodbyeHandler),
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

    future = application.db.connect()
    ioloop.add_future(future, lambda f: ioloop.stop())
    ioloop.start()
    future.result()

    http_server = tornado.httpserver.HTTPServer(application, ssl_options={
        "certfile": os.path.join("cert.pem"),
        "keyfile": os.path.join("key.pem")
    })
    http_server.listen(options.port)
    ioloop.start()

if __name__ == '__main__':
    main()
