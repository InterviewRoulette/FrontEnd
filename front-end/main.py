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
from tornado.process import Subprocess

from tornado.options import define, options
from tornado.escape import json_encode
from tornado import gen

# For using print() to log nicely
from tornado.log import enable_pretty_logging
enable_pretty_logging()

#import aws SDK
import boto3
from boto3.session import Session

#Let's use S3
s3_client = boto3.client('s3')

define("port", default=8888, help="run on the given port", type=int)
public_root = os.path.join(os.path.dirname(__file__), 'public')

def videoRowToJson(row):
    return {
        "vid": row[0],
        "username": row[1],
        "title": row[2],
        "video_url": row[3],
        "audio_url": row[4],
        "text_url": row[5],
        "rating": row[6],
        "thumbnail": "www.jamesburnside.com/", #ToDo: ADD THIS TO DATABASE
        "difficulty": row[7],
        "length": row[8],
        "type": row[9],
        "category": row[10],
        "language": row[11],
        "comments":  #ToDo: THIS AS WELL!!!
        [
            {"djprof": "Greatest interview in all existance"},
            {"djprof": "Me again, just rewatched it, this was so good!"},
            {"jb12459": "@djprof, not too bad I guess..."}
        ]
    }


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('public/index.html')


class BaseHandler(tornado.web.RequestHandler):
    @property
    def db(self):
        return self.application.db

class RecordingHandler(tornado.websocket.WebSocketHandler):
    name = "blank"
    interviewid = ""

    @property
    def redis(self):
        return self.application.redis

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
        cursor = yield self.db.execute("SELECT title,v_url,t_url FROM videos WHERE vid="+vid)
        try:
            v_title = cursor.fetchone()[0]
        except:
            v_title = "title_default"
        try:
            v_url = cursor.fetchone()[1]
        except:
            v_url = "https://s3-eu-west-1.amazonaws.com/interviewroulettevideos/"+vid+".webm"
        try:
            t_url = cursor.fetchone()[2]
        except:
            t_url = "text_url_default"

        self.render('public/interview.html', videotitle = v_title, videourl = v_url, texturl = t_url)


class GetInterviews(BaseHandler):
    @gen.coroutine
    def get(self):
        # query database
        cursor = yield self.db.execute("SELECT * FROM videos;")
        results = cursor.fetchall()

        # stick results in json to send to client
        interviews = [];
        for row in results:
            interview = videoRowToJson(row)
            interviews.append(interview)

        self.write(json_encode(interviews))

class AddInterview(BaseHandler):
    @gen.coroutine
    def post(self):
        interviewtitle = self.request.body

        cursor = yield self.db.execute("INSERT INTO videos (uid, title, rating, difficulty, length, type, catagory, language) VALUES (1, '"+interviewtitle+"',5.0, 3, 3, 1, 'random', 'python') RETURNING vid;")
        videoid = str(cursor.fetchone()[0])

        self.write(videoid)

class TextRecorder(RecordingHandler):
    name = "text"

    def message(self, message):
        print("sending " + self.interviewid + " " + message + " to redis ")
        self.redis.rpush("text:"+self.interviewid, message)

class MediaRecorder(RecordingHandler):
    name = "media"
    type = ""
    format = ""
    blob_count = 0

    def initialize(self, type, format):
        self.type = type
        self.format = format

    def message(self, message):
        print("%s recieved blob number %d" % (self.type, self.blob_count))
        filename = "%s_%d_%s.%s" % (self.interviewid, self.blob_count, self.type, self.format)
        with open("intermediates/%s_%s.txt" % (self.interviewid, self.type), "a") as f:
            f.write("file '"+filename+"'\n")
        with open("intermediates/%s" % filename, "w") as f:
            f.write(message)
        self.blob_count += 1

    @gen.coroutine
    def on_close(self):
        print(self.type + " recording stopped, merging files")
        iid = self.interviewid
        txt = "intermediates/%s_%s.txt" % (iid, self.type)
        out = "intermediates/%s_%s.%s" % (iid, self.type, self.format)

        with open(txt, 'r') as f:
            print(f.read())

        p = Subprocess("ffmpeg -y -nostdin -f concat -i %s -c copy %s" % (txt, out), shell=True)
        yield p.wait_for_exit()
        self.redis.set(self.type+":"+iid, "true")

        if self.redis.get("video:"+iid) == "true" and self.redis.get("audio:"+iid) == "true":
            print("merging video and audio files")
            p = Subprocess("ffmpeg -y -nostdin -i intermediates/%s_audio.wav -i intermediates/%s_video.webm -c:a libvorbis -c:v copy -shortest public/outputs/%s.webm" % (iid,iid,iid), shell=True)
            yield p.wait_for_exit()
            self.redis.set("media:"+iid, "true")
            
            #s3_client.upload_file(local file, bucket, remote name)
            s3_client.upload_file('public/outputs/'+iid+'.webm', 'interviewroulettevideos', iid+'.webm')
            s3_client.put_object_acl(ACL='public-read', Bucket='interviewroulettevideos', Key=iid+'.webm')
            os.remove('public/outputs/'+iid+'.webm')
            print('public/outputs/'+iid+'.webm removed after upload')
            
            #tell client here that all's good to go to watch video on their end

        # cleanup video text file to make testing easier
        try:
            os.remove("intermediates/%s_%s.txt" % (self.interviewid, self.type))
            print("removed old txt file")
        except OSError:
            print("didn't remove old txt file")
            pass

class IsFinishedProcessing(RecordingHandler):
    def post(self):
        iid = self.request.body

        #maybe do this through the text websocket instead....

        #yes - tell client we are ready
        self.write('oui oui')



class GetQuestion(BaseHandler):
    def get(self):
        # query database for question
        self.write("Reverse a Linked List using only two pointers")


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
        (r'/api/interviews/record/finished', IsFinishedProcessing),
        (r'/api/interviews/record/question', GetQuestion),
        (r'/api/interviews/record/text', TextRecorder),
        (r'/api/interviews/record/video', MediaRecorder, dict(type="video", format="webm")),
        (r'/api/interviews/record/audio', MediaRecorder, dict(type="audio", format="wav")),
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
