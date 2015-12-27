window.InterviewArea = React.createClass({
    propTypes: {
        type: React.PropTypes.oneOf(["playback","record", "static"]).isRequired,
        defaultText: React.PropTypes.string,
        id: React.PropTypes.string.isRequired
    },

    getInitialState() {
        return {
            recording: false,
            playing: false
        }
    },

    startRecording() {
        this.streamCreator = new KeyboardStreamCreator();
        window.streamCreator = this.streamCreator;
        this.setState({recording: true});
    },

    startPlayback() {
        this.props.stream.forEach((change) =>
            setTimeout(() =>
                this.refs.interviewTextArea.processChange(change)
            , change.time)
        );
    },

    render() {
        return <div className="interview_area">
                <video src="/" controls></video>
                <InterviewTextArea ref="interviewTextArea" defaultValue={this.props.defaultText} streamCreator={this.streamCreator} readOnly={this.props.type !== "playback"} />
                {(this.props.type == "record" && !this.state.recording) ?
                    <div className="tc">
                        <div onClick={this.startRecording} className="button">Start Recording</div>
                    </div> : (this.props.type == "playback" && !this.state.playing) ?
                    <div className="tc">
                        <div onClick={this.startPlayback} className="button">Start Playback</div>
                    </div> : null}
            </div>
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
                newText = t.substring(0,change.location) + change.text + t.substring(change.location);
                this.nextCursorLocation = change.location + change.text.length;
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
    constructor() {
        this.stream = [];
        this.startTime = Date.now();
    }

    handleEvent(e, ta, cb) {
        var selection = ta.selectionEnd - ta.selectionStart > 0;

        var change;
        if (e.type == "keypress") { // good for handling text input - does not fire on backspace/modifier keys
            var t = e.key;
            if (e.charCode == 13)
                t = "\n"; // otherwise it types the word "Enter", of course.
            change = {
                type: "insert",
                location: ta.selectionStart,
                text: t
            };
        } else if (e.type == "keydown") { // handle things like backspace etc
            switch (e.key) {
            case "Delete":
            case "Backspace": // TODO: support backspace whilst holding "alt" for word removal
                change = {
                    type: "delete",
                    location: selection || e.key == "Delete" ? ta.selectionStart : ta.selectionStart - 1,
                    length: selection ? ta.selectionEnd - ta.selectionStart : 1
                }
                break;
            case "Tab":
                e.preventDefault();
                change = {
                    type: "insert",
                    location: ta.selectionStart,
                    text: "\t"
                }
                break;
            }
        }

        if (change) {
            cb(change);
            change.time = Date.now()-this.startTime;
            this.stream.push(change);
        }

    }

}
window.KeyboardStreamCreator = KeyboardStreamCreator;
