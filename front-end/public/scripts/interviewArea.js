window.InterviewArea = React.createClass({
    propTypes: {
        type: React.PropTypes.oneOf(["playback","record", "static"]).isRequired,
        defaultText: React.PropTypes.string,
        id: React.PropTypes.string.isRequired,
        onFinish: React.PropTypes.func
    },

    prevTimestamp: 0,

    getInitialState() {
        return {
            recording: false,
            playing: false
        }
    },

    startRecording() {
        var ws = new WebSocket(`wss://${location.host}/api/interviews/record/text`);
        ws.onopen = (evt) => {
            ws.send(this.props.id);
            this.streamCreator = new KeyboardStreamCreator(ws);
            window.streamCreator = this.streamCreator;
            this.setState({recording: true});
            this.refs.interviewVideoArea.startRecording();
        }
    },

    startPlayback() {
        this.setState({playing: true});
        this.refs.playback.play();
        setTimeout(this.nextTextChange, this.props.stream[0].timestamp - this.prevTimestamp);
    },

    stopPlayback() {
        this.refs.playback.pause();
        this.setState({playing: false});
    },

    stopRecording() {
        this.refs.interviewVideoArea.stopRecording();
        this.streamCreator.stopRecording();
        this.props.onFinish();
    },

    nextTextChange() {
        var c = this.props.stream.shift();
        this.refs.interviewTextArea.processChange(c);
        this.prevTimestamp = c.timestamp;
        if (this.props.stream.length > 0 && this.state.playing) {
            setTimeout(this.nextTextChange, this.props.stream[0].timestamp - this.prevTimestamp);
        } else {
            this.stopPlayback();
        }
    },

    render() {
        var videoarea;

        if (this.props.type=="record") {
            videoarea = <InterviewVideoArea ref="interviewVideoArea" set_ws={this.props.set_ws} id={this.props.id} recording={this.state.recording} />
        } else {
            videoarea = <video ref="playback" src={`/outputs/${this.props.id}.webm`} id="camera-stream" className="video_capture_window"></video>
        }

        var button;
        switch(this.props.type) {
            case "playback":
                if (this.state.playing) {
                    button = <div className="tc">
                        <div onClick={this.stopPlayback} className="button">Stop Playback</div>
                    </div>
                } else {
                    button = <div className="tc">
                        <div onClick={this.startPlayback} className="button">Start Playback</div>
                    </div>
                }
                break;
            case "record":
                if (this.state.recording) {
                    button = <div className="tc">
                        <div onClick={this.stopRecording} className="button">Finish Interview</div>
                    </div>
                } else {
                    button = <div className="tc">
                        <div onClick={this.startRecording} className="button">Start Interview</div>
                    </div>
                }
                break;
        }

        var instructionstate = "instructions";
        if(this.state.recording == true || this.state.playback == true)
            instructionstate = "question";

        return <div className="interview_area">
                {videoarea}
                <InterviewTextArea ref="interviewTextArea" defaultValue={this.props.defaultText} streamCreator={this.streamCreator} readOnly={this.props.type !== "playback"} />
                
                <br />
                <InterviewQuestionArea currentstate={instructionstate}/>
                <br />

                {button}
            </div>
    }
});

var InterviewQuestionArea = React.createClass({
    getInitialState: function() {
        return ({question: "Retrieving Question..."});
    },

    getQuestionFromServer: function() {
        $.ajax({
            url: "/api/interviews/record/question",
            cache: false,
            success: function(data) {
                this.setState({question: data});
            }.bind(this),
            error: function(xhr, status, err) {
            }.bind(this)
        });
    },

    componentDidMount: function() {
        this.getQuestionFromServer();
    },

    render() {
        var innerstuff;
        switch(this.props.currentstate) {
            case "instructions":
                innerstuff=(
                    <div className="interview_instructions">
                        <ul>
                            <li><span>Above you can see your video capture(left) and code editor(right)</span></li>
                            <li><span>On clicking start interview you will recieve your question - do your best!</span></li>
                            <li><span>If all is working, click below to begin</span></li>
                        </ul>
                    </div>);
                break;
            case "question":
                innerstuff=(
                    <div className="question_box">
                        {this.state.question}
                    </div>);
                break;
        }

        return (
            <div className="further_instructions">
                {innerstuff}
            </div>
            );
    }
});

