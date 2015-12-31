var Interview = React.createClass({
	getInitialState: function() {
		//these are obtained in interview.html and sent via tornado templating
		return ({interview_title: interviewtitle,
		video_url: videourl,
		text_url: texturl});
	},

	render: function() {

		return (
			<div>

				<section className="white minH bluetop">
					<div className="container">
						<h1>{this.state.interview_title}</h1>
						<br />
						<br />
						<div>
							<video ref="playback" src={this.state.video_url} id="camera-stream" className="video_capture_window"></video>
							<textarea ref="textarea" className="coding_capture_window" placeholder="..." />
						</div>

						<div className="comment_container">
							<h4>{'Comments (feature coming soon!)'}</h4>
							<div className="comment_box">
								
							</div>
						</div>
					</div>
				</section>
			</div>
		);
	}
});



ReactDOM.render(
  <Interview />,
  document.getElementById('interview')
);
