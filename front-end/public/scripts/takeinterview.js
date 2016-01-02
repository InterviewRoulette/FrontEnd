var InterviewApp = React.createClass({
	getInitialState: function() {
		// dont use stage 0 - boring and pointless!
		return ({
			currentStage: 1, 
			showAlert: false, 
			interviewid: null,
			video_websocket: null,
			audio_websocket: null
		});
	},

	nextStage: function() {
		this.setState({currentStage: this.state.currentStage+1});
	},

	showAlert: function() {
		this.setState({showAlert: true});
	},

	closeAlert: function() {
		this.setState({showAlert: false});
	},

	setInterviewID: function(id) {
		this.setState({interviewid: id});
	},

	setWebsocket: function(vs,as) {
		this.setState({video_websocket: vs, audio_websocket: as});
	},

	render: function() {
		var component = null;
		switch(this.state.currentStage){

			//case 0: component = (<InterviewInstructions showAlert={this.showAlert} nextStage={this.nextStage}/>); break;
			case 1: component = (<InterviewDetails setInterviewID={this.setInterviewID} showAlert={this.showAlert} nextStage={this.nextStage}/>); break;
			case 2: component = (<TheInterview iid={this.state.interviewid} showAlert={this.showAlert} nextStage={this.nextStage} set_ws={this.setWebsocket}/>); break;
			// case 3:
			    // this.stream = window.streamCreator.stream;
			    // component = (<PreparingInterview nextStage={this.nextStage}/>);
			    // break;
			// case 4: component = (<NewQuestion nextStage={this.nextStage} stream={this.stream}/>);break;
			case 3: component = (<Finalizing iid={this.state.interviewid} video_websocket={this.state.video_websocket} audio_websocket={this.state.audio_websocket} nextStage={this.nextStage}/>);break;
			case 4: component = (<Finished iid={this.state.interviewid} nextStage={this.nextStage}/>);break;

			default: this.setState({currentStage: 1});
		}

		return (
			<div>
				{component}
				{this.state.showAlert ? <Alert close={this.closeAlert}/> : null}
			</div>
		);

	}
});

var Finished = React.createClass({
	takeToInterview: function() {
		window.location.href="interview.html?vid="+this.props.iid
	},

	render: function() {
		return (
			<section className="white bluetop minH">
				<div className="container">
					<h1>Finished!</h1>

					<center>
						<img src="images/batman.jpg" />
						<h3>You are the real hero</h3>
					</center>

					<br />
					<br />
					<br />

					<div className="tc">
						<div onClick={this.takeToInterview} className="button">Watch Interview</div>
					</div>
				</div>
			</section>
		);
	}
});

var Finalizing = React.createClass({
	getInitialState: function() {
        return ({heardFromServer: false});
    },

    finishedProcessingVideo: function() {
    	this.props.video_websocket.close();
    	this.props.audio_websocket.close();
        this.props.nextStage();
    },

	componentDidMount: function() {
		var thee = this;
		this.props.video_websocket.onmessage = function (message) {
			thee.finishedProcessingVideo();
		};
		this.props.audio_websocket.onmessage = function (message) {
			thee.finishedProcessingVideo();
		};
		this.props.video_websocket.send('close');
		this.props.audio_websocket.send('close');
	},


	render: function() {
		return (
			<section className="white bluetop minH">
				<div className="container">
					<h1>Processing your interview</h1>
					<img className="loading" src="images/loading_gif.gif" />
				</div>
			</section>
		);
	}
});

// var NewQuestion = React.createClass({
// 	render: function() {
// 		return (
// 			<section className="white bluetop minH">
// 				<div className="container">
// 					<h1>Question #1</h1>
//                     <InterviewArea type="playback" id="someid" stream={this.props.stream} onFinish={this.props.nextStage}/>
// 				</div>
// 			</section>
// 		);
// 	}
// });

// var PreparingInterview = React.createClass({
// 	render: function() {
// 		return (
// 			<section className="white bluetop minH">
// 				<div className="container">
// 					<h1>Preparing</h1>

// 					<img className="loading" src="images/loading_gif.gif" />
// 					<div className="tc">
// 						<div onClick={this.props.nextStage} className="button">Manual Continue</div>
// 					</div>
// 				</div>
// 			</section>
// 		);
// 	}
// });

var TheInterview = React.createClass({
	render: function() {
		console.log(this.props.iid)
		return (
			<section className="white bluetop minH">
				<div className="container">
					<h1>All set to begin!</h1>
					<br />
					<br />
                    <InterviewArea type="record" set_ws={this.props.set_ws} id={this.props.iid} onFinish={this.props.nextStage}/>
				</div>
			</section>
		);
	}
});

