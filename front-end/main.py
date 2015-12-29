#!/usr/bin/env python
import json
import os
import time
import subprocess

#database imports
import psycopg2 #python+postrgres
import momoko #wrapper for psycopg2

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

class VideoHandler(BaseHandler):
    def post(self):
        video_blob = self.request.body
        videofilename = 'video_'+str(int(time.time()))+'.webm'
        directory = os.path.join('username-videotitle')

        with open(directory+"/video_list.txt", "a") as myfile:
            myfile.write("file '"+videofilename+"'\n")

        f = open(directory+'/'+videofilename, 'w')
        f.write(video_blob)

class AudioHandler(BaseHandler):
    def post(self):
        audio_blob = self.request.body
        directory = os.path.join('username-videotitle')
        audiofilename = 'audio_'+str(int(time.time()))+'.webm'

        with open(directory+"/audio_list.txt", "a") as myfile:
            myfile.write("file '"+audiofilename+"'\n")

        f = open(directory+'/'+audiofilename, 'w')
        f.write(audio_blob)

class HelloHandler(BaseHandler):
    def post(self):
        print("Hello - let's start recording our interview")
        directory = self.request.body
        if not os.path.exists(directory):
            os.makedirs(directory)

class GoodbyeHandler(BaseHandler):
    def post(self):
        print("Goodbye - lets mergy the video")
        directory = self.request.body
        videotxtfile = os.path.join('username-videotitle/video_list.txt')
        subprocess.call('ffmpeg -f concat -i '+videotxtfile+' -c copy output.webm', shell=True);

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
        (r'/api/blobpiece/video', VideoHandler),
        (r'/api/blobpiece/audio', AudioHandler),
        (r'/api/blobpiece/started', HelloHandler),
        (r'/api/blobpiece/finished', GoodbyeHandler),
        (r'/(.*)', tornado.web.StaticFileHandler, {'path': public_root}),
    ]

    application = tornado.web.Application(handlers)
    ioloop = tornado.ioloop.IOLoop.current()

    dbpassword = 'master12459omg'#os.environ.get('DATABASEPASSWORD')

    application.db = momoko.Pool(
        dsn='dbname=interviewroulettedb user=jb12459 password='+dbpassword+' host=inerviewroulletedb.cyj8bhtufy5o.us-east-1.rds.amazonaws.com port=5432',
        size=1,
        ioloop=ioloop
    )

    future = application.db.connect()
    ioloop.add_future(future, lambda f: ioloop.stop())
    ioloop.start()
    future.result()

    http_server = tornado.httpserver.HTTPServer(application)#, ssl_options={
        #"certfile": os.path.join("cert.pem"),
        #"keyfile": os.path.join("key.pem")
    #})
    http_server.listen(options.port)
    ioloop.start()

if __name__ == '__main__':
    main()