var InterviewVideoArea = React.createClass({
    propTypes: {
        id: React.PropTypes.string.isRequired
    },

    getInitialState: function() {
        return ({
            vid_src: "",
            multiStreamRecorder:null,
            blob_no:0,
            video_title: 'vid_0002',
            vSock: null,
            aSock: null
        });
    },

    componentDidMount: function() {
        this.getFeed()
    },

    sendBlobToServer: function(blob) {
        if (this.state.vSock.readyState == WebSocket.OPEN &&
            this.state.aSock.readyState == WebSocket.OPEN) {
            this.state.vSock.send(blob.video);
            this.state.aSock.send(blob.audio);
        }
    },

    startRecording: function() {
        var videoSocket = new WebSocket(`wss://${location.host}/api/interviews/record/video`);
        var audioSocket = new WebSocket(`wss://${location.host}/api/interviews/record/audio`);

        this.props.set_ws(videoSocket, audioSocket);

        videoSocket.onopen = () => videoSocket.send(this.props.id);
        audioSocket.onopen = () => audioSocket.send(this.props.id);

        this.setState({vSock: videoSocket, aSock: audioSocket});
        this.state.multiStreamRecorder.start(5000); //3000 is blob interval time
    },

    stopRecording: function() {
        this.state.multiStreamRecorder.stop()
        //this.state.vSock.close(); //CLOSING LATER!!!
        //this.state.aSock.close(); //CLOSING LATER!!!
    },

    getFeed: function() {
        // Normalize the various vendor prefixed versions of getUserMedia.
        navigator.getUserMedia = (navigator.getUserMedia ||
                                  navigator.webkitGetUserMedia ||
                                  navigator.mozGetUserMedia ||
                                  navigator.msGetUserMedia);

        // Check that the browser supports getUserMedia.
        // If it doesn't show an alert, otherwise continue.
        if (navigator.getUserMedia) {
            // Request the camera.
            navigator.getUserMedia(
                // Constraints
                {
                    video: true,
                    audio: true
                }, (localMediaStream) => { // success callback (with new arrow syntax!!!)

                    // Create an object URL for the video stream and use this
                    // to set the video source.
                    var sauce = window.URL.createObjectURL(localMediaStream);

                    var newmultiStreamRecorder = new MultiStreamRecorder(localMediaStream);
                    newmultiStreamRecorder.audioChannels = 1;
                    newmultiStreamRecorder.bufferSize = 16384;
                    newmultiStreamRecorder.video = this.refs.video;
                    newmultiStreamRecorder.ondataavailable = (blobs) => this.sendBlobToServer(blobs)

                    this.setState({vid_src: sauce, multiStreamRecorder: newmultiStreamRecorder})
                }, (err) => console.log('The following error occurred when trying to use getUserMedia: ' + err)
            )

        } else {
            alert('Sorry, your browser does not support getUserMedia');
        }
    },

    render() {
        return <video ref="video" muted autoPlay id="camera-stream" className="video_capture_window" src={this.state.vid_src}></video>
    }
});


var InterviewTextArea = React.createClass({
    propTypes: {
        defaultValue: React.PropTypes.string,
        streamCreator: React.PropTypes.any,
        readOnly: React.PropTypes.bool
    },

    getInitialState() {
        this.nextCursorLocation = -1;
        return {
            text: this.props.defaultValue || "Type your answer here",
        }
    },

    processChange(change) {
        var t = this.state.text;
        var newText = this.state.text;
        switch (change.type) {
            case "insert":
                newText = t.substring(0,change.location) + change.character + t.substring(change.location);
                this.nextCursorLocation = change.location + 1;
                break;
            case "delete":
                if (change.location < 0)
                    return;
                newText = t.substring(0, change.location) + t.substring(change.location + change.length);
                this.nextCursorLocation = change.location;
                break;
            default:
                console.log("unknown change type");
        }
        this.setState({text: newText});
    },

    eventHandler(e) {
        if (this.props.streamCreator != null) {
            // sends both event and element so selections can be processed correctly
            this.props.streamCreator.handleEvent(e, ReactDOM.findDOMNode(this), this.processChange);
        }
    },

    componentDidUpdate() {
        if (this.nextCursorLocation >= 0) {
            // needed to make sure the cursor position is set after the element has been rendered,
            // otherwise it gets inserted at the end every time the text is changed.
            // Must use requestAnimationFrame due to the JS event loop & DOM updates being all async
            window.requestAnimationFrame(() => {
                if (this._ta == null)
                    this._ta = ReactDOM.findDOMNode(this);
                if (this.nextCursorLocation >= 0) // race conditions when two requestAnimationFrames stack up
                    this._ta.setSelectionRange(this.nextCursorLocation, this.nextCursorLocation);
                this.nextCursorLocation = -1;
            });
        }
    },

    render() {
        return <textarea ref="textarea" onKeyDown={this.eventHandler} onKeyPress={this.eventHandler} className="coding_capture_window" placeholder={this.state.text} onChange={()=>{}}/>
    }

});

class KeyboardStreamCreator {
    constructor(ws) {
        this.ws = ws;
        this.stream = [];
        this.startTime = Date.now();
        this.recording = true;
    }

    handleEvent(e, ta, cb) {
        if (!this.recording)
            return;

        var selection = ta.selectionEnd - ta.selectionStart > 0;

        var change;
        var time = Date.now() - this.startTime;
        if (e.type == "keypress") { // good for handling text input - does not fire on backspace/modifier keys
            var c = e.key;
            if (e.charCode == 13)
                c = "\n"; // otherwise it types the word "Enter", of course.
            change = new Change("insert", ta.selectionStart, time, c);
        } else if (e.type == "keydown") { // handle things like backspace etc
            switch (e.key) {
            case "Delete":
            case "Backspace": // TODO: support backspace whilst holding "alt" for word removal
                change = new Change("delete",
                    selection || e.key == "Delete" ? ta.selectionStart : ta.selectionStart - 1,
                    time,
                    selection ? ta.selectionEnd - ta.selectionStart : 1);
                break;
            case "Tab":
                e.preventDefault();
                change = new Change("insert", ta.selectionStart, time, "\t");
                break;
            }
        }

        if (change) {
            cb(change);
            change.time = Date.now()-this.startTime;
            this.stream.push(change);
            this.ws.send(change.toString());
        }
    }

    stopRecording() {
        this.recording = false;
        this.ws.close();
    }

}
window.KeyboardStreamCreator = KeyboardStreamCreator;

class Change {

    constructor(type, location, timestamp, data) {
        this.type = type;
        this.location = location;
        this.timestamp = timestamp;
        if (type == "insert") {
            this.character = data;
        } else {
            this.length = data;
        }
    }

    toString() {
        if (this.type == "insert") {
            return `i|${this.location}|${this.timestamp}|${this.character}`
        } else {
            return `d|${this.location}|${this.timestamp}|${this.length}`
        }
    }

    static fromString(str) {
        var strs = str.split("|");
        var data = strs[3];
        var type = "insert";
        if (strs[0] == "d") {
            type = "delete";
            data = parseInt(data, 10);
        }

        return new Change(type, parseInt(strs[1],10), parseInt(strs[2],10), data);
    }
}

