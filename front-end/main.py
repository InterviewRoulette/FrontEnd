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

class RecordingHandler(tornado.websocket.WebSocketHandler):
    interviewid = ""
    name = "blank"

    def open(self):
        print("opened " + self.name + " websocket")

    def on_message(self, message):
        if self.interviewid == "":
            self.interviewid = message;
            print("%s websocket connected to interview %s" % (self.name, self.interviewid))
        else:
            self.message(message)

    def message(self, message):
        raise NotImplementedError

    def on_close(self):
        print(self.name + " websocket closed with id" + self.interviewid)


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

class TextRecorder(RecordingHandler):
    name = "text"

    def message(self, message):
        print("sending " + self.interviewid + " " + message + " to redis ")
        self.application.redis.rpush("text:"+self.interviewid, message)

# merges audio and video only if they're both complete - this info is stored in redis
def check_merge_av(r, i):
    if r.get("video:"+i) == "true" and r.get("audio:"+i) == "true":
        print("merging video and audio files")
        subprocess.call("ffmpeg -nostdin -i intermediates/%s_audio.wav -i intermediates/%s_video.webm -c:a libvorbis -c:v copy -shortest public/outputs/%s.webm" % (i,i,i), shell=True)

class VideoRecorder(RecordingHandler):
    name = "video"
    blob_count = 0

    def message(self, message):
        print("%s recieved blob number %d" % (self.name, self.blob_count))
        filename = "%s_%d_video.webm" % (self.interviewid, self.blob_count)
        with open("intermediates/%s_video.txt" % self.interviewid, "a") as f:
            f.write("file '"+filename+"'\n")
        with open("intermediates/%s" % filename, "w") as f:
            f.write(message)
        self.blob_count += 1

    def on_close(self):
        print("video recording stopped, merging files")
        i = self.interviewid
        subprocess.call("ffmpeg -nostdin -f concat -i intermediates/%s_video.txt -c copy intermediates/%s_video.webm" % (i,i), shell=True)
        self.application.redis.set("video:"+i, "true")
        check_merge_av(self.application.redis, i)

class AudioRecorder(RecordingHandler):
    name = "audio"
    blob_count = 0

    def message(self, message):
        print("%s recieved blob number %d" % (self.name, self.blob_count))
        filename = "%s_%d_audio.wav" % (self.interviewid, self.blob_count)
        with open("intermediates/%s_audio.txt" % self.interviewid, "a") as f:
            f.write("file '%s'\n" % filename)

        with open("intermediates/%s" % filename, "wb") as f:
            f.write(message)
        self.blob_count += 1

    def on_close(self):
        print("audio recording stopped, merging files")
        i = self.interviewid
        subprocess.call("ffmpeg -nostdin -f concat -i intermediates/%s_audio.txt -c copy intermediates/%s_audio.wav" % (i,i), shell=True)
        self.application.redis.set("audio:"+i, "true")
        check_merge_av(self.application.redis, i)

def main():
    tornado.options.parse_command_line()

    if not os.path.exists("intermediates/"):
        os.makedirs("intermediates")
    if not os.path.exists("public/outputs"):
        os.makedirs("public/outputs")

    handlers = [
        (r'/', MainHandler),
        (r'/interview.html', Interview),
        (r'/api/getinterviews', GetInterviews),
        (r'/api/interviews/add', AddInterview),
        (r'/api/interviews/record/text', TextRecorder),
        (r'/api/interviews/record/video', VideoRecorder),
        (r'/api/interviews/record/audio', AudioRecorder),
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

    application.redis = redis.StrictRedis(host=redishost, port=6379, db=0)

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
