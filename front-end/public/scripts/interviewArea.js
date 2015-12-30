window.InterviewArea = React.createClass({
    propTypes: {
        type: React.PropTypes.oneOf(["playback","record", "static"]).isRequired,
        defaultText: React.PropTypes.string,
        id: React.PropTypes.string.isRequired,
        onFinish: React.PropTypes.func
    },

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
        this.props.stream.forEach((change) =>
            setTimeout(() =>
                this.refs.interviewTextArea.processChange(change)
            , change.time)
        );
        this.setState({playing: true});
    },

    stopPlayback() {
        alert("not yet implemented");
    },

    stopRecording() {
        this.refs.interviewVideoArea.stopRecording();
        this.streamCreator.stopRecording();
        this.props.onFinish();
    },

    render() {
        var videoarea = this.props.type == "record" ? <InterviewVideoArea ref="interviewVideoArea" id={this.props.id} recording={this.state.recording} /> : <video src="/" id="camera-stream" className="video_capture_window"></video>
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

        return <div className="interview_area">
                {videoarea}
                <InterviewTextArea ref="interviewTextArea" defaultValue={this.props.defaultText} streamCreator={this.streamCreator} readOnly={this.props.type !== "playback"} />
                {button}
            </div>
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

        videoSocket.onopen = () => videoSocket.send(this.props.id);
        audioSocket.onopen = () => audioSocket.send(this.props.id);

        this.setState({vSock: videoSocket, aSock: audioSocket});
        this.state.multiStreamRecorder.start(3000); //3000 is blob interval time
    },

    stopRecording: function() {
        this.state.multiStreamRecorder.stop()
        this.state.vSock.close();
        this.state.aSock.close();
    },

    getFeed: function() {
        var thee = this;
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
                },

                // Success Callback
                function(localMediaStream) {

                    // Create an object URL for the video stream and use this
                    // to set the video source.
                    var sauce = window.URL.createObjectURL(localMediaStream);

                    var newmultiStreamRecorder = new MultiStreamRecorder(localMediaStream);
                    newmultiStreamRecorder.audioChannels = 1;
                    newmultiStreamRecorder.ondataavailable = function (blobs) {
                        thee.sendBlobToServer(blobs)
                    };

                    thee.setState({vid_src: sauce, multiStreamRecorder: newmultiStreamRecorder})
                },

                // Error Callback
                function(err) {
                    // Log the error to the console.
                    console.log('The following error occurred when trying to use getUserMedia: ' + err);
                }
            )

        } else {
            alert('Sorry, your browser does not support getUserMedia');
        }
    },

    render() {
        return <video muted autoPlay id="camera-stream" className="video_capture_window" src={this.state.vid_src} controls></video>
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
                this._ta.setSelectionRange(this.nextCursorLocation, this.nextCursorLocation);
                this.nextCursorLocation = -1;
            });
        }
    },

    render() {
        return <textarea ref="textarea" onKeyDown={this.eventHandler} onKeyPress={this.eventHandler} className="coding_capture_window" value={this.state.text} onChange={()=>{}}/>
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