var InterviewDetails = React.createClass({
	getInitialState: function() {
		return({interviewtitle: null, showAlert: false});
	},

	//get iid from database after adding new interview
    addInterviewToServer: function() {
    	var thee = this;
        $.ajax({
            url: "/api/interviews/add",
            type: "post",
            cache: false,
            data: thee.state.interviewtitle,
            success: function(data) {
            	thee.props.setInterviewID(data);
                thee.props.nextStage();
            }.bind(this),
            error: function(xhr, status, err) {
            }.bind(this)
        });
    },

    continueToNextStage: function() {
    	if(this.state.interviewtitle != null)
    		this.addInterviewToServer();
    	else
    		this.setState({showAlert: true});
    },

    handleChange: function (name, e) {
      var change = {};
      change[name] = e.target.value;
      this.setState(change);
    },

    closeAlert: function() {
    	this.setState({showAlert: false});
    },

	render: function() {
		var notitlealert = this.state.showAlert ? <NoTitleAlert close={this.closeAlert}/> : null;

		return (
			<div>
				<section className="white bluetop">
					<div className="container">
						<h1>Choose your settings</h1>
						<br />
						<br />
						<h4>You are logged in as <span className="emph">djprof</span></h4>
						<table className="mt20">
							<tbody>
								<tr className="interview_choice">
									<td>
										<h4>Choose interview catagory:</h4>
									</td>
									<td>
										<select>
											<option value="strings">Strings</option>
											<option value="linkedlists">LinkedLists</option>
											<option value="bitmanipulation">Bit Manipulation</option>
											<option value="random">Random</option>
										</select>
									</td>
								</tr>
								<tr className="interview_choice">
									<td>
										<h4>Choose interview language:</h4>
									</td>
									<td>
										<select>
											<option value="python">python</option>
											<option value="C++">C++</option>
											<option value="java">java</option>
											<option value="javascript">javascript</option>
											<option value="haskell">haskell</option>
										</select>
									</td>
								</tr>
							</tbody>
						</table>

						<h4>Choose interview difficulty:</h4>
						<div className="option_button ml70 option_button_selected">easy</div>
						<div className="option_button" onClick={this.props.showAlert}>medium</div>
						<div className="option_button" onClick={this.props.showAlert}>hard</div>
						<div className="option_button" onClick={this.props.showAlert}>expert</div>
						<br />
						<br />

						<h4>Choose interview length:</h4>
						<div className="option_button ml70" onClick={this.props.showAlert}>15mins</div>
						<div className="option_button" onClick={this.props.showAlert}>30mins</div>
						<div className="option_button option_button_selected">1hour</div>
						<div className="option_button" onClick={this.props.showAlert}>4x1hour</div>
						<br />
						<br />

						<h4>Choose recording type:</h4>
						<div className="option_button ml70 option_button_selected">video, audio, text</div>
						<div className="option_button" onClick={this.props.showAlert}>audio, text</div>
						<div className="option_button" onClick={this.props.showAlert}>text, only</div>
						<br />
						<br />

						<h4>Finally, enter a name for your video:</h4>
						<input onChange={this.handleChange.bind(this, 'interviewtitle')} className="ml70" type="text" name="video_title" placeholder="enter video name here" />
						<br />
						<br />
						<br />
						<br />

						<div onClick={this.continueToNextStage} className="button">Next Stage</div>
					</div>

				</section>

				{notitlealert}
				
			</div>
		);
	}
});

// var InterviewInstructions = React.createClass({
// 	render: function() {
// 		return (
// 			<div>
// 				<h1 className="orange mpnew">Get Started</h1>

// 				<section className="white minH">
// 					<div className="container">
// 						<div className="getting_started_intro">
// 							<div className="half half1 text_centering">
// 								<img src="images/get_starting_intro.png" height="250px"/>
// 							</div>
// 							<div className="half half2 mt50">
// 								<p className="intro_title">Ready to smash your next coding interview?</p>
// 								<p className="intro_text">Lets get going!</p>
// 							</div>
// 						</div>
// 						<OutlineTable title={"Taking Your Interview"} content={TakingInterviewOutline} />
// 						<OutlineTable title={"Submitting Your Interview"} content={SubmittingInterviewOutline} />
// 						<div className="breaker"></div>
// 						<h3>Ready?</h3>
// 						<br />
// 						<div className="tc">
// 							<div onClick={this.props.nextStage} className="button">Lets Go</div>
// 						</div>
// 					</div>
// 				</section>
// 			</div>
// 		);
// 	}
// });

// var OutlineTable = React.createClass({
// 	render: function() {
// 		return (
// 			<div>
// 				<div className="breaker"></div>
// 				<h3>{this.props.title}</h3>
// 				<table className="get_started_table">
// 					<tbody>
// 						{this.props.content.map(function(entry) {
// 							return (
// 								<tr>
// 									<td><ul><li><span>{entry.words}</span></li></ul></td>
// 									<td className="tc"><img src={"images/"+entry.image} /></td>
// 								</tr>
// 							);
// 						}, this)}
// 					</tbody>
// 				</table>
// 			</div>
// 		);
// 	}
// });

var Alert = React.createClass({
	close: function() {
		this.props.close();
	},

	render: function() {
		return (
			<div className="alert">
				<div className="alert_inner">
					<p>This feature is coming soon!</p>
					<div onClick={this.close} className="button alert_button">Gotcha</div>
				</div>
			</div>);
	}
});

var NoTitleAlert = React.createClass({
	close: function() {
		this.props.close();
	},

	render: function() {
		return (
			<div className="alert">
				<div className="alert_inner">
					<p>Please enter a name for your video</p>
					<div onClick={this.close} className="button alert_button">Gotcha</div>
				</div>
			</div>);
	}
});


// var TakingInterviewOutline = [
// 	{
// 		words: "Before you are asked a question on screen, a timer will appear on screen",
// 		image: "get_starting_intro.jpg"
// 	},
// 	{
// 		words: "You will have an interactive whiteboard from which to code out your answer",
// 		image: "get_starting_intro.jpg"
// 	},
// 	{
// 		words: "Make sure to have some scratch paper to plan your algorithm on!",
// 		image: "get_starting_intro.jpg"
// 	},
// 	{
// 		words: "Each question will have a maximum of 3 hints you can use at will",
// 		image: "get_starting_intro.jpg"
// 	}
// ];

// var SubmittingInterviewOutline = [
// 	{
// 		words: "Some instructions to go here...",
// 		image: "get_starting_intro.jpg"
// 	}
// ]

ReactDOM.render(
  <InterviewApp />,
  document.getElementById('takeinterview')
);
