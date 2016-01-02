var Interview = React.createClass({
	getInitialState: function() {
		//these are obtained in interview.html and sent via tornado templating
		var changeList = text.map((change) => Change.fromString(change))
		return ({
			playback: false,
			interview_title: interviewtitle,
			video_url: videourl,
			change_list: changeList,
			button_text: "Start Playback",
			showAlert: false
		});
	},

	componentDidMount: function() {
		if(this.state.video_url == null || this.state.video_url === "None")
			this.showAlert();
	},

	showAlert: function() {
		this.setState({showAlert: true});
	},

	closeAlert: function() {
		this.setState({showAlert: false});
	},

	togglePlayback: function() {
		if (this.state.playback)
		{
			this.refs.playback.pause();
			this.setState({
				playback: false,
				button_text: "Start Playback"
			});
		}
		else
		{
			this.refs.playback.play();
			this.setState({
				playback: true,
				button_text: "Stop Playback"
			});
		}
	},

	playback: function() {

	},

	render: function() {

		return (
			<div>

				<section className="white minH bluetop">
					<div className="container">
						<h1>{this.state.interview_title}</h1>
						<br/>
						<InterviewArea type="playback" videoUrl={this.state.video_url} changeList={this.state.change_list} />

						<div className="comment_container">
							<h4>{'Comments (feature coming soon!)'}</h4>
							<div className="comment_box">

							</div>
						</div>
					</div>
				</section>

				{this.state.showAlert ? <NoVideoAlert close={this.closeAlert}/> : null}
			</div>
		);
	}
});


var NoVideoAlert = React.createClass({
	close: function() {
		this.props.close();
	},

	render: function() {
		return (
			<div className="alert">
				<div className="alert_inner">
					<p>Sorry, no interview found!</p>
					<div onClick={this.close} className="button alert_button">Gotcha</div>
				</div>
			</div>);
	}
});


ReactDOM.render(
  <Interview />,
  document.getElementById('interview')
);
